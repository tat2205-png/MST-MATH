import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync, readdirSync } from "node:fs";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { KNTT_SOURCE_DEFINITIONS } from "./definitions.js";
import type { NlsSourceDefinition, NlsSourceManifest, NlsSourcePairManifest, NlsSourceRecord, NlsSourceRole, TextLayerStatus } from "./types.js";

export class NlsSourceValidationError extends Error {
  constructor(public readonly code: string, message: string) { super(`${code}:${message}`); }
}

const fail = (code: string, message: string): never => { throw new NlsSourceValidationError(code, message); };
const sha256File = (path: string): string => createHash("sha256").update(readFileSync(path)).digest("hex");

export function assertPathContained(sourceRoot: string, candidate: string): void {
  const root = realpathSync(sourceRoot);
  const target = realpathSync(candidate);
  const rel = relative(root, target);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) fail("SOURCE_PATH_ESCAPE", candidate);
}

export function validateDefinitions(definitions: readonly NlsSourceDefinition[] = KNTT_SOURCE_DEFINITIONS): void {
  if (definitions.length !== 9) fail("EXPECTED_SOURCE_COUNT_MISMATCH", String(definitions.length));
  if (new Set(definitions.map((item) => item.sourceId)).size !== definitions.length) fail("DUPLICATE_SOURCE_ID", "Source IDs must be unique");
  if (new Set(definitions.map((item) => item.filename)).size !== definitions.length) fail("DUPLICATE_FILENAME", "Filenames must be unique");
  for (const item of definitions) {
    const match = /^Toan(10|11|12)-(Tap1|Tap2|ChuyenDe)-KNTT(?:-CLEAN)?\.pdf$/.exec(item.filename);
    if (!match) fail("INVALID_FILENAME_MAPPING", item.filename);
    const expectedVolume = match[2] === "Tap1" ? "textbook_volume_1" : match[2] === "Tap2" ? "textbook_volume_2" : "specialized_topic";
    if (Number(match[1]) !== item.grade || expectedVolume !== item.volumeType) fail("INVALID_FILENAME_MAPPING", item.filename);
    const suffix = item.volumeType === "textbook_volume_1" ? "T1" : item.volumeType === "textbook_volume_2" ? "T2" : "CD";
    if (item.sourceId !== `KNTT-MATH-${item.grade}-${suffix}`) fail("INVALID_SOURCE_ID_MAPPING", item.sourceId);
  }
}

function inspectPdf(path: string): { pageCount: number; metadataReadable: boolean } {
  let output: string;
  try { output = execFileSync("pdfinfo", [path], { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }); }
  catch { return fail("PDF_UNREADABLE", path); }
  const pageMatch = /^Pages:\s+(\d+)\s*$/mi.exec(output);
  const pageCount = pageMatch ? Number(pageMatch[1]) : 0;
  if (pageCount <= 0) fail("PDF_PAGE_COUNT_INVALID", path);
  return { pageCount, metadataReadable: /^(Title|Author|Subject|Keywords|Creator|Producer|CreationDate|ModDate):/mi.test(output) };
}

function detectTextLayer(path: string, pageCount: number): TextLayerStatus {
  const samples = [...new Set([1, Math.ceil(pageCount / 2), pageCount])];
  try {
    const populated = samples.filter((page) => execFileSync("pdftotext", ["-f", String(page), "-l", String(page), "-enc", "UTF-8", path, "-"], { encoding: "utf8", windowsHide: true }).replace(/\s/g, "").length > 20).length;
    return populated === samples.length ? "AVAILABLE" : populated > 0 ? "PARTIAL" : "UNAVAILABLE";
  } catch { return "UNKNOWN"; }
}

export function discoverUnknownFiles(sourceRoot: string, definitions: readonly NlsSourceDefinition[] = KNTT_SOURCE_DEFINITIONS): string[] {
  const expected = new Set(definitions.map((item) => item.filename.toLowerCase()));
  return readdirSync(sourceRoot, { withFileTypes: true }).filter((item) => !expected.has(item.name.toLowerCase())).map((item) => item.name).sort();
}

export function registerKnttSources(sourceRoot: string, definitions: readonly NlsSourceDefinition[] = KNTT_SOURCE_DEFINITIONS, sourceRole: NlsSourceRole = "ORIGINAL_REFERENCE"): NlsSourceManifest {
  validateDefinitions(definitions);
  if (!existsSync(sourceRoot) || !lstatSync(sourceRoot).isDirectory()) fail("SOURCE_ROOT_INVALID", sourceRoot);
  const root = resolve(sourceRoot);
  const records: NlsSourceRecord[] = definitions.map((definition) => {
    const path = resolve(root, definition.filename);
    if (!existsSync(path) || !lstatSync(path).isFile()) fail("SOURCE_MISSING", definition.filename);
    assertPathContained(root, path);
    if (extname(path).toLowerCase() !== ".pdf") fail("SOURCE_EXTENSION_INVALID", definition.filename);
    if (!readFileSync(path).subarray(0, 5).equals(Buffer.from("%PDF-"))) fail("PDF_HEADER_INVALID", definition.filename);
    const before = sha256File(path);
    const pdf = inspectPdf(path);
    const textLayerStatus = detectTextLayer(path, pdf.pageCount);
    const after = sha256File(path);
    if (before !== after) fail("SOURCE_MODIFIED", definition.filename);
    const stat = lstatSync(path);
    return { ...definition, sourceRole, subject: "MATHEMATICS", series: "KET_NOI_TRI_THUC", curriculum: "GDPT_2018", language: "vi-VN", sourceKind: "REFERENCE_PDF", sourcePolicy: "READ_ONLY", relativePath: definition.filename, fileExtension: ".pdf", mimeType: "application/pdf", fileSize: stat.size, modifiedAt: stat.mtime.toISOString(), sha256: before, pageCount: pdf.pageCount, textLayerStatus, metadataReadable: pdf.metadataReadable, validationStatus: "PASS" };
  });
  if (new Set(records.map((item) => item.sha256)).size !== records.length) fail("DUPLICATE_CHECKSUM", "Distinct books have identical checksums");
  return { schemaVersion: 1, program: "NA_MATH_NLS", sourceRootEnvironmentVariable: "NA_MATH_NLS_SOURCE_ROOT", expectedSourceCount: 9, sources: records };
}

export function registerKnttSourcePairs(originalRoot: string, cleanRoot: string): NlsSourcePairManifest {
  const original = registerKnttSources(originalRoot, KNTT_SOURCE_DEFINITIONS, "ORIGINAL_REFERENCE");
  const cleanDefinitions = KNTT_SOURCE_DEFINITIONS.map((d) => ({ ...d, filename: d.filename.replace(/\.pdf$/i, "-CLEAN.pdf") }));
  const clean = registerKnttSources(cleanRoot, cleanDefinitions, "CLEAN_CONTENT");
  const pairs = KNTT_SOURCE_DEFINITIONS.map((definition, i) => ({ canonicalSourceId: definition.sourceId, grade: definition.grade, volumeType: definition.volumeType, original: original.sources[i], clean: clean.sources[i], removedPageCount: original.sources[i].pageCount - clean.sources[i].pageCount, pairStatus: "PASS" as const }));
  return { schemaVersion: 1, program: "NA_MATH_NLS", sourceRootEnvironmentVariables: { original: "NA_MATH_NLS_SOURCE_ROOT", clean: "NA_MATH_NLS_CLEAN_SOURCE_ROOT" }, pageNumberPolicy: "ORIGINAL_AND_CLEAN_PHYSICAL_PAGES_ARE_DISTINCT", oldReviewPacketStatus: "STALE_FOR_CLEAN_CORPUS", expectedPairCount: 9, pairs };
}

export const serializeNlsManifest = (manifest: NlsSourceManifest): string => `${JSON.stringify(manifest, null, 2)}\n`;
export const serializeNlsSourcePairManifest = (manifest: NlsSourcePairManifest): string => `${JSON.stringify(manifest, null, 2)}\n`;
