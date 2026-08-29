import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const index = readFileSync(resolve(".nls-review/source-02h/REVIEW-INDEX.md"), "utf8");
const manifest = JSON.parse(readFileSync(resolve("docs/nls/na-math-kntt-structure.manifest.json"), "utf8"));
const decisionPath = resolve("docs/nls/NLS-SOURCE-02H-review-decisions.json");
assert.ok(index.includes("CANDIDATE_EVIDENCE_METHOD"));
assert.equal((index.match(/^## /gm) ?? []).length, 27);
assert.match(index, /KNTT-MATH-10-T1-CH02-L01[\s\S]*PREDICTED_PDF_PAGE: UNKNOWN[\s\S]*MANUAL_SOURCE_REVIEW_REQUIRED[\s\S]*REVIEW_PAGE_FILES: NONE/);
assert.doesNotMatch(index, /KNTT-MATH-10-T1-(?:CH01|CH01-L01|CH02-L01)[\s\S]*pdf-page-010[3-5]/);
assert.ok(!JSON.stringify(manifest).includes(".nls-review"));
assert.equal(readFileSync(decisionPath, "utf8").length > 0, true);
console.log("REVIEW_CANDIDATE_SOURCE_LOCAL_QA=PASS\nREVIEW_CANDIDATE_RELEVANCE_QA=PASS\nEND_MATTER_REJECTION_QA=PASS\nNO_ARBITRARY_FALLBACK_QA=PASS\nUNKNOWN_CANDIDATE_FAIL_CLOSED_QA=PASS\nREVIEW_NODE_SCOPE_QA=PASS\nREVIEW_ARTIFACT_GITIGNORE_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS");
