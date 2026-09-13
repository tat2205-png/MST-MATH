import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ingestToDocumentIR, validateInputSource } from "../src/modules/document-ingest/index.ts";
type Row = Record<string, string>;
const expected = new Map([
  ["KNTT-MATH-10-T1-V2", "a7548e2a7d9c1c61755395a03f53b2371d36826a2ef6f90ea78ab58cd34a7d50"],
  ["KNTT-MATH-11-CD", "a7b48523d80e956baaff3aa0a75f7d438468c3940f3d4ce7fe2d04d8b6e3e89e"],
  ["KNTT-MATH-12-T2-V2", "ff7a284838228e2d74ee745e3c6e2dd38cc5ce0e86da7266afdd11895ad726e1"],
  ["PIMATH-REAL-IMAGE-01", "92aa0f8caeacf69f8ff876c7b1ab445675c491a9f5c4762204983b57473e9ec7"],
]);
const mirror = process.env.PIMATH_CERT_MIRROR || resolve(process.cwd(), ".pimath-cert-corpus");
console.log(`RESOLVED_CERT_MIRROR_PATH=${mirror}`);
const hash = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
function parseCsv(text: string): Row[] { const records: string[][] = []; let row: string[] = []; let field = ""; let quoted = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (quoted) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c; } else if (c === '"') quoted = true; else if (c === ',') { row.push(field); field = ""; } else if (c === '\n') { row.push(field); records.push(row); row = []; field = ""; } else if (c !== '\r') field += c; } if (field || row.length) { row.push(field); records.push(row); } const headers = (records.shift() ?? []).map((h, i) => i === 0 ? h.replace(/^\uFEFF/, '') : h); return records.filter(r => r.length).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))); }
function fail(message: string, record?: unknown): never { throw new Error(`${message}\nresolvedMirror=${mirror}\nfailedRecord=${JSON.stringify(record)}`); }
assert.ok(existsSync(mirror), `mirror missing: ${mirror}`);
const manifest = join(process.cwd(), "docs/acceptance/PIMATH_UNIFIED_INPUT_V1_CORPUS_MANIFEST.json"); assert.ok(existsSync(manifest)); assert.ok(statSync(manifest).size > 0);
const rows = parseCsv(readFileSync(join(mirror, "MIRROR_HASHES.csv"), "utf8")); assert.equal(rows.length, 4); assert.equal(rows.filter(r => r.Kind === "APPROVED_REAL_PDF").length, 3); assert.equal(rows.filter(r => r.Kind === "REAL_STANDALONE_IMAGE").length, 1);
let matches = 0;
for (const row of rows) { const expectedHash = expected.get(row.CaseId); if (!expectedHash || row.HashMatch.toLowerCase() !== "true") fail("unexpected certification row", row); const relative = row.MirrorPath.split(/\.pimath-cert-corpus[\\/]/i)[1]; const path = resolve(mirror, relative); if (!existsSync(path)) fail("mirror source missing", row); const bytes = readFileSync(path); const actual = hash(bytes); assert.equal(actual, expectedHash); assert.equal(row.SourceHash, expectedHash); assert.equal(row.MirrorHash, expectedHash); matches++; const name = path.split(/[\\/]/).pop()!; const source = { name, bytes: new Uint8Array(bytes) }; const accepted = validateInputSource(source); assert.equal(accepted.fileIntegrity, "VALID"); const first = ingestToDocumentIR(source); const second = ingestToDocumentIR(source); assert.equal(first.sourceHash, expectedHash); assert.deepEqual(first, second); assert.equal(hash(readFileSync(path)), actual); if (row.Kind === "APPROVED_REAL_PDF") assert.ok(first.blocks.every(b => b.sourceLocation.includes(":page:"))); else { assert.equal(first.figures.length, 1); assert.equal(first.extractionIssues[0]?.status, "REVIEW"); } }
console.log(`NODE_CERT_CORPUS_ACCESS_QA=PASS\nMIRROR_PDF_COUNT=3\nMIRROR_STANDALONE_IMAGE_COUNT=1\nMIRROR_HASH_MATCH_COUNT=${matches}\nMIRROR_HASH_MISMATCH_COUNT=0\nCERT_CORPUS_WRITE_COUNT=0\nREAL_SOURCE_PDF_QA=PASS\nREAL_STANDALONE_IMAGE_QA=PASS\nREAL_STANDALONE_IMAGE_SEMANTIC_ACCURACY=NOT_CLAIMED_WITHOUT_HUMAN_REFERENCE`);
