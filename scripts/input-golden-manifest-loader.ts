import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

export type LoadedPageExpectation = {
  golden_id: string;
  page_number: number;
  expected_math: "NONE" | "PRESENT";
  expected_min_math_regions: number;
  expectation_source: string;
  expectation_status: "CONFIRMED";
};

export type LoadedGoldenAsset = {
  golden_id: string;
  source_sha256: string;
  total_expected_pages?: number;
  page_expectations?: LoadedPageExpectation[];
};

const sha256 = (value: Buffer) => createHash("sha256").update(value).digest("hex");
function parseCsv(text: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && next === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value !== "")) records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("MALFORMED_CSV_UNCLOSED_QUOTE");
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    if (record.some((value) => value !== "")) records.push(record);
  }

  const fields = (records.shift() ?? []).map((fieldName) => fieldName.replace(/^\uFEFF/, "").trim());
  return records.map((values) => Object.fromEntries(fields.map((fieldName, index) => [fieldName, values[index] ?? ""])));
}
const blocked = (code: string) => ({ status: "BLOCKED" as const, code });

export function loadGoldenManifest(manifestPath: string, _legacyPageCount = 0) {
  if (!existsSync(manifestPath)) return blocked("MANIFEST_MISSING");
  let rows: Record<string, string>[];
  try {
    rows = parseCsv(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return blocked(error instanceof Error ? error.message : "MANIFEST_MALFORMED_CSV");
  }
  const assets: LoadedGoldenAsset[] = [];
  const assetKeys = new Set<string>();
  for (const row of rows) {
    const asset: LoadedGoldenAsset = { golden_id: row.GoldenFile.trim().replace(/\.[^.]+$/, ""), source_sha256: row.SHA256.trim() };
    if (!row.GoldenFile || assetKeys.has(row.GoldenFile) || [...assetKeys].some((key) => key.replace(/\.[^.]+$/, "") === asset.golden_id)) return blocked("DUPLICATE_ASSET_ROW");
    assetKeys.add(row.GoldenFile);
    if (!row.ExpectationData) { assets.push(asset); continue; }
    if (!existsSync(row.FullPath)) return blocked("SOURCE_MISSING");
    if (!existsSync(row.ExpectationData)) return blocked("EXPECTATION_DATA_MISSING");
    if (sha256(readFileSync(row.FullPath)) !== row.SHA256.toLowerCase()) return blocked("SOURCE_HASH_MISMATCH");
    const expectationBytes = readFileSync(row.ExpectationData);
    if (!row.ExpectationSHA256 || sha256(expectationBytes) !== row.ExpectationSHA256.toLowerCase()) return blocked("EXPECTATION_HASH_MISMATCH");
    const expectations = parseCsv(expectationBytes.toString("utf8"));
    const assetExpectations = expectations.filter((expectation) => expectation.golden_id.trim() === asset.golden_id);
    if (!assetExpectations.length) return blocked(`EXPECTATION_GOLDEN_ID_MISSING:${asset.golden_id}`);
    const pages: LoadedPageExpectation[] = [];
    const keys = new Set<string>();
    for (const expectation of assetExpectations) {
      const page = Number(expectation.page_number || expectation.pdf_page_number);
      const key = `${expectation.golden_id}:${page}`;
      if (expectation.golden_id !== asset.golden_id || !Number.isInteger(page) || keys.has(key)) return blocked("EXPECTATION_PAGE_INVALID");
      if (!['NONE', 'PRESENT'].includes(expectation.expected_math) || expectation.expectation_status !== "CONFIRMED") return blocked("EXPECTATION_UNKNOWN");
      const min = Number(expectation.expected_min_math_regions);
      if ((expectation.expected_math === "NONE" && min !== 0) || (expectation.expected_math === "PRESENT" && min < 1)) return blocked("EXPECTATION_MIN_INVALID");
      keys.add(key);
      pages.push({ golden_id: expectation.golden_id, page_number: page, expected_math: expectation.expected_math as "NONE" | "PRESENT", expected_min_math_regions: min, expectation_source: expectation.expectation_source, expectation_status: "CONFIRMED" });
    }
    const total = Number(row.TotalExpectedPages);
    if (!Number.isInteger(total) || pages.length !== total || pages.some((p, index) => p.page_number !== index + 1)) return blocked("EXPECTATION_PAGE_GAP");
    asset.total_expected_pages = total;
    asset.page_expectations = pages;
    assets.push(asset);
  }
  return { status: "PASS" as const, assets };
}
