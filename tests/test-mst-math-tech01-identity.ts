import assert from "node:assert/strict";

import type {
  DocumentIR,
} from "../src/modules/document-engine/document-ir.js";

import {
  segmentCanonicalQuestions,
} from "../src/modules/question-bank/canonical-segmentation.js";

import {
  extractQuestionsFromDocumentIR,
} from "../src/modules/question-bank/pipeline.js";

const hash =
  "0123456789abcdef".repeat(4);

const document: DocumentIR = {
  sourceDocument:
    "duplicate-numbering.docx",

  sourceHash: hash,

  sourceDocumentId:
    "doc-identity",

  provenance: {
    sourceFile:
      "duplicate-numbering.docx",

    sourceSha256: hash,
    sourceKind: "DOCX",
    parser: "TECH01",
    transformationHistory: [],
  },

  figures: [],
  warnings: [],

  blocks: [
    {
      id: "section-1",
      kind: "SECTION",
      order: 0,

      content: [
        {
          type: "text",
          value:
            "PHẦN I. TRẮC NGHIỆM",
        },
      ],

      sourceLocation: "s1",
    },

    {
      id: "q1-a",
      kind: "PARAGRAPH",
      order: 1,

      content: [
        {
          type: "text",
          value:
            "Câu 1. Chọn đáp án. A. 1 B. 2 C. 3 D. 4",
        },
      ],

      sourceLocation: "q1-a",
    },

    {
      id: "section-2",
      kind: "SECTION",
      order: 2,

      content: [
        {
          type: "text",
          value:
            "PHẦN II. TRẮC NGHIỆM",
        },
      ],

      sourceLocation: "s2",
    },

    {
      id: "q1-b",
      kind: "PARAGRAPH",
      order: 3,

      content: [
        {
          type: "text",
          value:
            "Câu 1. Chọn đáp án. A. 5 B. 6 C. 7 D. 8",
        },
      ],

      sourceLocation: "q1-b",
    },
  ],
};

const canonical =
  segmentCanonicalQuestions(
    document,
  );

const runtime =
  extractQuestionsFromDocumentIR(
    document,
  ).questions;

assert.equal(
  canonical.length,
  2,
);

assert.equal(
  new Set(
    canonical.map(
      (q) => q.id,
    ),
  ).size,
  2,
);

assert.deepEqual(
  canonical.map(
    (q) => q.id,
  ),
  runtime.map(
    (q) => q.id,
  ),
);

assert.deepEqual(
  canonical.map(
    (q) => q.sourceObjectIds,
  ),
  [
    ["q1-a"],
    ["q1-b"],
  ],
);

console.log(
  "TECH01_CANONICAL_IDENTITY=PASS",
);

console.log(
  "TECH01_RUNTIME_CANONICAL_PARITY=PASS",
);

const canonicalAgain =
  segmentCanonicalQuestions(
    document,
  );

assert.deepEqual(
  canonicalAgain.map(
    (question) => question.id,
  ),
  canonical.map(
    (question) => question.id,
  ),
);

console.log(
  "QUESTION_IDENTITY_GATE=PASS",
);

console.log(
  "IDENTITY_STABILITY_GATE=PASS",
);