import assert from "node:assert/strict";

import {
  createQuestionPackage,
  questionIRCombinationIssues,
} from "../src/modules/question-bank/contracts.js";

import type {
  BaseQuestionIR,
  QuestionIR,
} from "../src/modules/question-bank/contracts.js";

import {
  questionPackageToQuestionObject,
} from "../src/modules/question-bank/package-integration.js";

const provenance = {
  sourceFile: "semantic.docx",
  sourceSha256: "b".repeat(64),
  sourceKind: "DOCX",
  parser: "TECH02",
  transformationHistory: [],
};

const base = (
  id: string,
): BaseQuestionIR => ({
  id,
  questionNumber: 1,
  sourceDocumentId: "doc-semantic",
  sourceObjectIds: ["p1"],
  stem: [
    {
      type: "text",
      value: "Stem",
    },
  ],
  options: [],
  mathObjectIds: [],
  assetIds: [],
  tableIds: [],
  metadata: {},
  qaStatus: "PASS",
  issues: [],
  provenance,
});

const tf: QuestionIR = {
  ...base("tf-1"),
  questionType: "TRUE_FALSE",
  trueFalseItems: [
    {
      label: "a",
      content: [
        {
          type: "text",
          value: "Statement A",
        },
      ],
    },
    {
      label: "b",
      content: [
        {
          type: "text",
          value: "Statement B",
        },
      ],
    },
  ],
};

const sa: QuestionIR = {
  ...base("sa-1"),
  questionType: "SHORT_ANSWER",

  // Structured response/question semantic content.
  shortAnswer: [
    {
      type: "text",
      value: "Enter the computed value.",
    },
  ],

  // Separate canonical answer-key authority.
  answer: [
    {
      type: "text",
      value: "42",
    },
  ],
};

const essay: QuestionIR = {
  ...base("essay-1"),
  questionType: "ESSAY",
  subquestions: [
    {
      label: "a",
      content: [
        {
          type: "text",
          value: "Part A",
        },
      ],
    },
    {
      label: "b",
      content: [
        {
          type: "text",
          value: "Part B",
        },
      ],
    },
  ],
};

/*
 * Backward compatibility:
 * legacy valid QuestionIR objects do not need any newly approved
 * semantic field to remain representable.
 */
const legacyMcq: QuestionIR = {
  ...base("legacy-mcq"),
  questionType: "MULTIPLE_CHOICE",
  options: [
    {
      label: "A",
      content: [
        {
          type: "text",
          value: "1",
        },
      ],
    },
  ],
};

assert.doesNotThrow(
  () => createQuestionPackage(legacyMcq),
);

const tf2 =
  questionPackageToQuestionObject(
    createQuestionPackage(tf),
  );

const sa2 =
  questionPackageToQuestionObject(
    createQuestionPackage(sa),
  );

const essay2 =
  questionPackageToQuestionObject(
    createQuestionPackage(essay),
  );

assert.deepEqual(
  tf2.trueFalseItems,
  tf.trueFalseItems,
);

assert.deepEqual(
  tf2.trueFalseItems.map((item) => item.label),
  ["a", "b"],
);

assert.deepEqual(
  sa2.shortAnswer,
  sa.shortAnswer,
);

assert.deepEqual(
  sa2.answer,
  sa.answer,
);

assert.notDeepEqual(
  sa2.shortAnswer,
  sa2.answer,
);

assert.deepEqual(
  essay2.subquestions,
  essay.subquestions,
);

assert.deepEqual(
  essay2.subquestions.map((item) => item.label),
  ["a", "b"],
);

/*
 * Runtime guard for serialized/untyped payloads.
 * These casts intentionally simulate data crossing the TS boundary.
 */
const invalidMcq = {
  ...legacyMcq,
  trueFalseItems: tf.trueFalseItems,
} as unknown as QuestionIR;

assert.ok(
  questionIRCombinationIssues(
    invalidMcq,
  ).includes(
    "MCQ_WITH_TRUE_FALSE_ITEMS",
  ),
);

assert.throws(
  () =>
    createQuestionPackage(
      invalidMcq,
    ),
  /INVALID_QUESTION_IR_COMBINATION/,
);

const invalidTrueFalse = {
  ...tf,
  options: legacyMcq.options,
} as unknown as QuestionIR;

assert.ok(
  questionIRCombinationIssues(
    invalidTrueFalse,
  ).includes(
    "TRUE_FALSE_WITH_OPTIONS",
  ),
);

assert.throws(
  () =>
    createQuestionPackage(
      invalidTrueFalse,
    ),
  /INVALID_QUESTION_IR_COMBINATION/,
);

const invalidShortAnswer = {
  ...sa,
  trueFalseItems: tf.trueFalseItems,
} as unknown as QuestionIR;

assert.ok(
  questionIRCombinationIssues(
    invalidShortAnswer,
  ).includes(
    "SHORT_ANSWER_WITH_TRUE_FALSE_ITEMS",
  ),
);

assert.throws(
  () =>
    createQuestionPackage(
      invalidShortAnswer,
    ),
  /INVALID_QUESTION_IR_COMBINATION/,
);

const invalidMcqSubquestions = {
  ...legacyMcq,
  subquestions: essay.subquestions,
} as unknown as QuestionIR;

assert.ok(
  questionIRCombinationIssues(
    invalidMcqSubquestions,
  ).includes(
    "MCQ_WITH_SUBQUESTIONS",
  ),
);

assert.throws(
  () =>
    createQuestionPackage(
      invalidMcqSubquestions,
    ),
  /INVALID_QUESTION_IR_COMBINATION/,
);

/*
 * Compile-time discrimination assertions.
 */
type AssertTrue<T extends true> = T;

type IsNever<T> =
  [T] extends [never]
    ? true
    : false;

type Mcq =
  Extract<
    QuestionIR,
    { questionType: "MULTIPLE_CHOICE" }
  >;

type Tf =
  Extract<
    QuestionIR,
    { questionType: "TRUE_FALSE" }
  >;

type Sa =
  Extract<
    QuestionIR,
    { questionType: "SHORT_ANSWER" }
  >;

type Essay =
  Extract<
    QuestionIR,
    { questionType: "ESSAY" }
  >;

type _McqForbidsTf =
  AssertTrue<
    IsNever<
      NonNullable<
        Mcq["trueFalseItems"]
      >
    >
  >;

type _TfForbidsShortAnswer =
  AssertTrue<
    IsNever<
      NonNullable<
        Tf["shortAnswer"]
      >
    >
  >;

type _SaForbidsTf =
  AssertTrue<
    IsNever<
      NonNullable<
        Sa["trueFalseItems"]
      >
    >
  >;

type _EssayForbidsShortAnswer =
  AssertTrue<
    IsNever<
      NonNullable<
        Essay["shortAnswer"]
      >
    >
  >;

console.log(
  "QUESTIONIR_DISCRIMINATION_GATE=PASS",
);

console.log(
  "INVALID_COMBINATION_GATE=PASS",
);

console.log(
  "TECH02_TRUE_FALSE=PASS",
);

console.log(
  "TRUE_FALSE_PRESERVATION_GATE=PASS",
);

console.log(
  "TECH02_SHORT_ANSWER=PASS",
);

console.log(
  "SHORT_ANSWER_SEMANTIC_GATE=PASS",
);

console.log(
  "TECH02_ESSAY=PASS",
);

console.log(
  "SUBQUESTION_PRESERVATION_GATE=PASS",
);

console.log(
  "BACKWARD_COMPATIBILITY_GATE=PASS",
);