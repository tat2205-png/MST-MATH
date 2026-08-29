import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DEFAULT_NLS_SOURCE_ROOT, KNTT_SOURCE_DEFINITIONS, NLS_SOURCE_IDS, NlsSourceValidationError, assertPathContained, discoverUnknownFiles, registerKnttSources, serializeNlsManifest, validateDefinitions } from "../src/modules/nls-source-registry/index.js";

assert.equal(KNTT_SOURCE_DEFINITIONS.length, 9);
assert.deepEqual(KNTT_SOURCE_DEFINITIONS.map((item) => item.sourceId), [...NLS_SOURCE_IDS]);
assert.equal(new Set(KNTT_SOURCE_DEFINITIONS.map((item) => item.sourceId)).size, 9);
validateDefinitions();
for (const item of KNTT_SOURCE_DEFINITIONS) {
  assert.match(item.filename, new RegExp(`^Toan${item.grade}-`));
  assert.equal(item.volumeType, item.filename.includes("Tap1") ? "textbook_volume_1" : item.filename.includes("Tap2") ? "textbook_volume_2" : "specialized_topic");
}

const sourceRoot = process.env.NA_MATH_NLS_SOURCE_ROOT || DEFAULT_NLS_SOURCE_ROOT;
const before = new Map(KNTT_SOURCE_DEFINITIONS.map((item) => [item.filename, readFileSync(join(sourceRoot, item.filename))]));
const manifest = registerKnttSources(sourceRoot);
assert.equal(manifest.sources.length, 9);
assert.equal(new Set(manifest.sources.map((item) => item.sha256)).size, 9);
assert.ok(manifest.sources.every((item) => item.validationStatus === "PASS" && item.pageCount > 0 && /^[a-f0-9]{64}$/.test(item.sha256)));
assert.ok(manifest.sources.every((item) => ["AVAILABLE", "PARTIAL", "UNAVAILABLE", "UNKNOWN"].includes(item.textLayerStatus)));
assert.equal(serializeNlsManifest(manifest), serializeNlsManifest(registerKnttSources(sourceRoot)));
assert.ok(KNTT_SOURCE_DEFINITIONS.every((item) => readFileSync(join(sourceRoot, item.filename)).equals(before.get(item.filename)!)));
assert.deepEqual(discoverUnknownFiles(sourceRoot), []);

const committed = JSON.parse(readFileSync(resolve("docs", "nls", "na-math-nls-sources.manifest.json"), "utf8"));
assert.deepEqual(committed, manifest);
assert.equal(committed.schemaVersion, 1);
assert.deepEqual(committed.sources.map((item: { sourceId: string }) => item.sourceId), [...NLS_SOURCE_IDS]);

const temp = mkdtempSync(join(tmpdir(), "nls-source-test-"));
try {
  assert.throws(() => registerKnttSources(join(temp, "missing")), (error: unknown) => error instanceof NlsSourceValidationError && error.code === "SOURCE_ROOT_INVALID");
  mkdirSync(join(temp, "corpus"));
  writeFileSync(join(temp, "corpus", KNTT_SOURCE_DEFINITIONS[0].filename), "%PDF-corrupt");
  assert.throws(() => registerKnttSources(join(temp, "corpus")), (error: unknown) => error instanceof NlsSourceValidationError && error.code === "PDF_UNREADABLE");
  writeFileSync(join(temp, "outside.pdf"), "%PDF-corrupt");
  assert.throws(() => assertPathContained(join(temp, "corpus"), join(temp, "outside.pdf")), /SOURCE_PATH_ESCAPE/);
  writeFileSync(join(temp, "corpus", "unknown.txt"), "preserve me");
  assert.ok(discoverUnknownFiles(join(temp, "corpus")).includes("unknown.txt"));
} finally { rmSync(temp, { recursive: true, force: true }); }

const trackedPdfs = readFileSync(resolve(".gitignore"), "utf8");
assert.doesNotMatch(trackedPdfs, /^\*\.pdf$/m);
const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8", windowsHide: true }).split(/\r?\n/);
assert.ok(KNTT_SOURCE_DEFINITIONS.every((item) => !trackedFiles.some((path) => path.toLowerCase().endsWith(item.filename.toLowerCase()))));
console.log("NLS_SOURCE_DISCOVERY_QA=PASS\nSOURCE_REGISTRY_QA=PASS\nSOURCE_ID_UNIQUENESS_QA=PASS\nSOURCE_FILENAME_MAPPING_QA=PASS\nSOURCE_PATH_CONTAINMENT_QA=PASS\nSOURCE_CHECKSUM_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS\nMANIFEST_QA=PASS");
