import assert from "node:assert/strict";

import type {
  DocumentIR,
  MathNode,
} from "../src/modules/document-engine/document-ir.js";

import {
  segmentCanonicalQuestions,
} from "../src/modules/question-bank/canonical-segmentation.js";
import {
  createQuestionPackage,
} from "../src/modules/question-bank/contracts.js";

const math: MathNode = {
  id: "math-table-1",
  sourceType: "OMML",
  sourceRaw: "<m:oMath/>",
  latex: "x^2",
  normalized: "x^2",
  parseStatus: "PARSED",
  warnings: [],
  sourceLocation: "table-math",
};

const document: DocumentIR = {
  sourceDocument:
    "asset.docx",

  sourceHash:
    "a".repeat(64),

  sourceDocumentId:
    "doc-asset",

  warnings: [],

  figures: [
    {
      id: "figure-table-1",
      relationshipId: "rId1",
      sourceLocation: "figure",
    },
  ],

  mathObjects: [
    {
      mathObjectId:
        "math-table-1",

      sourceAnchor: {
        sourceDocumentId:
          "doc-asset",

        partName:
          "word/document.xml",

        tableIndex: 1,
        objectIndex: 0,
      },

      sourceType: "OMML",
      status: "PASS",
    },
  ],

  assetObjects: [
    {
      assetId: "table-1",
      kind: "TABLE",

      sourceAnchor: {
        sourceDocumentId:
          "doc-asset",

        tableIndex: 1,
        objectIndex: 1,
      },

      status: "PASS",
    },

    {
      assetId: "table-999",
      kind: "TABLE",

      sourceAnchor: {
        sourceDocumentId:
          "doc-asset",

        tableIndex: 999,
        objectIndex: 999,
      },

      status: "PASS",
    },

    {
      assetId:
        "figure-table-1",

      kind: "IMAGE",
      relationshipId: "rId1",

      sourceAnchor: {
        sourceDocumentId:
          "doc-asset",

        relationshipId: "rId1",
        objectIndex: 0,
      },

      status: "PASS",
    },
  ],

  blocks: [
    {
      id: "section",
      kind: "SECTION",
      order: 0,

      content: [
        {
          type: "text",
          value:
            "PHẦN I. TRẮC NGHIỆM",
        },
      ],

      sourceLocation: "section",
    },

    {
      id: "paragraph-1",
      kind: "PARAGRAPH",
      order: 1,

      content: [
        {
          type: "text",
          value:
            "Câu 1. Xét biểu thức.",
        },
      ],

      sourceLocation: "p1",
    },

    {
      id: "table-1",
      kind: "TABLE",
      order: 2,

      content: [
        {
          type: "table",

          cells: [
            [
              {
                type: "math",
                math,
              },

              {
                type: "figure",
                figureId:
                  "figure-table-1",
              },
            ],
          ],
        },
      ],

      sourceLocation: "t1",
    },
  ],
};

const questions =
  segmentCanonicalQuestions(
    document,
  );

assert.equal(
  questions.length,
  1,
);

const q = questions[0]!;

assert.deepEqual(
  q.mathObjectIds,
  ["math-table-1"],
);

assert.deepEqual(
  q.assetIds,
  ["figure-table-1"],
);

assert.deepEqual(
  q.tableIds,
  ["table-1"],
);

assert.equal(
  q.sourceObjectIds.includes(
    "table-1",
  ),
  true,
);

assert.equal(
  q.tableIds.includes(
    "table-999",
  ),
  false,
);

const pkg =
  createQuestionPackage(
    q,
    document.assetObjects ?? [],
  );

assert.equal(
  pkg.assets.some(
    (asset) =>
      asset.assetId === "table-1",
  ),
  true,
);

assert.equal(
  pkg.assets.some(
    (asset) =>
      asset.assetId === "table-999",
  ),
  false,
);

const sourceTable =
  document.assetObjects?.find(
    (asset) =>
      asset.assetId === "table-1",
  );

const packagedTable =
  pkg.assets.find(
    (asset) =>
      asset.assetId === "table-1",
  );

assert.ok(sourceTable);
assert.ok(packagedTable);

assert.equal(
  packagedTable.assetId,
  sourceTable.assetId,
);

assert.deepEqual(
  packagedTable.sourceAnchor,
  sourceTable.sourceAnchor,
);

/*
 * Duplicate input ledger entries must not duplicate
 * the owned asset inside QuestionPackage.assets.
 */
const duplicateInputPackage =
  createQuestionPackage(
    q,
    [
      ...(document.assetObjects ?? []),
      sourceTable,
    ],
  );

assert.equal(
  duplicateInputPackage.assets.filter(
    (asset) =>
      asset.assetId === "table-1",
  ).length,
  1,
);

console.log(
  "TABLE_ASSET_PACKAGE_GATE=PASS",
);

console.log(
  "ASSET_PROVENANCE_GATE=PASS",
);
console.log(
  "TECH03_NON_TEXT_BLOCK=PASS",
);

console.log(
  "TECH03_TABLE_OWNERSHIP=PASS",
);

console.log(
  "TECH03_MATH_FIGURE_PRESERVATION=PASS",
);

/*
 * Regression: a structurally empty SECTION block must terminate the
 * current question. It must never become part of sourceObjectIds.
 */
const emptySectionDocument: DocumentIR = {
  sourceDocument:
    "empty-section-boundary.docx",

  sourceHash:
    "d".repeat(64),

  sourceDocumentId:
    "doc-empty-section",

  warnings: [],
  figures: [],

  blocks: [
    {
      id: "question-before-section",
      kind: "PARAGRAPH",
      order: 0,
      paragraphIndex: 0,

      content: [
        {
          type: "text",
          value:
            "Câu 1. Nội dung câu thứ nhất.",
        },
      ],

      sourceLocation:
        "word/document.xml#p0",
    },

    {
      id: "empty-section",
      kind: "SECTION",
      order: 1,

      content: [],

      sourceLocation:
        "word/document.xml#sectPr1",
    },

    {
      id: "orphan-prose-after-section",
      kind: "PARAGRAPH",
      order: 2,
      paragraphIndex: 2,

      content: [
        {
          type: "text",
          value:
            "Đoạn văn này không thuộc câu 1.",
        },
      ],

      sourceLocation:
        "word/document.xml#p2",
    },

    {
      id: "question-after-section",
      kind: "PARAGRAPH",
      order: 3,
      paragraphIndex: 3,

      content: [
        {
          type: "text",
          value:
            "Câu 2. Nội dung câu thứ hai.",
        },
      ],

      sourceLocation:
        "word/document.xml#p3",
    },
  ],
};

const sectionBoundaryQuestions =
  segmentCanonicalQuestions(
    emptySectionDocument,
  );

assert.equal(
  sectionBoundaryQuestions.length,
  2,
);

assert.deepEqual(
  sectionBoundaryQuestions.map(
    (question) =>
      question.sourceObjectIds,
  ),
  [
    ["question-before-section"],
    ["question-after-section"],
  ],
);

assert.equal(
  sectionBoundaryQuestions[0]!
    .sourceObjectIds.includes(
      "empty-section",
    ),
  false,
);

assert.equal(
  sectionBoundaryQuestions[0]!
    .sourceObjectIds.includes(
      "orphan-prose-after-section",
    ),
  false,
);

console.log(
  "TECH03_EMPTY_SECTION_BOUNDARY=PASS",
);

