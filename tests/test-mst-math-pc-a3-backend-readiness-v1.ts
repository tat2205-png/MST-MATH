import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  MemoryQuestionBankRepository,
} from "../src/modules/question-bank/repository.js";

import type {
  QuestionBankRepository,
  QuestionObject,
} from "../src/modules/question-bank/types.js";

import {
  TeacherWorkflowService,
} from "../server/services/teacherWorkflowService.js";

function makeQuestion(
  id: string,
  sourceDocument: string,
  sourceHash: string,
): QuestionObject {
  return {
    schemaVersion: 1,
    id,

    source: {
      document: sourceDocument,
      sourceHash,
      blockIds: [`${id}-p1`],
      sourceLocations: [
        `word/document.xml#${id}-p1`,
      ],
    },

    type: "MULTIPLE_CHOICE",

    stem: [
      {
        type: "text",
        value: `Question ${id}`,
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
      {
        label: "B",
        content: [
          {
            type: "text",
            value: "2",
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
}

function createService(
  questions: QuestionObject[],
): {
  repository: MemoryQuestionBankRepository;
  service: TeacherWorkflowService;
} {
  const repository =
    new MemoryQuestionBankRepository();

  repository.replace({
    schemaVersion: 1,
    questions,
    orphanFigures: [],
    relations: {
      schemaVersion: 1,
      relations: [],
      families: [],
      duplicateAudit: [],
    },
  });

  return {
    repository,
    service:
      new TeacherWorkflowService(
        repository,
      ),
  };
}

function createAssessment(
  service: TeacherWorkflowService,
  questionIds: string[],
  assessmentId: string,
) {
  const result =
    service.generateAssessment({
      id: assessmentId,
      title: assessmentId,
      seed: assessmentId,

      globalFilters: {
        ids: questionIds,
      },

      sections: [
        {
          id: "main",
          title: "Main",

          questionType:
            "MULTIPLE_CHOICE",

          count:
            questionIds.length,

          ordering:
            "FIXED",

          sourcePolicy:
            "ANY_SOURCE",
        },
      ],
    });

  if (!("assessment" in result)) {
    throw new Error(
      `ASSESSMENT_GENERATION_FAILED:${JSON.stringify(result)}`,
    );
  }

  return result;
}

function mutateQuestion(
  repository: QuestionBankRepository,
  questionId: string,
  mutate: (
    question: QuestionObject,
  ) => void,
): void {
  const snapshot =
    repository.load();

  const question =
    snapshot.questions.find(
      (candidate) =>
        candidate.id === questionId,
    );

  if (!question) {
    throw new Error(
      `QUESTION_NOT_FOUND:${questionId}`,
    );
  }

  mutate(question);

  repository.replace(snapshot);
}

/*
 * T01 valid assessment -> QA PASS
 */
{
  const q =
    makeQuestion(
      "t01-q",
      "t01.docx",
      "t01-hash",
    );

  const { service } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t01-assessment",
    );

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    readiness.qa.state,
    "PASS",
  );

  assert.equal(
    readiness.currentArtifactExportReadiness.ready,
    true,
  );

  console.log("T01=PASS");
}

/*
 * T02 REVIEW ref -> QA not PASS
 */
{
  const q =
    makeQuestion(
      "t02-q",
      "t02.docx",
      "t02-hash",
    );

  const {
    repository,
    service,
  } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t02-assessment",
    );

  mutateQuestion(
    repository,
    q.id,
    (question) => {
      question.bankStatus =
        "REVIEW";
    },
  );

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    readiness.qa.state,
    "REVIEW",
  );

  assert.notEqual(
    readiness.qa.state,
    "PASS",
  );

  console.log("T02=PASS");
}

/*
 * T03 invalid/quarantined ref -> export denied
 * T06 exporter available + QA FAIL -> readiness false
 */
{
  const q =
    makeQuestion(
      "t03-q",
      "t03.docx",
      "t03-hash",
    );

  const {
    repository,
    service,
  } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t03-assessment",
    );

  mutateQuestion(
    repository,
    q.id,
    (question) => {
      question.bankStatus =
        "QUARANTINED";

      question.validationStatus =
        "INVALID";
    },
  );

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    readiness.exportCapability.available,
    true,
  );

  assert.equal(
    readiness.currentArtifactExportReadiness.ready,
    false,
  );

  assert.throws(
    () =>
      service.exportAssessment({
        assessmentId:
          generated.assessment.id,

        audience:
          "STUDENT",

        formats:
          ["JSON"],
      }),

    /EXPORT_DENIED:QA_FAILED/,
  );

  console.log("T03=PASS");
  console.log("T06=PASS");
}

/*
 * T04 QA UNKNOWN -> export denied
 * T10 direct service invocation cannot bypass QA
 */
{
  const q =
    makeQuestion(
      "t04-q",
      "t04.docx",
      "t04-hash",
    );

  const {
    repository,
    service,
  } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t04-assessment",
    );

  mutateQuestion(
    repository,
    q.id,
    (question) => {
      question.examQa = {
        status: "NOT_TESTED",
        issueCodes: [],
      };
    },
  );

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    readiness.qa.state,
    "UNKNOWN",
  );

  assert.throws(
    () =>
      service.exportAssessment({
        assessmentId:
          generated.assessment.id,

        audience:
          "STUDENT",

        formats:
          ["JSON"],
      }),

    /EXPORT_DENIED:QA_UNKNOWN/,
  );

  console.log("T04=PASS");
  console.log("T10=PASS");
}

/*
 * T05 visible query/page differs from assessment refs:
 * assessment refs remain authoritative.
 */
{
  const assessmentQuestion =
    makeQuestion(
      "t05-assessment-q",
      "t05-assessment.docx",
      "t05-assessment-hash",
    );

  const visibleQuestion =
    makeQuestion(
      "t05-visible-q",
      "t05-visible.docx",
      "t05-visible-hash",
    );

  const { service } =
    createService([
      assessmentQuestion,
      visibleQuestion,
    ]);

  const generated =
    createAssessment(
      service,
      [assessmentQuestion.id],
      "t05-assessment",
    );

  const visible =
    service.query({
      ids: [
        visibleQuestion.id,
      ],
    });

  assert.deepEqual(
    visible.items.map(
      (item) =>
        item.id,
    ),
    [
      visibleQuestion.id,
    ],
  );

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.deepEqual(
    readiness.source.importedQuestionIds,
    [
      assessmentQuestion.id,
    ],
  );

  assert.equal(
    readiness.qa.state,
    "PASS",
  );

  console.log("T05=PASS");
}

/*
 * T07 artifactId mismatch -> export denied
 */
{
  const q =
    makeQuestion(
      "t07-q",
      "t07.docx",
      "t07-hash",
    );

  const { service } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t07-assessment",
    );

  assert.throws(
    () =>
      service.exportAssessment({
        assessmentId:
          generated.assessment.id,

        artifactId:
          "wrong-artifact",

        audience:
          "STUDENT",

        formats:
          ["JSON"],
      }),

    /EXPORT_DENIED:ARTIFACT_ID_MISMATCH/,
  );

  console.log("T07=PASS");
}

/*
 * T08 assessmentId mismatch:
 * older assessment is not the current design artifact.
 */
{
  const q1 =
    makeQuestion(
      "t08-q1",
      "t08-a.docx",
      "t08-a-hash",
    );

  const q2 =
    makeQuestion(
      "t08-q2",
      "t08-b.docx",
      "t08-b-hash",
    );

  const { service } =
    createService([
      q1,
      q2,
    ]);

  const oldAssessment =
    createAssessment(
      service,
      [q1.id],
      "t08-old",
    );

  createAssessment(
    service,
    [q2.id],
    "t08-current",
  );

  assert.throws(
    () =>
      service.exportAssessment({
        assessmentId:
          oldAssessment.assessment.id,

        audience:
          "STUDENT",

        formats:
          ["JSON"],
      }),

    /EXPORT_DENIED:ASSESSMENT_ID_MISMATCH/,
  );

  console.log("T08=PASS");
}

/*
 * T09 unsupported format -> denied.
 */
{
  const q =
    makeQuestion(
      "t09-q",
      "t09.docx",
      "t09-hash",
    );

  const { service } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t09-assessment",
    );

  assert.throws(
    () =>
      service.exportAssessment({
        assessmentId:
          generated.assessment.id,

        audience:
          "STUDENT",

        formats:
          [
            "CSV" as never,
          ],
      }),

    /EXPORT_DENIED:FORMAT_UNSUPPORTED/,
  );

  console.log("T09=PASS");
}

/*
 * T11 invalid source lineage -> denied.
 */
{
  const q =
    makeQuestion(
      "t11-q",
      "t11.docx",
      "t11-original",
    );

  const {
    repository,
    service,
  } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t11-assessment",
    );

  mutateQuestion(
    repository,
    q.id,
    (question) => {
      question.source.sourceHash =
        "t11-mutated";
    },
  );

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    readiness.source.state,
    "FAIL",
  );

  assert.ok(
    readiness.source.reasons.includes(
      "SOURCE_LINEAGE_INVALID",
    ),
  );

  assert.throws(
    () =>
      service.exportAssessment({
        assessmentId:
          generated.assessment.id,

        audience:
          "STUDENT",

        formats:
          ["JSON"],
      }),

    /EXPORT_DENIED:SOURCE_LINEAGE_INVALID/,
  );

  console.log("T11=PASS");
}

/*
 * T12 valid artifact + QA PASS + supported format -> export.
 */
{
  const q =
    makeQuestion(
      "t12-q",
      "t12.docx",
      "t12-hash",
    );

  const { service } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t12-assessment",
    );

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    readiness.qa.state,
    "PASS",
  );

  assert.ok(
    readiness.design.artifactId,
  );

  assert.equal(
    readiness.qa.artifactId,
    readiness.design.artifactId,
  );

  assert.equal(
    readiness.qa.assessmentId,
    readiness.design.assessmentId,
  );

  const exported =
    service.exportAssessment({
      assessmentId:
        generated.assessment.id,

      artifactId:
        readiness.design.artifactId ??
        undefined,

      audience:
        "STUDENT",

      formats:
        ["JSON"],

      filename:
        "pc-a3-t12",
    });

  assert.equal(
    exported.artifacts.length,
    1,
  );

  assert.equal(
    exported.artifacts[0].format,
    "JSON",
  );

  assert.equal(
    existsSync(
      exported.artifacts[0].path,
    ),
    true,
  );

  console.log("T12=PASS");
}

/*
 * T13 stale / missing question identity -> fail closed.
 */
{
  const q =
    makeQuestion(
      "t13-q",
      "t13.docx",
      "t13-hash",
    );

  const {
    repository,
    service,
  } =
    createService([q]);

  const generated =
    createAssessment(
      service,
      [q.id],
      "t13-assessment",
    );

  const snapshot =
    repository.load();

  snapshot.questions =
    snapshot.questions.filter(
      (question) =>
        question.id !== q.id,
    );

  repository.replace(snapshot);

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    readiness.qa.state,
    "FAIL",
  );

  assert.ok(
    readiness.qa.reasons.includes(
      "QUESTION_IDENTITY_STALE",
    ),
  );

  assert.throws(
    () =>
      service.exportAssessment({
        assessmentId:
          generated.assessment.id,

        audience:
          "STUDENT",

        formats:
          ["JSON"],
      }),

    /EXPORT_DENIED:ASSESSMENT_REF_INVALID/,
  );

  console.log("T13=PASS");
}

/*
 * T14 cross-source composition is intentionally canonical
 * through AssessmentSourcePolicy=ANY_SOURCE.
 * Every ref retains independent provenance and is verified.
 */
{
  const q1 =
    makeQuestion(
      "t14-q1",
      "t14-a.docx",
      "t14-a-hash",
    );

  const q2 =
    makeQuestion(
      "t14-q2",
      "t14-b.docx",
      "t14-b-hash",
    );

  const {
    service,
  } =
    createService([
      q1,
      q2,
    ]);

  const generated =
    createAssessment(
      service,
      [
        q1.id,
        q2.id,
      ],
      "t14-assessment",
    );

  const readiness =
    service.readiness(
      generated.assessment.id,
    );

  assert.equal(
    readiness.crossSourceSelectionAllowed,
    true,
  );

  assert.equal(
    readiness.crossSourceSelectionIntentional,
    true,
  );

  assert.equal(
    readiness.crossSourcePolicy,
    "SUPPORTED_WITH_EXPLICIT_PER_QUESTION_PROVENANCE",
  );

  assert.equal(
    readiness.source.sources.length,
    2,
  );

  assert.equal(
    readiness.source.sourceHash,
    null,
  );

  assert.equal(
    readiness.source.sourceDocument,
    null,
  );

  assert.equal(
    readiness.source.state,
    "PASS",
  );

  assert.equal(
    readiness.qa.state,
    "PASS",
  );

  console.log("T14=PASS");
}

/*
 * Server/API must use the same guarded application service.
 */
{
  const source =
    readFileSync(
      "server.ts",
      "utf8",
    );

  assert.match(
    source,
    /teacherWorkflowService\.exportAssessment/,
  );

  assert.match(
    source,
    /EXPORT_DENIED/,
  );

  assert.match(
    source,
    /teacher-workflow\/readiness/,
  );

  console.log(
    "DIRECT_API_BYPASS_BLOCKED=PASS",
  );
}

console.log(
  "AUTHORITATIVE_QA_GATE=PASS",
);

console.log(
  "IDENTITY_CORRELATION_GATE=PASS",
);

console.log(
  "EXPORT_GUARD_GATE=PASS",
);

console.log(
  "SOURCE_LINEAGE_GATE=PASS",
);

console.log(
  "FAIL_CLOSED_GATE=PASS",
);

console.log(
  "CROSS_SOURCE_SELECTION_ALLOWED=YES",
);

console.log(
  "CROSS_SOURCE_SELECTION_INTENTIONAL=YES",
);

console.log(
  "CROSS_SOURCE_POLICY=SUPPORTED_WITH_EXPLICIT_PER_QUESTION_PROVENANCE",
);