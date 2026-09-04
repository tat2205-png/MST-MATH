import { createHash } from "node:crypto";

import type {
  Assessment,
  AssessmentQuestionRef,
} from "../../src/modules/question-bank/assessment.js";

import type {
  ExportFormat,
} from "../../src/modules/question-bank/export.js";

import type {
  QuestionBankRepository,
  QuestionObject,
  SourceProvenance,
} from "../../src/modules/question-bank/types.js";

export type AuthoritativeQaState =
  | "PASS"
  | "WARN"
  | "REVIEW"
  | "FAIL"
  | "UNKNOWN";

export type ReadinessReasonCode =
  | "SOURCE_NOT_READY"
  | "PROCESSING_INCOMPLETE"
  | "QUESTION_REVIEW_REQUIRED"
  | "QUESTION_INVALID"
  | "QUESTION_QUARANTINED"
  | "QUESTION_BLOCKED"
  | "QUESTION_IDENTITY_STALE"
  | "ASSESSMENT_NOT_FOUND"
  | "ASSESSMENT_REF_INVALID"
  | "QA_UNKNOWN"
  | "QA_REVIEW_REQUIRED"
  | "QA_FAILED"
  | "ARTIFACT_NOT_FOUND"
  | "ARTIFACT_ID_MISMATCH"
  | "ASSESSMENT_ID_MISMATCH"
  | "SOURCE_LINEAGE_INVALID"
  | "FORMAT_UNSUPPORTED";

export const SUPPORTED_EXPORT_FORMATS:
  readonly ExportFormat[] = [
    "JSON",
    "LATEX",
    "DOCX",
    "PDF",
  ];

export const CROSS_SOURCE_POLICY =
  "SUPPORTED_WITH_EXPLICIT_PER_QUESTION_PROVENANCE" as const;

export const CROSS_SOURCE_SELECTION_ALLOWED =
  true as const;

export const CROSS_SOURCE_SELECTION_INTENTIONAL =
  true as const;

interface ArtifactRecord {
  artifactId: string;
  assessmentId: string;
  questionIds: string[];
}

export interface AuthoritativeReadinessContract {
  source: {
    state: AuthoritativeQaState;
    sourceHash: string | null;
    sourceDocument: string | null;

    /*
     * Extension required when a canonical assessment intentionally
     * composes questions from more than one source.
     */
    sources: Array<{
      sourceHash: string;
      sourceDocument: string;
    }>;

    importedQuestionIds: string[];
    reasons: ReadinessReasonCode[];
  };

  process: {
    state: AuthoritativeQaState;
    reasons: ReadinessReasonCode[];
  };

  design: {
    state: AuthoritativeQaState;
    artifactId: string | null;
    assessmentId: string | null;
    reasons: ReadinessReasonCode[];
  };

  qa: {
    state: AuthoritativeQaState;
    artifactId: string | null;
    assessmentId: string | null;
    reasons: ReadinessReasonCode[];
  };

  exportCapability: {
    available: boolean;
    supportedFormats: ExportFormat[];
  };

  currentArtifactExportReadiness: {
    ready: boolean;
    artifactId: string | null;
    assessmentId: string | null;
    allowedFormats: ExportFormat[];
    reasons: ReadinessReasonCode[];
  };

  crossSourcePolicy:
    typeof CROSS_SOURCE_POLICY;

  crossSourceSelectionAllowed:
    typeof CROSS_SOURCE_SELECTION_ALLOWED;

  crossSourceSelectionIntentional:
    typeof CROSS_SOURCE_SELECTION_INTENTIONAL;
}

const priority:
  Record<AuthoritativeQaState, number> = {
    PASS: 0,
    WARN: 1,
    UNKNOWN: 2,
    REVIEW: 3,
    FAIL: 4,
  };

function worst(
  ...states: AuthoritativeQaState[]
): AuthoritativeQaState {
  return states.reduce(
    (current, candidate) =>
      priority[candidate] >
      priority[current]
        ? candidate
        : current,
    "PASS",
  );
}

function uniqueReasons(
  values: ReadinessReasonCode[],
): ReadinessReasonCode[] {
  return [...new Set(values)];
}

function sameStrings(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  const a = left ?? [];
  const b = right ?? [];

  return (
    a.length === b.length &&
    a.every(
      (value, index) =>
        value === b[index],
    )
  );
}

function sameSource(
  expected: SourceProvenance,
  actual: SourceProvenance,
): boolean {
  return (
    expected.document === actual.document &&
    expected.sourceHash === actual.sourceHash &&
    expected.processingSha256 ===
      actual.processingSha256 &&
    sameStrings(
      expected.transformationHistory,
      actual.transformationHistory,
    ) &&
    sameStrings(
      expected.blockIds,
      actual.blockIds,
    ) &&
    sameStrings(
      expected.sourceLocations,
      actual.sourceLocations,
    )
  );
}

function questionState(
  question: QuestionObject,
): {
  state: AuthoritativeQaState;
  reasons: ReadinessReasonCode[];
} {
  if (
    question.bankStatus === "QUARANTINED"
  ) {
    return {
      state: "FAIL",
      reasons: [
        "QUESTION_QUARANTINED",
      ],
    };
  }

  if (
    question.validationStatus === "INVALID" ||
    question.examQa?.status === "BLOCKED" ||
    question.duplicateState === "DUPLICATE"
  ) {
    return {
      state: "FAIL",
      reasons: [
        "QUESTION_INVALID",
        "QUESTION_BLOCKED",
      ],
    };
  }

  if (
    question.bankStatus === "REVIEW" ||
    question.validationStatus ===
      "REVIEW_REQUIRED" ||
    question.examQa?.status ===
      "REVIEW_REQUIRED" ||
    question.duplicateState ===
      "POSSIBLE_DUPLICATE"
  ) {
    return {
      state: "REVIEW",
      reasons: [
        "QUESTION_REVIEW_REQUIRED",
      ],
    };
  }

  if (
    question.type === "UNKNOWN" ||
    question.bankStatus !== "APPROVED" ||
    !question.examQa ||
    question.examQa.status === "NOT_TESTED" ||
    question.duplicateState === undefined
  ) {
    return {
      state: "UNKNOWN",
      reasons: [
        "QA_UNKNOWN",
      ],
    };
  }

  if (
    question.warnings.length > 0 ||
    question.examQa.issueCodes.length > 0
  ) {
    return {
      state: "WARN",
      reasons: [
        "PROCESSING_INCOMPLETE",
      ],
    };
  }

  return {
    state: "PASS",
    reasons: [],
  };
}

function artifactIdFor(
  assessment: Assessment,
): string {
  const semantic = {
    assessmentId:
      assessment.id,

    seed:
      assessment.seed,

    bankFingerprint:
      assessment.bankFingerprint,

    refs:
      assessment.sections.flatMap(
        (section) =>
          section.questionRefs.map(
            (ref) => ({
              questionId:
                ref.questionId,

              sectionId:
                ref.sectionId,

              position:
                ref.position,

              type:
                ref.type,

              sourceHash:
                ref.source.sourceHash,

              sourceDocument:
                ref.source.document,
            }),
          ),
      ),
  };

  const digest =
    createHash("sha256")
      .update(JSON.stringify(semantic))
      .digest("hex")
      .slice(0, 16);

  return `assessment-artifact-${digest}`;
}

function uniqueSources(
  refs: readonly AssessmentQuestionRef[],
): Array<{
  sourceHash: string;
  sourceDocument: string;
}> {
  const result =
    new Map<
      string,
      {
        sourceHash: string;
        sourceDocument: string;
      }
    >();

  for (const ref of refs) {
    const key =
      `${ref.source.sourceHash}\u0000${ref.source.document}`;

    result.set(
      key,
      {
        sourceHash:
          ref.source.sourceHash,

        sourceDocument:
          ref.source.document,
      },
    );
  }

  return [...result.values()];
}

export class TeacherWorkflowReadinessAuthority {
  private readonly artifactsByAssessment =
    new Map<string, ArtifactRecord>();

  private current:
    ArtifactRecord | undefined;

  registerAssessment(
    assessment: Assessment,
  ): ArtifactRecord {
    const record: ArtifactRecord = {
      artifactId:
        artifactIdFor(assessment),

      assessmentId:
        assessment.id,

      questionIds:
        assessment.sections.flatMap(
          (section) =>
            section.questionRefs.map(
              (ref) =>
                ref.questionId,
            ),
        ),
    };

    this.artifactsByAssessment.set(
      assessment.id,
      record,
    );

    this.current =
      record;

    return structuredClone(record);
  }

  currentAssessmentId():
    string | undefined {
    return this.current?.assessmentId;
  }

  evaluate(
    assessment: Assessment | undefined,
    repository: QuestionBankRepository,
    requestedAssessmentId?: string,
    requestedArtifactId?: string,
  ): AuthoritativeReadinessContract {
    const designReasons:
      ReadinessReasonCode[] = [];

    const qaReasons:
      ReadinessReasonCode[] = [];

    const sourceReasons:
      ReadinessReasonCode[] = [];

    const processReasons:
      ReadinessReasonCode[] = [];

    const currentArtifact =
      this.current;

    const designState:
      AuthoritativeQaState =
        currentArtifact
          ? "PASS"
          : "UNKNOWN";

    const designArtifactId =
      currentArtifact?.artifactId ??
      null;

    const designAssessmentId =
      currentArtifact?.assessmentId ??
      null;

    const qaAssessmentId =
      requestedAssessmentId ??
      designAssessmentId;

    const registeredForRequestedAssessment =
      qaAssessmentId
        ? this.artifactsByAssessment.get(
            qaAssessmentId,
          )
        : undefined;

    const qaArtifactId =
      requestedArtifactId ??
      registeredForRequestedAssessment
        ?.artifactId ??
      null;

    let identityState:
      AuthoritativeQaState =
        "PASS";

    if (!currentArtifact) {
      identityState =
        "UNKNOWN";

      designReasons.push(
        "ARTIFACT_NOT_FOUND",
      );
    }

    if (
      currentArtifact &&
      qaAssessmentId !==
        currentArtifact.assessmentId
    ) {
      identityState =
        "FAIL";

      qaReasons.push(
        "ASSESSMENT_ID_MISMATCH",
      );
    }

    if (
      currentArtifact &&
      qaArtifactId !==
        currentArtifact.artifactId
    ) {
      identityState =
        "FAIL";

      qaReasons.push(
        "ARTIFACT_ID_MISMATCH",
      );
    }

    if (!assessment) {
      const missingState:
        AuthoritativeQaState =
          currentArtifact
            ? "FAIL"
            : "UNKNOWN";

      sourceReasons.push(
        "ASSESSMENT_NOT_FOUND",
      );

      processReasons.push(
        "ASSESSMENT_NOT_FOUND",
      );

      qaReasons.push(
        "ASSESSMENT_NOT_FOUND",
      );

      const finalQa =
        worst(
          missingState,
          identityState,
        );

      return {
        source: {
          state:
            missingState,

          sourceHash:
            null,

          sourceDocument:
            null,

          sources:
            [],

          importedQuestionIds:
            [],

          reasons:
            uniqueReasons(
              sourceReasons,
            ),
        },

        process: {
          state:
            missingState,

          reasons:
            uniqueReasons(
              processReasons,
            ),
        },

        design: {
          state:
            designState,

          artifactId:
            designArtifactId,

          assessmentId:
            designAssessmentId,

          reasons:
            uniqueReasons(
              designReasons,
            ),
        },

        qa: {
          state:
            finalQa,

          artifactId:
            qaArtifactId,

          assessmentId:
            qaAssessmentId,

          reasons:
            uniqueReasons(
              qaReasons,
            ),
        },

        exportCapability: {
          available:
            true,

          supportedFormats:
            [
              ...SUPPORTED_EXPORT_FORMATS,
            ],
        },

        currentArtifactExportReadiness: {
          ready:
            false,

          artifactId:
            qaArtifactId,

          assessmentId:
            qaAssessmentId,

          allowedFormats:
            [],

          reasons:
            uniqueReasons([
              ...qaReasons,
              "QA_FAILED",
            ]),
        },

        crossSourcePolicy:
          CROSS_SOURCE_POLICY,

        crossSourceSelectionAllowed:
          CROSS_SOURCE_SELECTION_ALLOWED,

        crossSourceSelectionIntentional:
          CROSS_SOURCE_SELECTION_INTENTIONAL,
      };
    }

    const refs =
      assessment.sections.flatMap(
        (section) =>
          section.questionRefs,
      );

    const currentRecordForAssessment =
      this.artifactsByAssessment.get(
        assessment.id,
      );

    if (!currentRecordForAssessment) {
      identityState =
        "FAIL";

      qaReasons.push(
        "ARTIFACT_NOT_FOUND",
      );
    }

    const currentAssessmentArtifactId =
      artifactIdFor(assessment);

    if (
      currentRecordForAssessment &&
      currentRecordForAssessment.artifactId !==
        currentAssessmentArtifactId
    ) {
      identityState =
        "FAIL";

      qaReasons.push(
        "ARTIFACT_ID_MISMATCH",
      );
    }

    const refIds =
      refs.map(
        (ref) =>
          ref.questionId,
      );

    if (
      currentRecordForAssessment &&
      !sameStrings(
        currentRecordForAssessment.questionIds,
        refIds,
      )
    ) {
      identityState =
        "FAIL";

      qaReasons.push(
        "ASSESSMENT_REF_INVALID",
      );
    }

    if (
      !refs.length ||
      new Set(refIds).size !==
        refIds.length
    ) {
      identityState =
        "FAIL";

      qaReasons.push(
        "ASSESSMENT_REF_INVALID",
      );
    }

    const bank =
      repository.load();

    const byId =
      new Map(
        bank.questions.map(
          (question) => [
            question.id,
            question,
          ],
        ),
      );

    let sourceState:
      AuthoritativeQaState =
        refs.length
          ? "PASS"
          : "FAIL";

    let processState:
      AuthoritativeQaState =
        refs.length
          ? "PASS"
          : "FAIL";

    if (!refs.length) {
      sourceReasons.push(
        "SOURCE_NOT_READY",
      );

      processReasons.push(
        "ASSESSMENT_REF_INVALID",
      );
    }

    for (const ref of refs) {
      const question =
        byId.get(
          ref.questionId,
        );

      if (!question) {
        sourceState =
          worst(
            sourceState,
            "FAIL",
          );

        processState =
          worst(
            processState,
            "FAIL",
          );

        sourceReasons.push(
          "QUESTION_IDENTITY_STALE",
        );

        processReasons.push(
          "ASSESSMENT_REF_INVALID",
        );

        qaReasons.push(
          "QUESTION_IDENTITY_STALE",
        );

        continue;
      }

      if (
        !ref.source.document ||
        !ref.source.sourceHash ||
        !question.source.document ||
        !question.source.sourceHash ||
        !sameSource(
          ref.source,
          question.source,
        )
      ) {
        sourceState =
          worst(
            sourceState,
            "FAIL",
          );

        sourceReasons.push(
          "SOURCE_LINEAGE_INVALID",
        );
      }

      if (
        ref.type !== question.type ||
        ref.status !== "APPROVED"
      ) {
        processState =
          worst(
            processState,
            "FAIL",
          );

        processReasons.push(
          "ASSESSMENT_REF_INVALID",
        );
      }

      const q =
        questionState(
          question,
        );

      processState =
        worst(
          processState,
          q.state,
        );

      processReasons.push(
        ...q.reasons,
      );
    }

    if (
      assessment.diagnostics.length >
      0
    ) {
      processState =
        worst(
          processState,
          "WARN",
        );

      processReasons.push(
        "PROCESSING_INCOMPLETE",
      );
    }

    const qaState =
      worst(
        sourceState,
        processState,
        designState,
        identityState,
      );

    if (
      qaState === "UNKNOWN"
    ) {
      qaReasons.push(
        "QA_UNKNOWN",
      );
    }

    if (
      qaState === "REVIEW"
    ) {
      qaReasons.push(
        "QA_REVIEW_REQUIRED",
      );
    }

    if (
      qaState === "FAIL"
    ) {
      qaReasons.push(
        "QA_FAILED",
      );
    }

    const correlationValid =
      qaArtifactId !== null &&
      qaAssessmentId !== null &&
      qaArtifactId ===
        designArtifactId &&
      qaAssessmentId ===
        designAssessmentId;

    /*
     * Fail closed:
     * only authoritative QA PASS may export.
     * WARN != PASS.
     * REVIEW != PASS.
     * UNKNOWN != PASS.
     */
    const ready =
      qaState === "PASS" &&
      sourceState === "PASS" &&
      processState === "PASS" &&
      designState === "PASS" &&
      correlationValid;

    const sources =
      uniqueSources(refs);

    return {
      source: {
        state:
          sourceState,

        sourceHash:
          sources.length === 1
            ? sources[0].sourceHash
            : null,

        sourceDocument:
          sources.length === 1
            ? sources[0].sourceDocument
            : null,

        sources,

        importedQuestionIds:
          [...refIds],

        reasons:
          uniqueReasons(
            sourceReasons,
          ),
      },

      process: {
        state:
          processState,

        reasons:
          uniqueReasons(
            processReasons,
          ),
      },

      design: {
        state:
          designState,

        artifactId:
          designArtifactId,

        assessmentId:
          designAssessmentId,

        reasons:
          uniqueReasons(
            designReasons,
          ),
      },

      qa: {
        state:
          qaState,

        artifactId:
          qaArtifactId,

        assessmentId:
          qaAssessmentId,

        reasons:
          uniqueReasons(
            qaReasons,
          ),
      },

      exportCapability: {
        available:
          true,

        supportedFormats:
          [
            ...SUPPORTED_EXPORT_FORMATS,
          ],
      },

      currentArtifactExportReadiness: {
        ready,

        artifactId:
          qaArtifactId,

        assessmentId:
          qaAssessmentId,

        allowedFormats:
          ready
            ? [
                ...SUPPORTED_EXPORT_FORMATS,
              ]
            : [],

        reasons:
          ready
            ? []
            : uniqueReasons([
                ...sourceReasons,
                ...processReasons,
                ...qaReasons,
                ...(correlationValid
                  ? []
                  : [
                      "ARTIFACT_ID_MISMATCH" as const,
                    ]),
              ]),
      },

      crossSourcePolicy:
        CROSS_SOURCE_POLICY,

      crossSourceSelectionAllowed:
        CROSS_SOURCE_SELECTION_ALLOWED,

      crossSourceSelectionIntentional:
        CROSS_SOURCE_SELECTION_INTENTIONAL,
    };
  }
}