import { validateQuestion as runExamQa } from "../exam-qa/engine.js";
import { AssetRegistry } from "./assets.js";
import { questionFingerprint } from "./duplicate.js";
import { toExamQuestion } from "./examAdapter.js";
import {
  ingestDocxQuestions,
  ingestDocxQuestionsForRuntime,
  type QuestionImportContext,
} from "./pipeline.js";
import type {
  DuplicateResult,
  QuestionBankRepository,
  QuestionBankSnapshot,
  QuestionObject,
} from "./types.js";
import { validateQuestion } from "./schema.js";
import {
  analyzeRelation,
  familyIdFor,
  optionlessQuestionKey,
  variantStructureFingerprint,
} from "./relations.js";

export interface ImportDiagnostic {
  code: string;
  questionId?: string;
  severity: "INFO" | "WARNING" | "ERROR";
  details?: Record<string, unknown>;
}

export interface BankImportResult {
  imported: QuestionObject[];
  duplicates: DuplicateResult[];
  diagnostics: ImportDiagnostic[];
  snapshot: QuestionBankSnapshot;
}

function statusQuestion(question: QuestionObject): QuestionObject {
  const structural = validateQuestion(question);
  const exam = runExamQa(toExamQuestion(question));
  const issueCodes = exam.issues.map((item) => item.code);
  const invalid =
    structural.some((item) => item.level === "FAIL") ||
    exam.status === "BLOCKED" ||
    exam.status === "NOT_TESTED";

  return {
    ...question,
    schemaVersion: 1,
    validationStatus: invalid
      ? "INVALID"
      : structural.some((item) => item.level === "WARNING") ||
          exam.status === "REVIEW_REQUIRED"
        ? "REVIEW_REQUIRED"
        : "VALID",
    bankStatus: invalid ? "QUARANTINED" : "REVIEW",
    examQa: { status: exam.status, issueCodes },
    warnings: [
      ...new Set([
        ...question.warnings,
        ...structural
          .filter((item) => item.level !== "PASS")
          .map((item) => item.code),
        ...issueCodes,
      ]),
    ],
  };
}

type QuestionIndexes = {
  orderById: Map<string, number>;
  byId: Map<string, QuestionObject>;
  bySourceIdentity: Map<string, QuestionObject[]>;
  byContentFingerprint: Map<string, QuestionObject[]>;
  byOptionlessKey: Map<string, QuestionObject[]>;
  byVariantFingerprint: Map<string, QuestionObject[]>;
  byConfirmedFigureId: Map<string, QuestionObject[]>;
};

function pushIndex(
  index: Map<string, QuestionObject[]>,
  key: string,
  question: QuestionObject,
) {
  const values = index.get(key);
  if (values) values.push(question);
  else index.set(key, [question]);
}

function sourceIdentityKey(question: QuestionObject): string {
  return `${question.source.sourceHash}\u0000${String(question.index)}`;
}

function confirmedFigureIds(question: QuestionObject): string[] {
  return [
    ...new Set(
      question.figureAssociations
        .filter((association) => association.status === "CONFIRMED")
        .map((association) => association.figureId),
    ),
  ];
}

function buildQuestionIndexes(questions: QuestionObject[]): QuestionIndexes {
  const indexes: QuestionIndexes = {
    orderById: new Map(),
    byId: new Map(),
    bySourceIdentity: new Map(),
    byContentFingerprint: new Map(),
    byOptionlessKey: new Map(),
    byVariantFingerprint: new Map(),
    byConfirmedFigureId: new Map(),
  };

  questions.forEach((question, order) => addToIndexes(indexes, question, order));
  return indexes;
}

function addToIndexes(
  indexes: QuestionIndexes,
  question: QuestionObject,
  order: number,
) {
  indexes.orderById.set(question.id, order);
  indexes.byId.set(question.id, question);
  pushIndex(indexes.bySourceIdentity, sourceIdentityKey(question), question);
  pushIndex(
    indexes.byContentFingerprint,
    questionFingerprint(question),
    question,
  );
  pushIndex(indexes.byOptionlessKey, optionlessQuestionKey(question), question);
  pushIndex(
    indexes.byVariantFingerprint,
    variantStructureFingerprint(question),
    question,
  );
  for (const figureId of confirmedFigureIds(question)) {
    pushIndex(indexes.byConfirmedFigureId, figureId, question);
  }
}

function orderedUniqueCandidates(
  indexes: QuestionIndexes,
  groups: Array<readonly QuestionObject[] | undefined>,
): QuestionObject[] {
  const byId = new Map<string, QuestionObject>();
  for (const group of groups) {
    for (const question of group ?? []) byId.set(question.id, question);
  }

  return [...byId.values()].sort(
    (left, right) =>
      (indexes.orderById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (indexes.orderById.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

function detectDuplicateIndexed(
  question: QuestionObject,
  indexes: QuestionIndexes,
): DuplicateResult {
  const stableCandidates = orderedUniqueCandidates(indexes, [
    indexes.byId.get(question.id)
      ? [indexes.byId.get(question.id)!]
      : undefined,
    indexes.bySourceIdentity.get(sourceIdentityKey(question)),
  ]);

  if (stableCandidates.length) {
    return {
      status: "DUPLICATE",
      matchedId: stableCandidates[0].id,
      evidence: ["STABLE_SOURCE_IDENTITY"],
    };
  }

  const contentMatch = indexes.byContentFingerprint.get(
    questionFingerprint(question),
  )?.[0];

  return contentMatch
    ? {
        status: "POSSIBLE_DUPLICATE",
        matchedId: contentMatch.id,
        evidence: ["CANONICAL_CONTENT_MATCH_DIFFERENT_SOURCE"],
      }
    : { status: "UNIQUE", evidence: [] };
}

function relationCandidates(
  question: QuestionObject,
  indexes: QuestionIndexes,
): QuestionObject[] {
  const figureGroups = confirmedFigureIds(question).map((figureId) =>
    indexes.byConfirmedFigureId.get(figureId),
  );

  return orderedUniqueCandidates(indexes, [
    indexes.byId.get(question.id)
      ? [indexes.byId.get(question.id)!]
      : undefined,
    indexes.bySourceIdentity.get(sourceIdentityKey(question)),
    indexes.byContentFingerprint.get(questionFingerprint(question)),
    indexes.byOptionlessKey.get(optionlessQuestionKey(question)),
    indexes.byVariantFingerprint.get(variantStructureFingerprint(question)),
    ...figureGroups,
  ]);
}

export class QuestionBankService {
  constructor(private readonly repository: QuestionBankRepository) {}

  importDocx(
    bytes: Uint8Array,
    name: string,
    context?: QuestionImportContext,
  ): BankImportResult {
    return this.importPipeline(ingestDocxQuestions(bytes, name, context));
  }

  async importDocxForRuntime(
    bytes: Uint8Array,
    name: string,
    context?: QuestionImportContext,
  ): Promise<BankImportResult> {
    return this.importPipeline(
      await ingestDocxQuestionsForRuntime(bytes, name, context),
    );
  }

  private importPipeline(
    pipeline: ReturnType<typeof ingestDocxQuestions>,
  ): BankImportResult {
    const before = this.repository.load();
    const questions = [...before.questions];
    const orphanFigures = [...before.orphanFigures];
    const registry = new AssetRegistry();

    [...questions.flatMap((question) => question.figures), ...orphanFigures].forEach(
      (figure) => registry.register(figure),
    );

    const imported: QuestionObject[] = [];
    const duplicates: DuplicateResult[] = [];
    const diagnostics: ImportDiagnostic[] = [];
    const relations = before.relations ?? {
      schemaVersion: 1 as const,
      relations: [],
      families: [],
      duplicateAudit: [],
    };
    const indexes = buildQuestionIndexes(questions);

    for (const source of pipeline.questions) {
      const question = statusQuestion(source);
      const duplicate = detectDuplicateIndexed(question, indexes);
      const candidates = relationCandidates(question, indexes)
        .map((existing) => analyzeRelation(existing, question))
        .filter((item) => !item.relations.includes("NONE"));
      const relation =
        candidates.find((item) => item.relations.includes("EXACT_DUPLICATE")) ??
        candidates[0];
      const match = relation
        ? indexes.byId.get(relation.sourceQuestionId)
        : duplicate.matchedId
          ? indexes.byId.get(duplicate.matchedId)
          : undefined;

      relations.relations.push(...candidates);
      duplicates.push(duplicate);

      if (relation?.relations.includes("EXACT_DUPLICATE")) {
        if (match) {
          relations.duplicateAudit.push({
            removedQuestionId: question.id,
            keptQuestionId: match.id,
            relation: "EXACT_DUPLICATE",
            sourceDocument: question.source.document,
            sourceHash: question.source.sourceHash,
            sourceLocations: question.source.sourceLocations,
            evidence: relation.evidence,
            policyVersion: "PIMATH_QUESTION_RELATIONS_V1",
          });
        }
        diagnostics.push({
          code: "DUPLICATE_QUESTION",
          questionId: question.id,
          severity: "INFO",
          details: { matchedId: match?.id },
        });
        continue;
      }

      question.duplicateState = relation?.relations.includes("SOURCE_CONFLICT")
        ? "UNIQUE"
        : relation?.relations.includes("POSSIBLE_DUPLICATE")
          ? "POSSIBLE_DUPLICATE"
          : duplicate.status;

      if (relation?.relations.includes("SOURCE_CONFLICT")) {
        diagnostics.push({
          code: "SOURCE_CONFLICT",
          questionId: question.id,
          severity: "WARNING",
          details: { matchedId: match?.id },
        });
      }

      question.figures.forEach((figure) => registry.register(figure));
      if (question.bankStatus === "QUARANTINED") {
        diagnostics.push({
          code: "INVALID_QUESTION_STRUCTURE",
          questionId: question.id,
          severity: "ERROR",
        });
      }

      questions.push(question);
      imported.push(question);
      addToIndexes(indexes, question, questions.length - 1);

      const variantRelation = candidates.find((item) =>
        item.relations.includes("PARAMETRIC_VARIANT"),
      );
      const variantMatch = variantRelation
        ? indexes.byId.get(variantRelation.sourceQuestionId)
        : undefined;

      if (variantRelation && variantMatch) {
        const familyId = familyIdFor(variantMatch, question);
        const family = relations.families.find(
          (candidate) => candidate.familyId === familyId,
        ) ?? {
          familyId,
          memberQuestionIds: [variantMatch.id],
          relationEvidence: variantRelation.evidence,
          schemaVersion: 1 as const,
        };

        if (!family.memberQuestionIds.includes(question.id)) {
          family.memberQuestionIds.push(question.id);
        }
        if (!relations.families.includes(family)) relations.families.push(family);
      }
    }

    for (const association of pipeline.figureAssociations.filter(
      (item) => item.status === "UNASSIGNED",
    )) {
      const figure = pipeline.document.figures.find(
        (item) => item.id === association.figureId,
      );
      if (figure && !orphanFigures.some((item) => item.id === figure.id)) {
        registry.register(figure);
        orphanFigures.push(figure);
        diagnostics.push({
          code: "UNRESOLVED_FIGURE",
          severity: "WARNING",
          details: { figureId: figure.id },
        });
      }
    }

    const snapshot: QuestionBankSnapshot = {
      schemaVersion: 1,
      questions,
      orphanFigures,
      relations,
    };
    this.repository.replace(snapshot);

    return {
      imported,
      duplicates,
      diagnostics,
      snapshot: this.repository.load(),
    };
  }
}
