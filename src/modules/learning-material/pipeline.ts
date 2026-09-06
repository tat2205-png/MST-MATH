import { createHash } from "node:crypto";
import type { ContentBlock, DocumentBlock, DocumentIR, FigureRecord } from "../document-engine/document-ir.js";
import {
  P01_ICON_AUTHORITY,
  P01_PROFILE_ID,
  type P01ActivityGraph,
  type P01ContentModel,
  type P01LessonIR,
  type P01QaFinding,
  type P01QaResult,
  type P01VisualRequirement,
} from "./types.js";

function digest(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (value instanceof Uint8Array) return { $bytesSha256: digest(value), $length: value.length };
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function blockSemanticValue(block: DocumentBlock): unknown {
  return {
    id: block.id,
    kind: block.kind,
    order: block.order,
    paragraphIndex: block.paragraphIndex,
    style: block.style,
    numbering: block.numbering,
    numberingMeta: block.numberingMeta,
    boldLabel: block.boldLabel,
    section: block.section,
    content: block.content,
    sourceLocation: block.sourceLocation,
  };
}

function figureSemanticValue(figure: FigureRecord): unknown {
  return {
    id: figure.id,
    relationshipId: figure.relationshipId,
    mediaPath: figure.mediaPath,
    mimeType: figure.mimeType,
    bytesSha256: figure.bytes ? digest(figure.bytes) : undefined,
    sourceLocation: figure.sourceLocation,
    paragraphIndex: figure.paragraphIndex,
    tableCell: figure.tableCell,
    dimensions: figure.dimensions,
    caption: figure.caption,
    semanticRole: figure.semanticRole,
    status: figure.status,
  };
}

export function semanticSignatureForDocument(document: DocumentIR): string {
  return digest(
    stableStringify({
      sourceDocument: document.sourceDocument,
      sourceHash: document.sourceHash,
      blocks: [...document.blocks].sort((a, b) => a.order - b.order).map(blockSemanticValue),
      figures: [...document.figures].sort((a, b) => a.id.localeCompare(b.id)).map(figureSemanticValue),
    }),
  );
}

function contentModel(document: DocumentIR): P01ContentModel {
  const units = [...document.blocks]
    .sort((a, b) => a.order - b.order)
    .map((block) => ({
      id: `p01-unit-${block.id}`,
      sourceBlockId: block.id,
      sourceLocation: block.sourceLocation,
      order: block.order,
      kind: block.kind,
      content: structuredClone(block.content),
    }));
  return {
    schemaVersion: 1,
    sourceDocument: document.sourceDocument,
    sourceHash: document.sourceHash,
    units,
  };
}

function activityGraph(model: P01ContentModel): P01ActivityGraph {
  const nodes = model.units.map((unit) => ({ id: `activity-${unit.id}`, kind: "SOURCE_UNIT" as const, unitId: unit.id }));
  const edges = nodes.slice(1).map((node, index) => ({ from: nodes[index]!.id, to: node.id }));
  return { strategy: "SOURCE_SEQUENCE", nodes, edges };
}

function collectVisualRequirements(unitId: string, blocks: ContentBlock[], output: P01VisualRequirement[], prefix: string): void {
  for (const [index, block] of blocks.entries()) {
    const id = `${prefix}-${index}`;
    if (block.type === "math") {
      output.push({ id: `vr-equation-${id}`, kind: "EQUATION", sourceUnitId: unitId, sourceLocation: block.sourceLocation ?? block.math.sourceLocation });
    } else if (block.type === "figure") {
      output.push({ id: `vr-figure-${id}`, kind: "FIGURE", sourceUnitId: unitId, figureId: block.figureId, sourceLocation: block.sourceLocation });
    } else if (block.type === "table") {
      output.push({ id: `vr-table-${id}`, kind: "TABLE", sourceUnitId: unitId, sourceLocation: block.sourceLocation });
      block.cells.forEach((cell, cellIndex) => collectVisualRequirements(unitId, cell, output, `${id}-cell-${cellIndex}`));
    }
  }
}

function visualRequirements(model: P01ContentModel): P01VisualRequirement[] {
  const output: P01VisualRequirement[] = [];
  for (const unit of model.units) collectVisualRequirements(unit.id, unit.content, output, unit.id);
  return output;
}

export function buildP01LessonIR(document: DocumentIR): P01LessonIR {
  const model = contentModel(document);
  const signature = semanticSignatureForDocument(document);
  return {
    schemaVersion: 1,
    kind: "P01_LESSON_IR",
    profileId: P01_PROFILE_ID,
    iconAuthority: P01_ICON_AUTHORITY,
    source: {
      document: document.sourceDocument,
      sha256: document.sourceHash,
      provenance: document.provenance ? structuredClone(document.provenance) : undefined,
    },
    contentModel: model,
    blueprint: { strategy: "SOURCE_SEQUENCE", unitIds: model.units.map((unit) => unit.id) },
    activityGraph: activityGraph(model),
    visualRequirements: visualRequirements(model),
    document: structuredClone(document),
    semanticSignature: signature,
  };
}

function countMath(blocks: ContentBlock[]): number {
  return blocks.reduce((count, block) => {
    if (block.type === "math") return count + 1;
    if (block.type === "table") return count + block.cells.reduce((sum, cell) => sum + countMath(cell), 0);
    return count;
  }, 0);
}

function figureRefs(blocks: ContentBlock[], output = new Set<string>()): Set<string> {
  for (const block of blocks) {
    if (block.type === "figure") output.add(block.figureId);
    if (block.type === "table") block.cells.forEach((cell) => figureRefs(cell, output));
  }
  return output;
}

export function validateP01LessonIR(lesson: P01LessonIR): P01QaResult {
  const findings: P01QaFinding[] = [];
  const source = lesson.document;
  const sourceBlocks = [...source.blocks].sort((a, b) => a.order - b.order);
  const sourceIds = sourceBlocks.map((block) => block.id);
  const unitBlockIds = lesson.contentModel.units.map((unit) => unit.sourceBlockId);
  const blueprintBlockIds = lesson.blueprint.unitIds.map((unitId) => lesson.contentModel.units.find((unit) => unit.id === unitId)?.sourceBlockId ?? "MISSING");
  const currentSignature = semanticSignatureForDocument(source);

  if (lesson.profileId !== P01_PROFILE_ID) findings.push({ code: "P01_PROFILE_MISMATCH", status: "QUARANTINED", message: "P01 profile identity changed." });
  if (lesson.iconAuthority !== P01_ICON_AUTHORITY) findings.push({ code: "P01_ICON_AUTHORITY_MISMATCH", status: "QUARANTINED", message: "P01 must use the active V1.1 semantic icon authority." });
  if (lesson.source.sha256 !== source.sourceHash || lesson.contentModel.sourceHash !== source.sourceHash) findings.push({ code: "P01_SOURCE_HASH_MISMATCH", status: "QUARANTINED", message: "Lesson lineage does not match DocumentIR source hash." });
  if (lesson.semanticSignature !== currentSignature) findings.push({ code: "P01_SEMANTIC_SIGNATURE_STALE", status: "QUARANTINED", message: "Lesson semantic signature does not match its embedded source document." });
  if (stableStringify(sourceIds) !== stableStringify(unitBlockIds)) findings.push({ code: "P01_CONTENT_LOSS_OR_REORDER", status: "QUARANTINED", message: "Content Model must preserve every source block exactly once and in source order." });
  if (stableStringify(sourceIds) !== stableStringify(blueprintBlockIds)) findings.push({ code: "P01_BLUEPRINT_SOURCE_ORDER_MISMATCH", status: "QUARANTINED", message: "Lesson Blueprint must preserve source order in zero-inference mode." });

  for (const issue of source.extractionIssues ?? []) {
    if (issue.status === "QUARANTINED" || issue.status === "UNSUPPORTED") {
      findings.push({ code: `P01_SOURCE_${issue.code}`, status: issue.status, message: issue.message, objectId: issue.objectId });
    } else if (issue.status === "REVIEW") {
      findings.push({ code: `P01_SOURCE_${issue.code}`, status: "REVIEW", message: issue.message, objectId: issue.objectId });
    }
  }

  const sourceMath = sourceBlocks.reduce((sum, block) => sum + countMath(block.content), 0);
  const lessonMath = lesson.contentModel.units.reduce((sum, unit) => sum + countMath(unit.content), 0);
  if (sourceMath !== lessonMath) findings.push({ code: "P01_MATH_COUNT_MISMATCH", status: "QUARANTINED", message: "Math objects were lost or duplicated." });

  const sourceFigureIds = new Set(source.figures.map((figure) => figure.id));
  const referencedFigures = new Set<string>();
  sourceBlocks.forEach((block) => figureRefs(block.content, referencedFigures));
  for (const figureId of referencedFigures) {
    if (!sourceFigureIds.has(figureId)) findings.push({ code: "P01_FIGURE_REFERENCE_MISSING", status: "QUARANTINED", message: `Referenced figure is missing from DocumentIR: ${figureId}`, objectId: figureId });
  }

  const fail = findings.some((finding) => finding.status === "QUARANTINED" || finding.status === "UNSUPPORTED");
  const review = findings.some((finding) => finding.status === "REVIEW");
  return {
    state: fail ? "FAIL" : review ? "REVIEW" : "PASS",
    findings,
    semanticSignature: lesson.semanticSignature,
    sourceBlockCount: source.blocks.length,
    lessonUnitCount: lesson.contentModel.units.length,
    sourceFigureCount: source.figures.length,
    referencedFigureCount: referencedFigures.size,
    sourceMathCount: sourceMath,
    lessonMathCount: lessonMath,
  };
}

export function lessonIrToDocumentIR(lesson: P01LessonIR): DocumentIR {
  const qa = validateP01LessonIR(lesson);
  if (qa.state !== "PASS") throw new Error(`P01_LESSON_NOT_RENDERABLE:${qa.findings.map((finding) => finding.code).join(",") || qa.state}`);
  return structuredClone(lesson.document);
}
