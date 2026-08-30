import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { QuestionCard, canonicalQuestionNumberLabel } from "../src/components/teacher/TeacherWorkspace.js";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import { QuestionSearchService } from "../src/modules/question-bank/search.js";
import { ingestDocxQuestions } from "../src/modules/question-bank/pipeline.js";

const sourcePath = process.env.MAS_REAL_DOCX_SOURCE;
if (!sourcePath) throw new Error("MAS_REAL_DOCX_SOURCE is required for canonical question-numbering QA");

const real = ingestDocxQuestions(new Uint8Array(readFileSync(sourcePath)), sourcePath);
assert.equal(real.questions.length, 158);
const sourceNumbers = real.questions.map((question) => question.index).filter((index): index is number => Number.isInteger(index));
const distinctSourceNumbers = [...new Set(sourceNumbers)].sort((left, right) => left - right);
const first = real.questions[0];
const q37 = real.questions.find((question) => question.index === 37);
const last = real.questions.find((question) => question.index === distinctSourceNumbers.at(-1));
assert.ok(first && q37 && last);
assert.equal(distinctSourceNumbers.length, 158);
assert.deepEqual([distinctSourceNumbers[0], q37.index, distinctSourceNumbers.at(-1)], [1, 37, 158]);
assert.equal(canonicalQuestionNumberLabel(first), "Câu 1");
assert.equal(canonicalQuestionNumberLabel(q37), "Câu 37");
assert.equal(canonicalQuestionNumberLabel(last), "Câu 158");
assert.equal(canonicalQuestionNumberLabel({}), undefined);

for (const [question, expected] of [[first, "Câu 1"], [q37, "Câu 37"], [last, "Câu 158"]] as const) {
  const html = renderToStaticMarkup(<QuestionCard question={question} />);
  assert.match(html, new RegExp(`>${expected}<`));
  assert.ok(html.indexOf(expected) < html.indexOf(question.id), "Canonical number must have visual precedence over the internal ID");
}

const missingNumber = structuredClone(first);
delete missingNumber.index;
const missingHtml = renderToStaticMarkup(<QuestionCard question={missingNumber} />);
assert.match(missingHtml, />Không xác định số câu hỏi</);
assert.match(missingHtml, />REVIEW_REQUIRED</);
assert.doesNotMatch(missingHtml, />Câu 1</);

const repository = new MemoryQuestionBankRepository();
repository.replace({ schemaVersion: 1, questions: real.questions, orphanFigures: [] });
const search = new QuestionSearchService(repository);
const ordered = search.query({ includeQuarantined: true, sort: { field: "INDEX", direction: "ASC" }, limit: 100 });
assert.deepEqual(ordered.items.slice(0, 3).map((question) => question.index), [1, 2, 3]);
assert.equal(ordered.items.length, 100, "Visible page size must not be treated as the source question count or last source number");
const filtered = search.query({ includeQuarantined: true, sourceIndices: [37, 158], sort: { field: "INDEX", direction: "ASC" } });
assert.deepEqual(filtered.items.map((question) => question.index), [37, 158]);
assert.deepEqual(filtered.items.map(canonicalQuestionNumberLabel), ["Câu 37", "Câu 158"]);

console.log("QUESTION_NUMBER_MODEL_QA=PASS");
console.log("QUESTION_NUMBER_API_QA=PASS");
console.log("QUESTION_NUMBER_UI_QA=PASS");
console.log("QUESTION_ORDER_STABILITY_QA=PASS");
console.log("QUESTION_COUNT_SEMANTICS_QA=PASS");
console.log("SOURCE_NUMBERING_RANGE_QA=PASS");
