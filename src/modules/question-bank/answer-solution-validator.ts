import type { DocumentIR } from "../document-engine/document-ir.js";
import { findAnswerSolutionAppendixRegions } from "./source-region-classification.js";

export type SourceDisposition = "MAPPED" | "NON_QUESTION" | "UNSUPPORTED" | "UNRESOLVED";

export interface SourceBlockRecord {
  sourceBlockId: string;
  sourceDocumentId: string;
  sourceObjectIds: string[];
  sourceAnchor: unknown;
  structureType: "ANSWER" | "SOLUTION";
  detectionEvidence: string[];
  disposition: SourceDisposition;
  provenance: unknown;
  qaStatus: string;
  issues: string[];
}

const text = (d: DocumentIR) =>
  d.blocks.map((b) => ({
    b,
    t: b.content
      .filter((x): x is Extract<(typeof b.content)[number], { type: "text" }> => x.type === "text")
      .map((x) => x.value)
      .join(" "),
  }));

export function discoverAnswerSolutionSourceBlocks(d: DocumentIR): SourceBlockRecord[] {
  const out: SourceBlockRecord[] = [];

  for (const { b, t } of text(d)) {
    const kind = /^(?:đáp\s*án|answer|lời\s*giải|hướng\s*dẫn\s*giải|solution)\b/iu.test(t)
      ? /^(?:đáp\s*án|answer)\b/iu.test(t)
        ? "ANSWER"
        : "SOLUTION"
      : undefined;
    if (!kind) continue;

    out.push({
      sourceBlockId: `${d.sourceHash}::${kind.toLowerCase()}::${b.id}`,
      sourceDocumentId: d.sourceDocumentId ?? d.sourceHash,
      sourceObjectIds: [b.id],
      sourceAnchor: {
        sourceDocumentId: d.sourceDocumentId ?? d.sourceHash,
        partName: "word/document.xml",
        objectIndex: b.order,
        paragraphIndex: b.paragraphIndex,
      },
      structureType: kind,
      detectionEvidence: ["EXPLICIT_HEADING"],
      disposition: "UNRESOLVED",
      provenance: d.provenance ?? {},
      qaStatus: "REVIEW",
      issues: [],
    });
  }

  // Preserve a source-backed record for a document-level answer/solution
  // appendix. These source objects are intentionally excluded from question
  // segmentation, but they are not discarded: they remain available for the
  // answer/solution association layer with explicit evidence and provenance.
  for (const region of findAnswerSolutionAppendixRegions(d)) {
    out.push({
      sourceBlockId: `${d.sourceHash}::${region.kind.toLowerCase()}-appendix::${region.headingBlockId}`,
      sourceDocumentId: d.sourceDocumentId ?? d.sourceHash,
      sourceObjectIds: region.sourceObjectIds,
      sourceAnchor: {
        sourceDocumentId: d.sourceDocumentId ?? d.sourceHash,
        partName: "word/document.xml",
        objectIndex: region.startOrder,
      },
      structureType: region.kind,
      detectionEvidence: region.evidence,
      disposition: "UNRESOLVED",
      provenance: d.provenance ?? {},
      qaStatus: "REVIEW",
      issues: ["APPENDIX_REQUIRES_QUESTION_MAPPING"],
    });
  }

  return out;
}

export function validateAnswerSolutionMappings(
  rows: SourceBlockRecord[],
  mappings: { questionId: string; sourceBlockId: string; sourceAnchor?: unknown; evidence?: string[]; provenance?: unknown }[],
  questionIds: Set<string>,
) {
  const ids = new Set(rows.map((x) => x.sourceBlockId));
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const m of mappings) {
    const key = `${m.questionId}::${m.sourceBlockId}`;
    if (!questionIds.has(m.questionId) || !ids.has(m.sourceBlockId)) errors.push("BROKEN_SOURCE_REFERENCE");
    if (seen.has(key)) errors.push("DUPLICATE_MAPPING");
    seen.add(key);
    if (!m.evidence?.length || !m.provenance) errors.push("MISSING_MAPPING_EVIDENCE");
  }
  return { valid: errors.length === 0, errors, answerCount: mappings.length };
}
