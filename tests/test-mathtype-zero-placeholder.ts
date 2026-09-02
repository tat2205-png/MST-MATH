import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { parseDocx } from "../src/modules/document-engine/docx/parser.js";

const root = "/Users/mac/PiMath-Acceptance/word-real";
const files = readdirSync(root).filter((file) => file.endsWith(".docx") && !file.startsWith("~$")).sort();
let fallbackCount = 0;
let decodedEquationCount = 0;
for (const file of files) {
  const result = parseDocx(new Uint8Array(readFileSync(`${root}/${file}`)), { sourceName: file });
  const issues = [...result.report.unsupported, ...result.report.errors];
  fallbackCount += issues.filter((issue) => issue.code === "LEGACY_MATHTYPE_NEEDS_FALLBACK").length;
  decodedEquationCount += result.report.statistics.equations;
}
assert.equal(files.length, 11);
assert.equal(fallbackCount, 0);
assert.ok(decodedEquationCount > 0);
console.log("PIMATH_MATHTYPE_ZERO_PLACEHOLDER_QA=PASS");
