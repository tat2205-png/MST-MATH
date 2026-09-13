import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  MemoryQuestionBankRepository,
} from "../src/modules/question-bank/repository.js";

import type {
  QuestionObject,
} from "../src/modules/question-bank/types.js";

import {
  TeacherWorkflowService,
} from "../server/services/teacherWorkflowService.js";

import type {
  AuthoritativeReadinessContract,
} from "../server/services/teacherWorkflowReadiness.js";

const question: QuestionObject = {
  schemaVersion: 1,
  id: "public-readiness-q1",

  source: {
    document: "public-readiness.docx",
    sourceHash: "public-readiness-source",
    blockIds: ["block-1"],
    sourceLocations: [
      "word/document.xml#block-1",
    ],
  },

  type: "MULTIPLE_CHOICE",

  stem: [
    {
      type: "text",
      value: "Question",
    },
  ],

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

  trueFalseItems: [],
  subquestions: [],
  figures: [],
  figureAssociations: [],
  metadata: {},
  warnings: [],

  validationStatus: "VALID",
  bankStatus: "APPROVED",
  duplicateState: "UNIQUE",

  examQa: {
    status: "READY",
    issueCodes: [],
  },
};

const repository =
  new MemoryQuestionBankRepository();

repository.replace({
  schemaVersion: 1,
  questions: [question],
  orphanFigures: [],

  relations: {
    schemaVersion: 1,
    relations: [],
    families: [],
    duplicateAudit: [],
  },
});

const service =
  new TeacherWorkflowService(
    repository,
  );

const generated =
  service.generateAssessment({
    id: "public-readiness-assessment",
    title: "Public readiness",
    seed: "public-readiness",

    globalFilters: {
      ids: [question.id],
    },

    sections: [
      {
        id: "main",
        title: "Main",
        questionType: "MULTIPLE_CHOICE",
        count: 1,
        ordering: "FIXED",
        sourcePolicy: "ANY_SOURCE",
      },
    ],
  });

if (!("assessment" in generated)) {
  throw new Error(
    "PUBLIC_READINESS_ASSESSMENT_FAILED",
  );
}

const dto:
  AuthoritativeReadinessContract =
    service.readiness(
      generated.assessment.id,
    );

assert.equal(dto.source.state, "PASS");
assert.equal(
  dto.source.sourceHash,
  question.source.sourceHash,
);
assert.equal(
  dto.source.sourceDocument,
  question.source.document,
);
assert.deepEqual(
  dto.source.importedQuestionIds,
  [question.id],
);
assert.ok(Array.isArray(dto.source.reasons));

assert.equal(dto.process.state, "PASS");
assert.ok(Array.isArray(dto.process.reasons));

assert.ok(dto.design.artifactId);
assert.equal(
  dto.design.assessmentId,
  generated.assessment.id,
);

assert.equal(dto.qa.state, "PASS");
assert.equal(
  dto.qa.artifactId,
  dto.design.artifactId,
);
assert.equal(
  dto.qa.assessmentId,
  dto.design.assessmentId,
);
assert.ok(Array.isArray(dto.qa.reasons));

assert.equal(
  dto.exportCapability.available,
  true,
);
assert.ok(
  Array.isArray(
    dto.exportCapability.supportedFormats,
  ),
);
assert.ok(
  dto.exportCapability.supportedFormats.includes(
    "JSON",
  ),
);

assert.equal(
  dto.currentArtifactExportReadiness.ready,
  true,
);
assert.equal(
  dto.currentArtifactExportReadiness.artifactId,
  dto.design.artifactId,
);
assert.equal(
  dto.currentArtifactExportReadiness.assessmentId,
  dto.design.assessmentId,
);
assert.ok(
  dto.currentArtifactExportReadiness.allowedFormats.includes(
    "JSON",
  ),
);
assert.ok(
  Array.isArray(
    dto.currentArtifactExportReadiness.reasons,
  ),
);

/*
 * Source-lineage failure must reach the public DTO.
 */
{
  const snapshot =
    repository.load();

  snapshot.questions[0]!.source.sourceHash =
    "mutated-lineage";

  repository.replace(snapshot);

  const failed =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    failed.source.state,
    "FAIL",
  );

  assert.ok(
    failed.source.reasons.includes(
      "SOURCE_LINEAGE_INVALID",
    ),
  );

  assert.equal(
    failed.currentArtifactExportReadiness.ready,
    false,
  );
}

/*
 * UNKNOWN must remain UNKNOWN, never serialized as PASS.
 */
{
  const snapshot =
    repository.load();

  snapshot.questions[0]!.source =
    structuredClone(question.source);

  snapshot.questions[0]!.examQa = {
    status: "NOT_TESTED",
    issueCodes: [],
  };

  repository.replace(snapshot);

  const unknown =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    unknown.qa.state,
    "UNKNOWN",
  );

  assert.notEqual(
    unknown.qa.state,
    "PASS",
  );

  assert.equal(
    unknown.currentArtifactExportReadiness.ready,
    false,
  );
}

/*
 * Exact application API publication evidence.
 */
const serverSource =
  readFileSync(
    "server.ts",
    "utf8",
  );

assert.ok(
  serverSource.includes(
    'app.get("/api/teacher-workflow/readiness"',
  ),
);

assert.ok(
  serverSource.includes(
    "teacherWorkflowService.readiness(",
  ),
);

assert.ok(
  serverSource.includes(
    "readiness:",
  ),
);

console.log("PUBLIC_SOURCE_FIELDS=PASS");
console.log("PUBLIC_PROCESS_FIELDS=PASS");
console.log("PUBLIC_DESIGN_IDENTITY=PASS");
console.log("PUBLIC_QA_IDENTITY=PASS");
console.log("PUBLIC_EXPORT_CAPABILITY=PASS");
console.log("PUBLIC_CURRENT_ARTIFACT_READINESS=PASS");
console.log("PUBLIC_SOURCE_LINEAGE_REASON=PASS");
console.log("PUBLIC_QA_UNKNOWN_NOT_PASS=PASS");
console.log("PUBLIC_READINESS_API=PASS");
console.log("PUBLIC_READINESS_CONTRACT_GATE=PASS");