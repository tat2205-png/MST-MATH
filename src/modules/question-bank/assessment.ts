import { createHash } from "node:crypto";
import { queryQuestionBankSnapshot } from "./search.js";
import type {
  ContentBlock,
  QuestionBankRepository,
  QuestionBankStatus,
  QuestionObject,
  QuestionSearchQuery,
  QuestionType,
  SourceProvenance,
} from "./types.js";

export type AssessmentOrder = "FIXED" | "SEEDED_SHUFFLE";
export type AssessmentSourcePolicy =
  | "ANY_SOURCE"
  | "DISTINCT_SOURCE_PREFERRED"
  | "DISTINCT_SOURCE_REQUIRED";

export interface AssessmentSectionSpec {
  id: string;
  title?: string;
  questionType: QuestionType;
  count: number;
  filters?: Omit<
    QuestionSearchQuery,
    "types" | "statuses" | "sort" | "limit" | "offset"
  >;
  pointsPerQuestion?: number;
  ordering?: AssessmentOrder;
  sourcePolicy?: AssessmentSourcePolicy;
}

export interface AssessmentSpec {
  id?: string;
  title?: string;
  seed: string | number;
  sections: AssessmentSectionSpec[];
  globalFilters?: Omit<
    QuestionSearchQuery,
    "types" | "statuses" | "sort" | "limit" | "offset"
  >;
  statuses?: QuestionBankStatus[];
  metadata?: Record<string, string>;
}

export interface AssessmentDiagnostic {
  code:
    | "INVALID_ASSESSMENT_SPEC"
    | "UNSUPPORTED_METADATA_CONSTRAINT"
    | "ASSESSMENT_INSUFFICIENT_CANDIDATES"
    | "POSSIBLE_DUPLICATE_EXCLUDED"
    | "SOURCE_DIVERSITY_UNAVAILABLE"
    | "ASSESSMENT_FINAL_VALIDATION_FAILED";
  message: string;
  sectionId?: string;
  details?: Record<string, unknown>;
}

export interface AssessmentQueryPlan {
  sectionId: string;
  count: number;
  query: QuestionSearchQuery;
  ordering: AssessmentOrder;
  sourcePolicy: AssessmentSourcePolicy;
}

export interface AssessmentQuestionRef {
  questionId: string;
  sectionId: string;
  position: number;
  type: QuestionType;
  status: QuestionBankStatus;
  source: SourceProvenance;
  points?: number;
}

export interface AssessmentSection {
  id: string;
  title?: string;
  questionRefs: AssessmentQuestionRef[];
  pointsPerQuestion?: number;
}

export interface Assessment {
  schemaVersion: 1;
  id: string;
  title?: string;
  seed: string;
  spec: AssessmentSpec;
  sections: AssessmentSection[];
  bankFingerprint: string;
  diagnostics: AssessmentDiagnostic[];
}

export interface AssessmentAnswerManifestEntry {
  questionId: string;
  answer?: ContentBlock[];
  solution?: ContentBlock[];
}

export interface AssessmentAnswerManifest {
  assessmentId: string;
  entries: AssessmentAnswerManifestEntry[];
}

export interface AssessmentGenerationSuccess {
  ok: true;
  assessment: Assessment;
  answerManifest: AssessmentAnswerManifest;
  queryPlan: AssessmentQueryPlan[];
}

export interface AssessmentGenerationFailure {
  ok: false;
  diagnostics: AssessmentDiagnostic[];
  queryPlan: AssessmentQueryPlan[];
}

export type AssessmentGenerationResult =
  | AssessmentGenerationSuccess
  | AssessmentGenerationFailure;

const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const seedNumber = (seed: string) =>
  Number.parseInt(hash(seed).slice(0, 8), 16) >>> 0;

function shuffled<T>(values: T[], seed: string): T[] {
  let state = seedNumber(seed) || 1;
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const mergeFilters = (
  globalFilters: AssessmentSpec["globalFilters"],
  localFilters: AssessmentSectionSpec["filters"],
): QuestionSearchQuery => ({
  ...globalFilters,
  ...localFilters,
  metadata: {
    ...globalFilters?.metadata,
    ...localFilters?.metadata,
  },
});

const validTypes = new Set<QuestionType>([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "UNKNOWN",
]);
const validStatuses = new Set<QuestionBankStatus>([
  "APPROVED",
  "REVIEW",
  "QUARANTINED",
]);
const validOrders = new Set<AssessmentOrder>(["FIXED", "SEEDED_SHUFFLE"]);
const validSourcePolicies = new Set<AssessmentSourcePolicy>([
  "ANY_SOURCE",
  "DISTINCT_SOURCE_PREFERRED",
  "DISTINCT_SOURCE_REQUIRED",
]);

export function validateAssessmentSpec(
  spec: AssessmentSpec,
): AssessmentDiagnostic[] {
  const diagnostics = [] as AssessmentDiagnostic[];
  const seedInvalid =
    typeof spec.seed === "string"
      ? !spec.seed.trim()
      : typeof spec.seed !== "number" || !Number.isFinite(spec.seed);

  if (
    seedInvalid ||
    !Array.isArray(spec.sections) ||
    !spec.sections.length ||
    spec.statuses?.some(
      (status) => !validStatuses.has(status) || status !== "APPROVED",
    )
  ) {
    diagnostics.push({
      code: "INVALID_ASSESSMENT_SPEC",
      message:
        "A valid seed, APPROVED-only status policy, and at least one section are required.",
    });
  }

  const ids = new Set<string>();
  for (const section of Array.isArray(spec.sections) ? spec.sections : []) {
    if (
      !section.id?.trim() ||
      ids.has(section.id) ||
      !Number.isInteger(section.count) ||
      section.count < 0 ||
      !validTypes.has(section.questionType) ||
      (section.pointsPerQuestion !== undefined &&
        (!Number.isFinite(section.pointsPerQuestion) ||
          section.pointsPerQuestion < 0)) ||
      (section.ordering !== undefined &&
        !validOrders.has(section.ordering)) ||
      (section.sourcePolicy !== undefined &&
        !validSourcePolicies.has(section.sourcePolicy))
    ) {
      diagnostics.push({
        code: "INVALID_ASSESSMENT_SPEC",
        message:
          "Section identifiers, types, counts, points, ordering, and source policy must be valid.",
        sectionId: section.id,
      });
    }
    ids.add(section.id);
  }

  return diagnostics;
}

export function createAssessmentQueryPlan(
  spec: AssessmentSpec,
): AssessmentQueryPlan[] {
  const statuses = spec.statuses ?? ["APPROVED"];
  return spec.sections.map((section) => ({
    sectionId: section.id,
    count: section.count,
    query: {
      ...mergeFilters(spec.globalFilters, section.filters),
      types: [section.questionType],
      statuses,
      duplicateStates: ["UNIQUE"],
      sort: { field: "ID", direction: "ASC" },
      limit: 100,
    },
    ordering: section.ordering ?? "FIXED",
    sourcePolicy: section.sourcePolicy ?? "ANY_SOURCE",
  }));
}

function selectSources(
  candidates: QuestionObject[],
  count: number,
  policy: AssessmentSourcePolicy,
): QuestionObject[] | undefined {
  if (policy === "ANY_SOURCE") return candidates.slice(0, count);

  const distinct: QuestionObject[] = [];
  const repeated: QuestionObject[] = [];
  const seen = new Set<string>();

  for (const item of candidates) {
    (seen.has(item.source.document) ? repeated : distinct).push(item);
    seen.add(item.source.document);
  }

  if (policy === "DISTINCT_SOURCE_REQUIRED" && distinct.length < count) {
    return undefined;
  }

  return [...distinct, ...repeated].slice(0, count);
}

function finalIssues(
  spec: AssessmentSpec,
  sections: AssessmentSection[],
): AssessmentDiagnostic[] {
  const refs = sections.flatMap((x) => x.questionRefs);
  const issues: AssessmentDiagnostic[] = [];

  if (
    new Set(refs.map((x) => x.questionId)).size !== refs.length ||
    sections.some(
      (section, i) =>
        section.questionRefs.length !== spec.sections[i].count ||
        section.questionRefs.some(
          (ref) =>
            ref.type !== spec.sections[i].questionType ||
            ref.status !== "APPROVED" ||
            !ref.source.document,
        ),
    )
  ) {
    issues.push({
      code: "ASSESSMENT_FINAL_VALIDATION_FAILED",
      message:
        "Selected questions violated count, identity, type, status, or provenance invariants.",
    });
  }

  return issues;
}

export class AssessmentService {
  constructor(private readonly repository: QuestionBankRepository) {}

  generate(spec: AssessmentSpec): AssessmentGenerationResult {
    const diagnostics = validateAssessmentSpec(spec);
    const queryPlan = diagnostics.length ? [] : createAssessmentQueryPlan(spec);
    if (diagnostics.length) return { ok: false, diagnostics, queryPlan };

    // One immutable snapshot for the whole generation request. All section
    // queries, metadata validation, bank fingerprinting, and answer material
    // reuse this exact revision instead of repeatedly reloading the repository.
    const snapshot = this.repository.load();
    const byId = new Map(
      snapshot.questions.map((question) => [question.id, question]),
    );
    const knownMetadata = new Set(
      snapshot.questions.flatMap((question) => Object.keys(question.metadata)),
    );

    const seed = String(spec.seed);
    const used = new Set<string>();
    const sections: AssessmentSection[] = [];

    for (let i = 0; i < queryPlan.length; i++) {
      const plan = queryPlan[i];
      const sectionSpec = spec.sections[i];
      const requestedMetadata = plan.query.metadata ?? {};
      const unsupported = Object.keys(requestedMetadata).filter(
        (key) => !knownMetadata.has(key),
      );

      if (unsupported.length) {
        diagnostics.push({
          code: "UNSUPPORTED_METADATA_CONSTRAINT",
          message: "The bank does not contain requested metadata fields.",
          sectionId: plan.sectionId,
          details: { fields: unsupported },
        });
        continue;
      }

      const safe = queryQuestionBankSnapshot(snapshot, {
        ...plan.query,
        statuses: ["APPROVED"],
        includeQuarantined: false,
        duplicateStates: undefined,
        limit: 100,
      });

      const possibleCount = safe.items.filter(
        (question) => question.duplicateState === "POSSIBLE_DUPLICATE",
      ).length;

      if (possibleCount) {
        diagnostics.push({
          code: "POSSIBLE_DUPLICATE_EXCLUDED",
          message: "Possible duplicates were excluded from selection.",
          sectionId: plan.sectionId,
          details: { excluded: possibleCount },
        });
      }

      let candidates = safe.items.filter(
        (question) =>
          question.duplicateState !== "DUPLICATE" &&
          question.duplicateState !== "POSSIBLE_DUPLICATE" &&
          !used.has(question.id),
      );

      if (plan.ordering === "SEEDED_SHUFFLE") {
        candidates = shuffled(candidates, `${seed}:${plan.sectionId}`);
      }

      const selected = selectSources(
        candidates,
        plan.count,
        plan.sourcePolicy,
      );

      if (!selected || selected.length !== plan.count) {
        diagnostics.push({
          code: selected
            ? "ASSESSMENT_INSUFFICIENT_CANDIDATES"
            : "SOURCE_DIVERSITY_UNAVAILABLE",
          message: "The section cannot be filled without relaxing its constraints.",
          sectionId: plan.sectionId,
          details: {
            requested: plan.count,
            available: candidates.length,
            missing: Math.max(0, plan.count - candidates.length),
            filters: plan.query,
          },
        });
        continue;
      }

      selected.forEach((question) => used.add(question.id));
      sections.push({
        id: sectionSpec.id,
        title: sectionSpec.title,
        pointsPerQuestion: sectionSpec.pointsPerQuestion,
        questionRefs: selected.map((question, index) => ({
          questionId: question.id,
          sectionId: sectionSpec.id,
          position: index + 1,
          type: question.type,
          status: question.bankStatus!,
          source: structuredClone(question.source),
          points: sectionSpec.pointsPerQuestion,
        })),
      });
    }

    if (
      diagnostics.some((x) => x.code !== "POSSIBLE_DUPLICATE_EXCLUDED") ||
      sections.length !== spec.sections.length
    ) {
      return { ok: false, diagnostics, queryPlan };
    }

    diagnostics.push(...finalIssues(spec, sections));
    if (
      diagnostics.some(
        (x) => x.code === "ASSESSMENT_FINAL_VALIDATION_FAILED",
      )
    ) {
      return { ok: false, diagnostics, queryPlan };
    }

    const selectedIds = sections.flatMap((section) =>
      section.questionRefs.map((ref) => ref.questionId),
    );
    const bankFingerprint = hash(
      snapshot.questions.map((question) => question.id).sort(),
    );
    const id =
      spec.id ??
      `assessment-${hash({ spec, seed, selectedIds }).slice(0, 16)}`;

    const assessment: Assessment = {
      schemaVersion: 1,
      id,
      title: spec.title,
      seed,
      spec: structuredClone(spec),
      sections,
      bankFingerprint,
      diagnostics,
    };

    const entries = selectedIds
      .map((questionId) => byId.get(questionId))
      .filter(
        (question): question is QuestionObject =>
          question !== undefined &&
          Boolean(question.answer?.length || question.solution?.length),
      )
      .map((question) => ({
        questionId: question.id,
        answer: question.answer && structuredClone(question.answer),
        solution: question.solution && structuredClone(question.solution),
      }));

    return {
      ok: true,
      assessment,
      answerManifest: { assessmentId: id, entries },
      queryPlan,
    };
  }

  materialize(assessment: Assessment): QuestionObject[] {
    const snapshot = this.repository.load();
    const byId = new Map(
      snapshot.questions.map((question) => [question.id, question]),
    );

    return assessment.sections.flatMap((section) =>
      section.questionRefs.map((ref) => {
        const question = byId.get(ref.questionId);
        if (!question) {
          throw new Error(`ASSESSMENT_QUESTION_NOT_FOUND:${ref.questionId}`);
        }
        if (question.bankStatus !== "APPROVED") {
          throw new Error(`ASSESSMENT_QUESTION_NOT_APPROVED:${ref.questionId}`);
        }
        if (
          question.type !== ref.type ||
          question.source.document !== ref.source.document ||
          question.source.sourceHash !== ref.source.sourceHash
        ) {
          throw new Error(`ASSESSMENT_QUESTION_STALE:${ref.questionId}`);
        }
        return structuredClone(question);
      }),
    );
  }
}
