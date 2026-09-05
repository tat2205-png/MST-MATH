import type {
  ContentBlock,
  QueryDiagnostic,
  QuestionBankRepository,
  QuestionBankSnapshot,
  QuestionObject,
  QuestionQueryResult,
  QuestionSearchQuery,
  QuestionSortField,
  QuestionType,
  QuestionBankStatus,
  QuestionRelationType,
} from "./types.js";

const types = new Set<QuestionType>([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "UNKNOWN",
]);
const statuses = new Set<QuestionBankStatus>([
  "APPROVED",
  "REVIEW",
  "QUARANTINED",
]);
const sorts = new Set<QuestionSortField>([
  "ID",
  "INDEX",
  "SOURCE_DOCUMENT",
  "TYPE",
  "STATUS",
]);
const duplicateStates = new Set([
  "UNIQUE",
  "DUPLICATE",
  "POSSIBLE_DUPLICATE",
]);

const render = (blocks: ContentBlock[]): string =>
  blocks
    .map((block) =>
      block.type === "text"
        ? block.value
        : block.type === "math"
          ? `${block.math.latex ?? ""} ${block.math.normalized ?? ""} ${block.math.sourceRaw}`
          : block.type === "figure"
            ? block.figureId
            : block.cells
                .flat()
                .map((cell) => render([cell]))
                .join(" "),
    )
    .join(" ");

export function searchableQuestionText(question: QuestionObject): string {
  return [
    render(question.stem),
    ...question.options.map((x) => render(x.content)),
    ...question.trueFalseItems.map((x) => render(x.content)),
    ...question.subquestions.map((x) => render(x.content)),
    render(question.shortAnswer ?? []),
    render(question.solution ?? []),
    Object.values(question.metadata).join(" "),
    question.source.document,
    question.section ?? "",
  ]
    .join(" ")
    .normalize("NFC")
    .toLocaleLowerCase("vi");
}

function validated(raw: QuestionSearchQuery): {
  query: QuestionSearchQuery;
  warnings: QueryDiagnostic[];
} {
  const warnings: QueryDiagnostic[] = [];
  const query = structuredClone(raw);
  const badType = query.types?.some((x) => !types.has(x));
  const badStatus = query.statuses?.some((x) => !statuses.has(x));
  const badDuplicate = query.duplicateStates?.some(
    (x) => !duplicateStates.has(x),
  );

  if (badType || badStatus || badDuplicate) {
    warnings.push({
      code: "UNKNOWN_FILTER",
      message: "One or more filter values are unknown.",
    });
    if (badType) query.types = [];
    if (badStatus) query.statuses = [];
    if (badDuplicate) query.duplicateStates = [];
  }

  if (query.sort && !sorts.has(query.sort.field)) {
    warnings.push({
      code: "INVALID_SORT",
      message: "Unknown sort field; ID ascending was used.",
    });
    query.sort = { field: "ID", direction: "ASC" };
  }

  if (
    (query.offset !== undefined &&
      (!Number.isInteger(query.offset) || query.offset < 0)) ||
    (query.limit !== undefined &&
      (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100))
  ) {
    warnings.push({
      code: "INVALID_PAGINATION",
      message: "Pagination must use offset >= 0 and limit 1..100; defaults were used.",
    });
    query.offset = 0;
    query.limit = 50;
  }

  return { query, warnings };
}

function compare(
  field: QuestionSortField,
  a: QuestionObject,
  b: QuestionObject,
): number {
  const av =
    field === "INDEX"
      ? (a.index ?? Number.MAX_SAFE_INTEGER)
      : field === "SOURCE_DOCUMENT"
        ? a.source.document
        : field === "TYPE"
          ? a.type
          : field === "STATUS"
            ? (a.bankStatus ?? "")
            : a.id;
  const bv =
    field === "INDEX"
      ? (b.index ?? Number.MAX_SAFE_INTEGER)
      : field === "SOURCE_DOCUMENT"
        ? b.source.document
        : field === "TYPE"
          ? b.type
          : field === "STATUS"
            ? (b.bankStatus ?? "")
            : b.id;

  return typeof av === "number" && typeof bv === "number"
    ? av - bv
    : String(av).localeCompare(String(bv), "vi");
}

type SnapshotQueryIndexes = {
  relationTypesByQuestion: Map<string, Set<QuestionRelationType>>;
  familyIdsByQuestion: Map<string, Set<string>>;
  relatedQuestionIdsByQuestion: Map<string, Set<string>>;
};

function buildSnapshotQueryIndexes(
  snapshot: QuestionBankSnapshot,
): SnapshotQueryIndexes {
  const relationTypesByQuestion = new Map<
    string,
    Set<QuestionRelationType>
  >();
  const familyIdsByQuestion = new Map<string, Set<string>>();
  const relatedQuestionIdsByQuestion = new Map<string, Set<string>>();

  for (const relation of snapshot.relations?.relations ?? []) {
    for (const id of [relation.sourceQuestionId, relation.targetQuestionId]) {
      const relationTypes = relationTypesByQuestion.get(id) ?? new Set();
      relation.relations.forEach((type) => relationTypes.add(type));
      relationTypesByQuestion.set(id, relationTypes);
    }

    const sourceRelated =
      relatedQuestionIdsByQuestion.get(relation.sourceQuestionId) ?? new Set();
    sourceRelated.add(relation.sourceQuestionId);
    sourceRelated.add(relation.targetQuestionId);
    relatedQuestionIdsByQuestion.set(
      relation.sourceQuestionId,
      sourceRelated,
    );

    const targetRelated =
      relatedQuestionIdsByQuestion.get(relation.targetQuestionId) ?? new Set();
    targetRelated.add(relation.targetQuestionId);
    targetRelated.add(relation.sourceQuestionId);
    relatedQuestionIdsByQuestion.set(
      relation.targetQuestionId,
      targetRelated,
    );
  }

  for (const family of snapshot.relations?.families ?? []) {
    for (const questionId of family.memberQuestionIds) {
      const familyIds = familyIdsByQuestion.get(questionId) ?? new Set();
      familyIds.add(family.familyId);
      familyIdsByQuestion.set(questionId, familyIds);
    }
  }

  return {
    relationTypesByQuestion,
    familyIdsByQuestion,
    relatedQuestionIdsByQuestion,
  };
}

export function getQuestionByIdFromSnapshot(
  snapshot: QuestionBankSnapshot,
  id: string,
): QuestionObject | undefined {
  return snapshot.questions.find((question) => question.id === id);
}

/**
 * Pure snapshot query path. Callers that already own a stable snapshot (for
 * example Assessment generation) can reuse it instead of reloading and
 * reparsing the complete Question Bank for each sub-operation.
 */
export function queryQuestionBankSnapshot(
  snapshot: QuestionBankSnapshot,
  raw: QuestionSearchQuery = {},
): QuestionQueryResult {
  const { query, warnings } = validated(raw);
  const terms =
    query.text
      ?.normalize("NFC")
      .toLocaleLowerCase("vi")
      .trim()
      .split(/\s+/u)
      .filter(Boolean) ?? [];

  const ids = query.ids?.length ? new Set(query.ids) : undefined;
  const queryTypes = query.types?.length ? new Set(query.types) : undefined;
  const queryStatuses = query.statuses?.length
    ? new Set(query.statuses)
    : undefined;
  const sourceDocuments = query.sourceDocuments?.length
    ? new Set(query.sourceDocuments)
    : undefined;
  const sourceIndices = query.sourceIndices?.length
    ? new Set(query.sourceIndices)
    : undefined;
  const duplicateStateFilter = query.duplicateStates?.length
    ? new Set(query.duplicateStates)
    : undefined;
  const relationTypeFilter = query.relationTypes?.length
    ? new Set(query.relationTypes)
    : undefined;
  const familyIdFilter = query.familyIds?.length
    ? new Set(query.familyIds)
    : undefined;

  const needsRelationIndexes = Boolean(
    relationTypeFilter || familyIdFilter || query.relatedToQuestionId,
  );
  const indexes = needsRelationIndexes
    ? buildSnapshotQueryIndexes(snapshot)
    : undefined;

  const searchableTextCache = new Map<string, string>();

  let items = snapshot.questions.filter((question) => {
    if (
      !query.includeQuarantined &&
      !queryStatuses?.has("QUARANTINED") &&
      question.bankStatus === "QUARANTINED"
    ) {
      return false;
    }
    if (ids && !ids.has(question.id)) return false;
    if (queryTypes && !queryTypes.has(question.type)) return false;
    if (
      queryStatuses &&
      (question.bankStatus === undefined ||
        !queryStatuses.has(question.bankStatus))
    ) {
      return false;
    }
    if (sourceDocuments && !sourceDocuments.has(question.source.document)) {
      return false;
    }
    if (
      sourceIndices &&
      (question.index === undefined || !sourceIndices.has(question.index))
    ) {
      return false;
    }
    if (
      query.hasFigures !== undefined &&
      question.figureAssociations.some((x) => x.status === "CONFIRMED") !==
        query.hasFigures
    ) {
      return false;
    }
    if (
      duplicateStateFilter &&
      (question.duplicateState === undefined ||
        !duplicateStateFilter.has(question.duplicateState))
    ) {
      return false;
    }
    if (relationTypeFilter) {
      const relationTypes = indexes?.relationTypesByQuestion.get(question.id);
      if (
        !relationTypes ||
        ![...relationTypeFilter].some((type) => relationTypes.has(type))
      ) {
        return false;
      }
    }
    if (familyIdFilter) {
      const familyIds = indexes?.familyIdsByQuestion.get(question.id);
      if (!familyIds || ![...familyIdFilter].some((id) => familyIds.has(id))) {
        return false;
      }
    }
    if (query.relatedToQuestionId) {
      const related = indexes?.relatedQuestionIdsByQuestion.get(
        query.relatedToQuestionId,
      );
      if (!related?.has(question.id)) return false;
    }
    if (
      query.metadata &&
      !Object.entries(query.metadata).every(
        ([key, value]) => question.metadata[key] === value,
      )
    ) {
      return false;
    }
    if (terms.length) {
      let searchable = searchableTextCache.get(question.id);
      if (searchable === undefined) {
        searchable = searchableQuestionText(question);
        searchableTextCache.set(question.id, searchable);
      }
      if (!terms.every((term) => searchable.includes(term))) return false;
    }
    return true;
  });

  const sort = query.sort ?? {
    field: "ID" as const,
    direction: "ASC" as const,
  };

  items = items
    .map((item, order) => ({ item, order }))
    .sort((a, b) => {
      const value = compare(sort.field, a.item, b.item);
      return (
        (sort.direction === "DESC" ? -value : value) ||
        a.order - b.order ||
        a.item.id.localeCompare(b.item.id)
      );
    })
    .map((x) => x.item);

  const total = items.length;
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 50;
  items = items
    .slice(offset, offset + limit)
    .map((question) => structuredClone(question));

  if (!total) {
    warnings.push({ code: "NO_RESULTS", message: "No questions matched the query." });
  }

  return {
    items,
    total,
    query: structuredClone(query),
    warnings,
  };
}

export class QuestionSearchService {
  constructor(private readonly repository: QuestionBankRepository) {}

  getById(id: string): QuestionObject | undefined {
    const snapshot = this.repository.load();
    const found = getQuestionByIdFromSnapshot(snapshot, id);
    return found && structuredClone(found);
  }

  query(raw: QuestionSearchQuery = {}): QuestionQueryResult {
    return queryQuestionBankSnapshot(this.repository.load(), raw);
  }

  approvedForReuse(
    query: Omit<
      QuestionSearchQuery,
      "statuses" | "includeQuarantined"
    > = {},
  ): QuestionQueryResult {
    return this.query({
      ...query,
      statuses: ["APPROVED"],
      includeQuarantined: false,
    });
  }
}
