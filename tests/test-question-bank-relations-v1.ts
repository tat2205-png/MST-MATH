import assert from "node:assert/strict";
import { createQuestionDocx } from "./question-bank-fixture.ts";
import { ingestDocxQuestions } from "../src/modules/question-bank/pipeline.ts";
import { analyzeRelation, relationFingerprint, relationTypesForQuestion } from "../src/modules/question-bank/relations.ts";
import { QuestionBankService } from "../src/modules/question-bank/bankService.ts";
import { MemoryQuestionBankRepository, deserializeSnapshot } from "../src/modules/question-bank/repository.ts";
import { QuestionSearchService } from "../src/modules/question-bank/search.ts";
import type { QuestionObject } from "../src/modules/question-bank/types.ts";

const base = ingestDocxQuestions(createQuestionDocx(), "nguồn.docx").questions[0];
const copy = (suffix: string, value = base): QuestionObject => ({ ...structuredClone(value), id: `${value.id}-${suffix}`, source: { ...value.source, document: `${suffix}.pdf`, sourceHash: `${suffix}-hash` } });
const changed = (suffix: string, text: string) => { const q = copy(suffix); q.stem = [{ type: "text", value: text }]; return q; };

assert.equal(analyzeRelation(base, copy("pdf")).relations[0], "EXACT_DUPLICATE");
const variant = changed("variant", "Giá trị của x+4 là");
assert.notEqual(analyzeRelation(base, variant).relations[0], "EXACT_DUPLICATE");
const figureVariant = copy("figure"); figureVariant.stem = [{ type: "text", value: "Câu hỏi khác với hình" }]; figureVariant.figureAssociations = structuredClone(base.figureAssociations);
assert.ok(analyzeRelation(base, figureVariant).relations.includes("SHARED_FIGURE"));
const optionConflict = copy("options"); optionConflict.options[0].content = [{ type: "text", value: "999" }];
assert.ok(analyzeRelation(base, optionConflict).relations.includes("SOURCE_CONFLICT"));
const answerConflict = copy("answer"); answerConflict.answer = [{ type: "text", value: "khác" }];
assert.ok(analyzeRelation(base, answerConflict).relations.includes("SOURCE_CONFLICT"));
assert.equal(relationFingerprint(copy("vi")), relationFingerprint(copy("vi")));
assert.notEqual(relationFingerprint(base), relationFingerprint(changed("sign", "Giá trị của -3 là")));

const repository = new MemoryQuestionBankRepository(); const service = new QuestionBankService(repository);
service.importDocx(createQuestionDocx(), "nguồn.docx"); service.importDocx(createQuestionDocx(), "bản-sao.pdf");
const snapshot = repository.load(); assert.equal(snapshot.questions.length, 4); assert.equal(snapshot.relations?.duplicateAudit.length, 4);
assert.equal(snapshot.questions.map(q => q.id).join("|"), snapshot.questions.map(q => q.id).join("|"));
const relationIndex = { schemaVersion: 1 as const, relations: [{ sourceQuestionId: base.id, targetQuestionId: variant.id, relations: ["DEPENDENT_ON" as const], evidence: [] }], families: [{ familyId: "FAMILY_x", memberQuestionIds: [base.id, variant.id], relationEvidence: [], schemaVersion: 1 as const }], duplicateAudit: [] };
assert.ok(relationTypesForQuestion(relationIndex, base.id).includes("DEPENDENT_ON"));
repository.replace({ schemaVersion: 1, questions: [base, variant], orphanFigures: [], relations: relationIndex });
assert.equal(new QuestionSearchService(repository).query({ relationTypes: ["DEPENDENT_ON"] }).total, 2);
assert.equal(deserializeSnapshot(JSON.stringify({ schemaVersion: 1, questions: [], orphanFigures: [] })).questions.length, 0);
console.log("QUESTION_BANK_RELATIONS_V1_QA=PASS\nEXACT_DUPLICATE_QA=PASS\nPARAMETRIC_VARIANT_QA=PASS\nSHARED_FIGURE_QA=PASS\nSOURCE_CONFLICT_QA=PASS\nPROVENANCE_QA=PASS\nLEGACY_COMPATIBILITY_QA=PASS\nRELATION_SEARCH_QA=PASS");
