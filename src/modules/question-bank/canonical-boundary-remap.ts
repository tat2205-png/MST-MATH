import type { QuestionIR } from "./contracts.js";

export interface FrozenBoundaryAuthorityRow {
  authorityOrdinal: number;
  questionId: string;
  sourceDocumentId: string;
  sourceObjectIds: string[];
  inAnswerSolutionAppendix: boolean;
  sourceObjectIdsInAnswerSolutionAppendix?: string[];
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
  reason: "ANSWER_SOLUTION_APPENDIX" | "SOURCE_OWNERSHIP_ABSORBED";
  decisionSource: "SOURCE_REGION_REMEDIATION" | "SOURCE_OWNERSHIP_REMEDIATION";
  absorbedByCurrentQuestionId?: string;
  absorbedSourceObjectIds?: string[];
  appendixSourceObjectIds?: string[];
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
const isFirstSplitSibling = (row: CurrentBoundaryRecord): boolean =>
  row.sourceSliceIds.some(id => /::question-segment-1(?::|$)/u.test(id));

interface SourceOwnershipAbsorption {
  owner: CurrentBoundaryRecord;
  absorbedSourceObjectIds: string[];
  appendixSourceObjectIds: string[];
}

/**
 * A historical frozen boundary may cease to be an independent question when a
 * later source-backed segmentation repair proves that its content is actually a
 * continuation of an earlier explicit question, while any remaining tail is an
 * answer/solution appendix. Retire only when one unique high-confidence current
 * question owns every non-appendix physical source object and that current
 * question starts before the frozen range. This deliberately does not consume
 * the current row, so it can still be promoted by a separate split-remediation
 * rule when warranted.
 */
function absorbedByEarlierCurrentQuestion(
  frozen: FrozenBoundaryAuthorityRow,
  currentInDocument: CurrentBoundaryRecord[],
): SourceOwnershipAbsorption | undefined {
  if (frozen.sourceObjectIds.length === 0) return undefined;

  const appendixIds = new Set(frozen.sourceObjectIdsInAnswerSolutionAppendix ?? []);
  const nonAppendixIds = frozen.sourceObjectIds.filter(id => !appendixIds.has(id));
  if (nonAppendixIds.length === 0) return undefined;

  const possibleOwners = currentInDocument.filter(row => {
    if (!row.highConfidenceExplicitStart) return false;
    if (row.sourceObjectIds.length === 0) return false;
    if (!nonAppendixIds.every(id => row.sourceObjectIds.includes(id))) return false;

    // The frozen range must be continuation content inside this current question,
    // not the start of the current question itself.
    const firstFrozenPosition = row.sourceObjectIds.indexOf(nonAppendixIds[0]);
    return firstFrozenPosition > 0 && row.sourceObjectIds[0] !== frozen.sourceObjectIds[0];
  });

  if (possibleOwners.length !== 1) return undefined;
  const owner = possibleOwners[0];

  const everyFrozenObjectExplained = frozen.sourceObjectIds.every(
    id => owner.sourceObjectIds.includes(id) || appendixIds.has(id),
  );
  if (!everyFrozenObjectExplained) return undefined;

  return {
    owner,
    absorbedSourceObjectIds: nonAppendixIds,
    appendixSourceObjectIds: frozen.sourceObjectIds.filter(id => appendixIds.has(id)),
  };
}

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
      // When one physical Word block is split into several questions, all
      // siblings can have the same sourceObjectIds. The frozen parent started at
      // the first marker, so only logical sibling #1 may inherit that authority.
      const firstSiblings = exact.filter(isFirstSplitSibling);
      if (firstSiblings.length === 1) {
        matched = firstSiblings[0];
        matchKind = "SOURCE_RANGE_NARROWED_BY_SPLIT";
      } else {
        ambiguousFrozen.push({ frozen, currentOrdinals: exact.map(row => row.currentOrdinal) });
        continue;
      }
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
        const firstSiblings = narrowed.filter(isFirstSplitSibling);
        if (firstSiblings.length === 1) {
          matched = firstSiblings[0];
          matchKind = "SOURCE_RANGE_NARROWED_BY_SPLIT";
        } else {
          ambiguousFrozen.push({ frozen, currentOrdinals: narrowed.map(row => row.currentOrdinal) });
          continue;
        }
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
        appendixSourceObjectIds: [...(frozen.sourceObjectIdsInAnswerSolutionAppendix ?? frozen.sourceObjectIds)],
      });
      continue;
    }

    const absorption = absorbedByEarlierCurrentQuestion(frozen, currentInDocument);
    if (absorption) {
      retired.push({
        authorityOrdinal: frozen.authorityOrdinal,
        frozenQuestionId: frozen.questionId,
        sourceDocumentId: frozen.sourceDocumentId,
        sourceObjectIds: [...frozen.sourceObjectIds],
        reason: "SOURCE_OWNERSHIP_ABSORBED",
        decisionSource: "SOURCE_OWNERSHIP_REMEDIATION",
        absorbedByCurrentQuestionId: absorption.owner.question.id,
        absorbedSourceObjectIds: [...absorption.absorbedSourceObjectIds],
        appendixSourceObjectIds: [...absorption.appendixSourceObjectIds],
      });
      continue;
    }

    unresolvedFrozen.push(frozen);
  }

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
