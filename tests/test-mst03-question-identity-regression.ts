import assert from "node:assert/strict";
import { QuestionBankService } from "../src/modules/question-bank/bankService.ts";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.ts";
import { createQuestionDocx } from "./question-bank-fixture.ts";

const repository = new MemoryQuestionBankRepository();
const service = new QuestionBankService(repository);
const bytes = createQuestionDocx();

service.importDocx(bytes, "mst03-original.docx");
service.importDocx(bytes, "mst03-copy.pdf");

const snapshot = repository.load();
const original = snapshot.questions[0];
const duplicate = snapshot.questions[4];
const relation = snapshot.relations?.relations.find((item) => item.relations.includes("EXACT_DUPLICATE"));

assert.ok(original);
assert.ok(duplicate);
assert.notEqual(original.id, duplicate.id);
assert.notEqual(original.source.document, duplicate.source.document);
assert.ok(original.source.sourceHash);
assert.ok(duplicate.source.sourceHash);
assert.ok(relation);
assert.notEqual(relation.sourceQuestionId, relation.targetQuestionId);
assert.ok(snapshot.questions.some((question) => question.id === relation.sourceQuestionId));
assert.ok(snapshot.questions.some((question) => question.id === relation.targetQuestionId));
assert.equal(duplicate.duplicateState, "DUPLICATE");
assert.equal(snapshot.questions.length, 8);
assert.equal(snapshot.relations?.duplicateAudit.length, 4);

console.log("MST03_IDENTITY_REGRESSION=PASS");
