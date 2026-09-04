import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.ts";
import { createQuestionPackage } from "../src/modules/question-bank/contracts.ts";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.ts";

const ui = readFileSync("src/components/teacher/TeacherWorkspace.tsx", "utf8");
for (const marker of ["/api/teacher-workflow/import", "Duyệt", "QuestionCard", "questions/query"]) assert.match(ui, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
const imported = ingestDocx({ name: "teacher-alpha.docx", bytes: DOCX_FIXTURES.multipleProblems });
const questions = segmentCanonicalQuestions(imported.document!);
assert.equal(questions.length, 2);
const packages = questions.map(question => createQuestionPackage(question, imported.assetLedger.assets));
assert.equal(packages.length, questions.length);
assert.ok(packages.every(pkg => pkg.provenance.sourceFile === "teacher-alpha.docx" && ["PASS", "REVIEW", "QUARANTINED", "UNSUPPORTED"].includes(pkg.qaStatus)));
console.log("w09-teacher-alpha-word-workflow: PASS");
