import type { QuestionIR } from "./contracts.js";

export interface FrozenBoundaryAuthorityRow {
  authorityOrdinal: number;
  questionId: string;
  sourceDocumentId: string;
  sourceObjectIds: string[];
  inAnswerSolutionAppendix: boolean;
}

export interface CurrentBoundaryRecord {
  currentOrdinal: number;
  question: QuestionIR;
  sourceDocumentId: string;
  sourceObjectIds: string[];
  sourceSliceIds: string[];
  startObjectId?: string;
  highConfidenceExplicitStart: boolean;
}

export type RetainedMatchKind = "EXACT_PHYSICAL_IDENTITY" | "SOURCE_RANGE_NARROWED_BY_SPLIT";

export interface RetainedBoundarySelection {
  selectionKind: "RETAINED_FROZEN";
  matchKind: RetainedMatchKind;
  authorityOrdinal: number;
  frozenQuestionId: string;
  currentOrdinal: number;
  currentQuestionId: string;
  sourceDocumentId: string;
  sourceObjectIds: string[];
  sourceSliceIds: string[];
  questionNumber?: string | number;
}

export interface PromotedBoundarySelection {
  selectionKind: "PROMOTED_SPLIT";
  decisionSource: "SOURCE_BACKED_SPLIT_REMEDIATION";
  parentAuthorityOrdinal: number;
  parentFrozenQuestionId: string;
  currentOrdinal: number;
  currentQuestionId: string;
  sourceDocumentId: string;
  sourceObjectIds: string[];
  sourceSliceIds: string[];
  questionNumber?: string | number;
}

export interface RetiredFrozenBoundary {
  authorityOrdinal: number;
  frozenQuestionId: string;
  sourceDocumentId: string;
  sourceObjectIds: string[];
  reason: "ANSWER_SOLUTION_APPENDIX";
  decisionSource: "SOURCE_REGION_REMEDIATION";
}

export type CanonicalBoundarySelection = RetainedBoundarySelection | PromotedBoundarySelection;

export interface CanonicalBoundaryRemapResult {
  frozenAuthorityCount: number;
  retainedFrozenCount: number;
  retiredFrozenCount: number;
  promotedSplitCount: number;
  selectedQuestionCount: number;
  unresolvedFrozenCount: number;
  ambiguousFrozenCount: number;
  ambiguousPromotionCount: number;
  retained: RetainedBoundarySelection[];
  retired: RetiredFrozenBoundary[];
  promoted: PromotedBoundarySelection[];
  unresolvedFrozen: FrozenBoundaryAuthorityRow[];
  ambiguousFrozen: Array<{ frozen: FrozenBoundaryAuthorityRow; currentOrdinals: number[] }>;
  ambiguousPromotions: Array<{ currentOrdinal: number; parentAuthorityOrdinals: number[] }>;
  selected: CanonicalBoundarySelection[];
  qa: "PASS" | "FAIL";
}

const uniqueInOrder = (values: readonly string[]): string[] => [...new Set(values)];
const sameOrderedIds = (a: readonly string[], b: readonly string[]): boolean => {
  const aa = uniqueInOrder(a);
  const bb = uniqueInOrder(b);
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
};
const isSubset = (subset: readonly string[], superset: readonly string[]): boolean => {
  const allowed = new Set(superset);
  return uniqueInOrder(subset).every(value => allowed.has(value));
};
const overlaps = (a: readonly string[], b: readonly string[]): boolean => {
  const right = new Set(b);
  return a.some(value => right.has(value));
};

export function canonicalQuestionIdentityKey(value: Pick<QuestionIR, "sourceDocumentId" | "sourceObjectIds" | "sourceSliceIds">): string {
  const slices = value.sourceSliceIds?.length ? value.sourceSliceIds : value.sourceObjectIds;
  return `${value.sourceDocumentId}::${slices.join("|")}`;
}

export function remapCanonicalBoundaries(
  frozenRows: FrozenBoundaryAuthorityRow[],
  currentRows: CurrentBoundaryRecord[],
): CanonicalBoundaryRemapResult {
  const retained: RetainedBoundarySelection[] = [];
  const retired: RetiredFrozenBoundary[] = [];
  const unresolvedFrozen: FrozenBoundaryAuthorityRow[] = [];
  const ambiguousFrozen: Array<{ frozen: FrozenBoundaryAuthorityRow; currentOrdinals: number[] }> = [];
  const usedCurrentOrdinals = new Set<number>();

  for (const frozen of frozenRows) {
    const currentInDocument = currentRows.filter(row => row.sourceDocumentId === frozen.sourceDocumentId && !usedCurrentOrdinals.has(row.currentOrdinal));
    const exact = currentInDocument.filter(row => sameOrderedIds(row.sourceObjectIds, frozen.sourceObjectIds));

    let matched: CurrentBoundaryRecord | undefined;
    let matchKind: RetainedMatchKind | undefined;

    if (exact.length === 1) {
      matched = exact[0];
      matchKind = "EXACT_PHYSICAL_IDENTITY";
    } else if (exact.length > 1) {
      ambiguousFrozen.push({ frozen, currentOrdinals: exact.map(row => row.currentOrdinal) });
      continue;
    } else if (!frozen.inAnswerSolutionAppendix) {
      // A source-backed intra-block split may narrow the original parent range.
      // Retain only a unique child that starts at the same physical source object
      // and whose entire physical range remains inside the frozen authority range.
      const frozenStart = frozen.sourceObjectIds[0];
      const narrowed = currentInDocument.filter(row =>
        row.sourceObjectIds[0] === frozenStart &&
        row.sourceObjectIds.length > 0 &&
        isSubset(row.sourceObjectIds, frozen.sourceObjectIds),
      );
      if (narrowed.length === 1) {
        matched = narrowed[0];
        matchKind = "SOURCE_RANGE_NARROWED_BY_SPLIT";
      } else if (narrowed.length > 1) {
        ambiguousFrozen.push({ frozen, currentOrdinals: narrowed.map(row => row.currentOrdinal) });
        continue;
      }
    }

    if (matched && matchKind) {
      usedCurrentOrdinals.add(matched.currentOrdinal);
      retained.push({
        selectionKind: "RETAINED_FROZEN",
        matchKind,
        authorityOrdinal: frozen.authorityOrdinal,
        frozenQuestionId: frozen.questionId,
        currentOrdinal: matched.currentOrdinal,
        currentQuestionId: matched.question.id,
        sourceDocumentId: matched.sourceDocumentId,
        sourceObjectIds: [...matched.sourceObjectIds],
        sourceSliceIds: [...matched.sourceSliceIds],
        ...(matched.question.questionNumber === undefined ? {} : { questionNumber: matched.question.questionNumber }),
      });
      continue;
    }

    if (frozen.inAnswerSolutionAppendix) {
      retired.push({
        authorityOrdinal: frozen.authorityOrdinal,
        frozenQuestionId: frozen.questionId,
        sourceDocumentId: frozen.sourceDocumentId,
        sourceObjectIds: [...frozen.sourceObjectIds],
        reason: "ANSWER_SOLUTION_APPENDIX",
        decisionSource: "SOURCE_REGION_REMEDIATION",
      });
      continue;
    }

    unresolvedFrozen.push(frozen);
  }

  const retainedByAuthority = new Map(retained.map(row => [row.authorityOrdinal, row]));
  const frozenByOrdinal = new Map(frozenRows.map(row => [row.authorityOrdinal, row]));
  const promoted: PromotedBoundarySelection[] = [];
  const ambiguousPromotions: Array<{ currentOrdinal: number; parentAuthorityOrdinals: number[] }> = [];

  for (const current of currentRows) {
    if (usedCurrentOrdinals.has(current.currentOrdinal)) continue;
    if (!current.highConfidenceExplicitStart) continue;
    if (!current.sourceSliceIds.some(id => id.includes("::question-segment-"))) continue;

    const possibleParents = retained.filter(parent => {
      if (parent.sourceDocumentId !== current.sourceDocumentId) return false;
      const frozenParent = frozenByOrdinal.get(parent.authorityOrdinal);
      if (!frozenParent) return false;
      if (!overlaps(current.sourceObjectIds, frozenParent.sourceObjectIds)) return false;
      const parentNumber = parent.questionNumber;
      const childNumber = current.question.questionNumber;
      return childNumber !== undefined && parentNumber !== undefined && String(childNumber) !== String(parentNumber);
    });

    if (possibleParents.length === 0) continue;
    if (possibleParents.length > 1) {
      ambiguousPromotions.push({
        currentOrdinal: current.currentOrdinal,
        parentAuthorityOrdinals: possibleParents.map(parent => parent.authorityOrdinal),
      });
      continue;
    }

    const parent = possibleParents[0];
    usedCurrentOrdinals.add(current.currentOrdinal);
    promoted.push({
      selectionKind: "PROMOTED_SPLIT",
      decisionSource: "SOURCE_BACKED_SPLIT_REMEDIATION",
      parentAuthorityOrdinal: parent.authorityOrdinal,
      parentFrozenQuestionId: frozenByOrdinal.get(parent.authorityOrdinal)?.questionId ?? parent.frozenQuestionId,
      currentOrdinal: current.currentOrdinal,
      currentQuestionId: current.question.id,
      sourceDocumentId: current.sourceDocumentId,
      sourceObjectIds: [...current.sourceObjectIds],
      sourceSliceIds: [...current.sourceSliceIds],
      ...(current.question.questionNumber === undefined ? {} : { questionNumber: current.question.questionNumber }),
    });
  }

  // Ensure no duplicate current logical identity is selected even if QuestionIR
  // IDs collide. Identity is source-backed, not question-id-backed.
  const selected: CanonicalBoundarySelection[] = [...retained, ...promoted];
  const selectedIdentityKeys = selected.map(row => `${row.sourceDocumentId}::${row.sourceSliceIds.join("|")}`);
  const selectedIdentityUnique = new Set(selectedIdentityKeys).size === selectedIdentityKeys.length;

  const qa =
    unresolvedFrozen.length === 0 &&
    ambiguousFrozen.length === 0 &&
    ambiguousPromotions.length === 0 &&
    retained.length + retired.length === frozenRows.length &&
    selectedIdentityUnique
      ? "PASS"
      : "FAIL";

  return {
    frozenAuthorityCount: frozenRows.length,
    retainedFrozenCount: retained.length,
    retiredFrozenCount: retired.length,
    promotedSplitCount: promoted.length,
    selectedQuestionCount: selected.length,
    unresolvedFrozenCount: unresolvedFrozen.length,
    ambiguousFrozenCount: ambiguousFrozen.length,
    ambiguousPromotionCount: ambiguousPromotions.length,
    retained,
    retired,
    promoted,
    unresolvedFrozen,
    ambiguousFrozen,
    ambiguousPromotions,
    selected,
    qa,
  };
}
