import { normalizeCandidate } from "./extraction.js";
import { segmentQuestions } from "./segmentation.js";
import type { DocumentIR, ExtractionIssue, Provenance } from "../document-engine/document-ir.js";
import type { QuestionIR } from "./contracts.js";
import { detectSharedContexts } from "./boundary-validation.js";

const provenanceFor = (document: DocumentIR): Provenance => document.provenance ?? { sourceFile: document.sourceDocument, sourceSha256: document.sourceHash, sourceKind: "DOCX", parser: "document-engine", transformationHistory: [] };
const blocks = (question: ReturnType<typeof normalizeCandidate>) => [...question.stem, ...question.options.flatMap(option => option.content), ...question.trueFalseItems.flatMap(item => item.content), ...(question.answer ?? []), ...(question.solution ?? [])];
const ids = (question: ReturnType<typeof normalizeCandidate>) => blocks(question).flatMap(block => block.type === "math" ? [block.math.id ?? ""] : block.type === "figure" ? [block.figureId] : block.type === "table" ? block.cells.flatMap(row => row.flatMap(cell => cell.type === "figure" ? [cell.figureId] : [])) : []).filter(Boolean);

export function segmentCanonicalQuestions(document: DocumentIR): QuestionIR[] {
  const contexts = detectSharedContexts(document);
  return segmentQuestions(document).map(candidate => {
    const normalized = normalizeCandidate(candidate, document);
    const mathObjectIds = ids(normalized).filter(id => document.mathObjects?.some(entry => entry.mathObjectId === id));
    const assetIds = [...new Set([...normalized.figures.map(figure => figure.id), ...ids(normalized).filter(id => document.assetObjects?.some(entry => entry.assetId === id))])];
    const tableIds = document.assetObjects?.filter(asset => asset.kind === "TABLE" && candidate.rawBlocks.some(block => block.content.some(content => content.type === "table"))).map(asset => asset.assetId) ?? [];
    const issues: ExtractionIssue[] = normalized.warnings.map(code => ({ code, severity: "WARNING", message: code, status: "REVIEW", objectId: normalized.id }));
    const contextIds = contexts.filter(context => context.sourceObjectIds.some(id => candidate.rawBlocks.some(block => block.id === id))).map(context => context.contextId);
    return { id: normalized.id, questionNumber: normalized.index, questionType: normalized.type, sourceDocumentId: document.sourceDocumentId ?? document.id ?? document.sourceHash, sourceObjectIds: candidate.rawBlocks.map(block => block.id), stem: normalized.stem, options: normalized.options, answer: normalized.answer, solution: normalized.solution, mathObjectIds, assetIds, tableIds, ...(contextIds.length ? { contextIds } : {}), metadata: normalized.metadata, qaStatus: issues.length || normalized.validationStatus !== "VALID" ? "REVIEW" : "PASS", issues, provenance: provenanceFor(document) };
  });
}
