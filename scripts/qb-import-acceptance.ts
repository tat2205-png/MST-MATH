import { readFileSync } from "node:fs";
import path from "node:path";
import { importDocxDetailed } from "../src/modules/question-bank/importers/docx.js";

const sourcePath = process.argv[2];
if (!sourcePath || path.extname(sourcePath).toLowerCase() !== ".docx") {
  console.error("Usage: npm run qa:question-bank:acceptance -- <path-to-document.docx>");
  process.exit(2);
}
const bytes = readFileSync(sourcePath); const result = importDocxDetailed(bytes, path.basename(sourcePath)); const d = result.diagnostics;
console.log(`SOURCE=${sourcePath}`);
console.log("EXPECTED_OR_DETECTED_QUESTION_COUNT=DETECTED");
console.log(`ACTUAL_QUESTION_COUNT=${d.questionCandidates}`);
console.log(`MCQ_COUNT=${d.mcq}`);
console.log(`TRUE_FALSE_COUNT=${d.trueFalse}`);
console.log(`SHORT_ANSWER_COUNT=${d.shortAnswer}`);
console.log(`ESSAY_COUNT=${d.essay}`);
console.log(`OMML_FOUND=${d.mathObjects}`);
console.log(`OMML_CONVERTED=${d.mathConverted}`);
console.log(`OMML_WARNINGS=${d.mathWarnings}`);
console.log(`ASSETS_FOUND=${d.assets}`);
console.log(`ASSETS_MAPPED=${d.assetsMapped}`);
console.log(`REVIEW_COUNT=${d.review}`);
console.log(`QUARANTINED_COUNT=${d.quarantined}`);
