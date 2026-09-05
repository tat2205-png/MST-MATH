import assert from "node:assert/strict";
import { AssessmentService } from "../src/modules/question-bank/assessment.ts";
import { QuestionBankService } from "../src/modules/question-bank/bankService.ts";
import { ClassroomGameService } from "../src/modules/classroom-game/game.ts";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.ts";
import { QuestionSearchService } from "../src/modules/question-bank/search.ts";
import { createQuestionDocx } from "./question-bank-fixture.ts";

const repository = new MemoryQuestionBankRepository();
new QuestionBankService(repository).importDocx(createQuestionDocx(), "authority-source.docx");

const snapshot = repository.load();
for (const question of snapshot.questions) {
  question.bankStatus = "APPROVED";
  question.duplicateState = "UNIQUE";
}
repository.replace(snapshot);

const search = new QuestionSearchService(repository);

// Runtime-invalid filters must never broaden a query by silently dropping the filter.
const invalidStatus = search.query({ statuses: ["BROKEN" as never] });
assert.equal(invalidStatus.total, 0);
assert.ok(invalidStatus.warnings.some((warning) => warning.code === "UNKNOWN_FILTER"));
const invalidRelation = search.query({ relationTypes: ["BROKEN" as never] });
assert.equal(invalidRelation.total, 0);
assert.ok(invalidRelation.warnings.some((warning) => warning.code === "UNKNOWN_FILTER"));

const approved = snapshot.questions[0];
assert.equal(search.getApprovedById(approved.id)?.id, approved.id);

const assessmentService = new AssessmentService(repository);
const generated = assessmentService.generate({
  seed: "retrieval-authority-v1",
  sections: [
    {
      id: "objective",
      questionType: approved.type,
      count: 1,
      filters: { ids: [approved.id] },
    },
  ],
});
assert.equal(generated.ok, true);
if (!generated.ok) throw new Error("ASSESSMENT_GENERATION_FAILED");

const selectedRef = generated.assessment.sections[0].questionRefs[0];
assert.equal(selectedRef.questionId, approved.id);
assert.equal(assessmentService.materialize(generated.assessment)[0].id, approved.id);

const game = new ClassroomGameService(repository, generated.answerManifest);
const session = game.create(generated.assessment, {
  seed: "retrieval-authority-game",
  mode: "SEQUENTIAL",
  participants: ["student"],
  rounds: [
    {
      id: "round-1",
      assessmentSectionIds: ["objective"],
      pointsPerQuestion: 1,
    },
  ],
});
game.transition(session, "READY");
game.transition(session, "ACTIVE");
const gameRef = game.openQuestion(session, 1000);
assert.equal(game.studentQuestion(gameRef).id, approved.id);

// If authority changes after selection, every reuse surface must re-check current canonical state.
const downgraded = repository.load();
const downgradedQuestion = downgraded.questions.find((question) => question.id === approved.id)!;
downgradedQuestion.bankStatus = "QUARANTINED";
repository.replace(downgraded);
assert.equal(search.getApprovedById(approved.id), undefined);
assert.throws(
  () => assessmentService.materialize(generated.assessment),
  /ASSESSMENT_QUESTION_NOT_APPROVED/,
);
assert.throws(() => game.studentQuestion(gameRef), /GAME_QUESTION_NOT_APPROVED/);
assert.throws(() => game.submit(session, "student", "", 1001), /GAME_QUESTION_NOT_APPROVED/);

// Restoring approval with changed lineage is still stale and must fail closed.
const lineageChanged = repository.load();
const changedQuestion = lineageChanged.questions.find((question) => question.id === approved.id)!;
changedQuestion.bankStatus = "APPROVED";
changedQuestion.source.sourceHash = `${changedQuestion.source.sourceHash}-changed`;
repository.replace(lineageChanged);
assert.throws(() => assessmentService.materialize(generated.assessment), /ASSESSMENT_QUESTION_STALE/);
assert.throws(() => game.studentQuestion(gameRef), /GAME_QUESTION_STALE/);

console.log(
  [
    "INVALID_FILTER_FAIL_CLOSED_QA=PASS",
    "APPROVED_LOOKUP_QA=PASS",
    "ASSESSMENT_REUSE_AUTHORITY_QA=PASS",
    "ASSESSMENT_STALE_LINEAGE_QA=PASS",
    "GAME_REUSE_AUTHORITY_QA=PASS",
    "GAME_STALE_LINEAGE_QA=PASS",
    "RETRIEVAL_AUTHORITY_V1_STATUS=PASS",
  ].join("\\n"),
);
