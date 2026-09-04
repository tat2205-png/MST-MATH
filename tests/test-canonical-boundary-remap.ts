import assert from "node:assert/strict";
import {
  canonicalQuestionIdentityKey,
  remapCanonicalBoundaries,
  type CurrentBoundaryRecord,
  type FrozenBoundaryAuthorityRow,
} from "../src/modules/question-bank/canonical-boundary-remap.js";
import type { QuestionIR } from "../src/modules/question-bank/contracts.js";

const q = (
  id: string,
  number: number,
  sourceObjectIds: string[],
  sourceSliceIds: string[],
): QuestionIR => ({
  id,
  questionNumber: number,
  questionType: "SHORT_ANSWER",
  sourceDocumentId: "doc-1",
  sourceObjectIds,
  sourceSliceIds,
  stem: [],
  options: [],
  mathObjectIds: [],
  assetIds: [],
  tableIds: [],
  metadata: {},
  qaStatus: "PASS",
  issues: [],
  provenance: {
    sourceFile: "fixture.docx",
    sourceKind: "DOCX",
    parser: "fixture",
    transformationHistory: [],
  },
});

const currentRecord = (question: QuestionIR, currentOrdinal: number): CurrentBoundaryRecord => ({
  currentOrdinal,
  question,
  sourceDocumentId: question.sourceDocumentId,
  sourceObjectIds: [...question.sourceObjectIds],
  sourceSliceIds: [...(question.sourceSliceIds ?? [])],
  startObjectId: question.sourceObjectIds[0],
  highConfidenceExplicitStart: true,
});

{
  const frozen: FrozenBoundaryAuthorityRow[] = [
    {
      authorityOrdinal: 1,
      questionId: "old-q5",
      sourceDocumentId: "doc-1",
      sourceObjectIds: ["paragraph-100"],
      inAnswerSolutionAppendix: false,
    },
    {
      authorityOrdinal: 2,
      questionId: "old-solution-bank",
      sourceDocumentId: "doc-1",
      sourceObjectIds: ["paragraph-180", "paragraph-181"],
      inAnswerSolutionAppendix: true,
      sourceObjectIdsInAnswerSolutionAppendix: ["paragraph-180", "paragraph-181"],
    },
  ];

  const currentQuestions = [
    q("new-q5", 5, ["paragraph-100"], ["paragraph-100::question-segment-1:TEXTUAL_MARKER"]),
    q("new-q6", 6, ["paragraph-100"], ["paragraph-100::question-segment-2:TEXTUAL_MARKER"]),
    q("unrelated-review", 9, ["paragraph-150"], ["paragraph-150::question-segment-1:TEXTUAL_MARKER"]),
  ];
  const current = currentQuestions.map((question, index) => currentRecord(question, index + 1));

  assert.notEqual(canonicalQuestionIdentityKey(currentQuestions[0]), canonicalQuestionIdentityKey(currentQuestions[1]));

  const result = remapCanonicalBoundaries(frozen, current);
  assert.equal(result.qa, "PASS");
  assert.equal(result.frozenAuthorityCount, 2);
  assert.equal(result.retainedFrozenCount, 1);
  assert.equal(result.retiredFrozenCount, 1);
  assert.equal(result.promotedSplitCount, 1);
  assert.equal(result.selectedQuestionCount, 2);
  assert.equal(result.unresolvedFrozenCount, 0);
  assert.equal(result.ambiguousFrozenCount, 0);
  assert.equal(result.ambiguousPromotionCount, 0);
  assert.equal(result.retained[0].currentQuestionId, "new-q5");
  assert.equal(result.retained[0].matchKind, "SOURCE_RANGE_NARROWED_BY_SPLIT");
  assert.equal(result.promoted[0].currentQuestionId, "new-q6");
  assert.equal(result.promoted[0].parentFrozenQuestionId, "old-q5");
  assert.equal(result.retired[0].frozenQuestionId, "old-solution-bank");
  assert.equal(result.retired[0].reason, "ANSWER_SOLUTION_APPENDIX");
  assert.equal(result.selected.some(row => row.currentQuestionId === "unrelated-review"), false);
}

// Source-ownership remediation: a historical frozen row is proven not to be an
// independent question because its non-appendix source objects now belong to an
// earlier explicit current question, while its remaining tail is an appendix.
// The absorbed frozen row must retire without consuming the legitimate current
// question, so that current question can still be promoted from its retained
// split parent.
{
  const frozen: FrozenBoundaryAuthorityRow[] = [
    {
      authorityOrdinal: 1,
      questionId: "old-parent-q5",
      sourceDocumentId: "doc-1",
      sourceObjectIds: ["paragraph-100"],
      inAnswerSolutionAppendix: false,
    },
    {
      authorityOrdinal: 2,
      questionId: "old-false-continuation",
      sourceDocumentId: "doc-1",
      sourceObjectIds: ["paragraph-102", "paragraph-103", "paragraph-104", "paragraph-105"],
      inAnswerSolutionAppendix: false,
      sourceObjectIdsInAnswerSolutionAppendix: ["paragraph-105"],
    },
    {
      authorityOrdinal: 3,
      questionId: "old-solution-bank",
      sourceDocumentId: "doc-1",
      sourceObjectIds: ["paragraph-180"],
      inAnswerSolutionAppendix: true,
      sourceObjectIdsInAnswerSolutionAppendix: ["paragraph-180"],
    },
  ];

  const currentQ5 = q(
    "new-q5",
    5,
    ["paragraph-100"],
    ["paragraph-100::question-segment-1:TEXTUAL_MARKER"],
  );
  const currentQ6 = q(
    "new-q6",
    6,
    ["paragraph-100", "paragraph-101", "paragraph-102", "paragraph-103", "paragraph-104"],
    [
      "paragraph-100::question-segment-2:TEXTUAL_MARKER",
      "paragraph-101",
      "paragraph-102",
      "paragraph-103",
      "paragraph-104",
    ],
  );

  const result = remapCanonicalBoundaries(
    frozen,
    [currentRecord(currentQ5, 1), currentRecord(currentQ6, 2)],
  );

  assert.equal(result.qa, "PASS");
  assert.equal(result.retainedFrozenCount, 1);
  assert.equal(result.retiredFrozenCount, 2);
  assert.equal(result.promotedSplitCount, 1);
  assert.equal(result.selectedQuestionCount, 2);
  assert.equal(result.unresolvedFrozenCount, 0);

  const absorbed = result.retired.find(row => row.frozenQuestionId === "old-false-continuation");
  assert.ok(absorbed);
  assert.equal(absorbed.reason, "SOURCE_OWNERSHIP_ABSORBED");
  assert.equal(absorbed.decisionSource, "SOURCE_OWNERSHIP_REMEDIATION");
  assert.equal(absorbed.absorbedByCurrentQuestionId, "new-q6");
  assert.deepEqual(absorbed.absorbedSourceObjectIds, ["paragraph-102", "paragraph-103", "paragraph-104"]);
  assert.deepEqual(absorbed.appendixSourceObjectIds, ["paragraph-105"]);
  assert.equal(result.promoted[0].currentQuestionId, "new-q6");
}

console.log("CANONICAL_BOUNDARY_REMAP_TESTS=PASS");
