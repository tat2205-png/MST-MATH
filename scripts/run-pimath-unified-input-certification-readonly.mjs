import { createHash } from "node:crypto";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";

const RESULT_RELATIVE_PATH = "docs/acceptance/PIMATH_UNIFIED_INPUT_V1_CERTIFICATION_RESULTS.json";
const RESULT_PATH = resolve(process.cwd(), RESULT_RELATIVE_PATH);
const CORE_TEST = new URL("../tests/test-pimath-unified-input-certification-v1.ts", import.meta.url);

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function semanticSnapshot(value) {
  const parsed = JSON.parse(value);
  delete parsed.executedAt;
  return JSON.stringify(parsed);
}

if (!fs.existsSync(RESULT_PATH)) {
  throw new Error(`CERTIFICATION_CANONICAL_RESULT_MISSING:${RESULT_RELATIVE_PATH}`);
}

const canonicalBytes = fs.readFileSync(RESULT_PATH);
const canonicalHash = digest(canonicalBytes);
const canonicalText = canonicalBytes.toString("utf8");
let interceptedResult;

const originalWriteFileSync = fs.writeFileSync;
fs.writeFileSync = function guardedWriteFileSync(file, data, options) {
  const candidate = typeof file === "string" ? resolve(process.cwd(), file) : undefined;
  if (candidate === RESULT_PATH) {
    interceptedResult = Buffer.isBuffer(data) ? data.toString("utf8") : String(data);
    return;
  }
  return originalWriteFileSync.call(fs, file, data, options);
};
syncBuiltinESMExports();

let importError;
try {
  await import(CORE_TEST.href);
} catch (error) {
  importError = error;
} finally {
  fs.writeFileSync = originalWriteFileSync;
  syncBuiltinESMExports();
}

const diskBytesAfter = fs.readFileSync(RESULT_PATH);
const diskHashAfter = digest(diskBytesAfter);

if (diskHashAfter !== canonicalHash) {
  throw new Error("CERTIFICATION_READONLY_GUARD_BREACH:CANONICAL_RESULT_MUTATED");
}
if (interceptedResult === undefined) {
  throw new Error("CERTIFICATION_READONLY_GUARD_BREACH:EXPECTED_RESULT_WRITE_NOT_OBSERVED");
}
if (semanticSnapshot(interceptedResult) !== semanticSnapshot(canonicalText)) {
  console.error("CERTIFICATION_SNAPSHOT_SEMANTIC_MATCH=FAIL");
  process.exitCode = 1;
} else {
  console.log("CERTIFICATION_SNAPSHOT_SEMANTIC_MATCH=PASS");
}

console.log("CERTIFICATION_RESULT_WRITE_INTERCEPTED=YES");
console.log("CERTIFICATION_PERSISTENT_MUTATION=NO");
console.log(`CERTIFICATION_CANONICAL_RESULT_SHA256=${canonicalHash}`);

if (importError) throw importError;
