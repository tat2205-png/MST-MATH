import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const state = JSON.parse(readFileSync("docs/evidence/question-boundary-final/corpus-recomposition.json", "utf8"));
assert.equal(state.candidates.some((x: any) => x.candidateId === "BÀI 2. GTLN-GTNN.docx::candidate-2" && x.state === "CONFIRMED"), false);
assert.equal(state.candidates.some((x: any) => x.candidateId === "NK TEST APP.docx::candidate-21" && x.state === "CONFIRMED"), false);
assert.equal(state.candidates.some((x: any) => x.candidateId === "NK TEST APP.docx::candidate-36" && x.state === "CONFIRMED"), true);
assert.equal(state.candidates.filter((x: any) => x.state === "CONFIRMED").length, 668);
console.log("TARGETED_BOUNDARY_REMEDIATION_QA=PASS");
