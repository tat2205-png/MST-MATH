import { normalizeBlocks } from "./normalization.js";
import { validateQuestion } from "./schema.js";
import type { ContentBlock, DocumentIR, DocumentQuestionCandidate, FigureAssociation, QuestionObject } from "./types.js";
const textOf = (block: ContentBlock) => block.type === "text" ? block.value : "";
const splitLabels = (blocks: ContentBlock[], pattern: RegExp): Array<{ label: string; content: ContentBlock[] }> => {
  const result: Array<{ label: string; content: ContentBlock[] }> = [];
  for (const block of blocks) {
    if (block.type !== "text") { if (result.length) result.at(-1)!.content.push(block); continue; }
    const matches = [...block.value.matchAll(pattern)];
    if (!matches.length) { if (result.length && block.value.trim()) result.at(-1)!.content.push(block); continue; }
    matches.forEach((match, i) => {
      const value = block.value.slice((match.index ?? 0) + match[0].length, matches[i + 1]?.index ?? block.value.length).trim();
      result.push({ label: match[1], content: value ? [{ ...block, value }] : [] });
    });
  }
  return result.filter((x) => x.content.length > 0);
};
export function normalizeCandidate(candidate: DocumentQuestionCandidate, document: DocumentIR): QuestionObject {
  const all = normalizeBlocks(candidate.textBlocks.flatMap((block) => block.type === "table" ? block.cells.flat() : [block]));
  const solutionIndex = all.findIndex((block) => block.type === "text" && /^(?:Lời\s*giải|Hướng\s*dẫn\s*giải)\s*:?(?:\s|$)/iu.test(block.value));
  const content = solutionIndex >= 0 ? all.slice(0, solutionIndex) : all;
  const solutionSource = solutionIndex >= 0 ? all.slice(solutionIndex) : [];
  const options = splitLabels(content, /([A-H])[.)](?:\s|$)/gu);
  const statements = candidate.questionTypeCandidate === "TRUE_FALSE" ? splitLabels(content, /(?:^|\s)([a-h])[.)]\s*/gu) : [];
  const firstOptionIndex = content.findIndex((block) => block.type === "text" && /[A-H][.)](?:\s|$)/u.test(block.value));
  const stem = content.slice(0, firstOptionIndex < 0 ? content.length : firstOptionIndex).filter((block) => block.type !== "figure").map((block) => block.type === "text" ? { ...block, value: block.value.replace(/^(?:(?:Câu|Bài)\s*)?\d+\s*[.:)]\s*/iu, "") } : block).filter((b) => b.type !== "text" || b.value.trim());
  const id = `${document.sourceHash.slice(0, 12)}-q${candidate.questionIndex ?? candidate.id}`; const associations: FigureAssociation[] = candidate.figureAnchors.map((figureId) => ({ figureId, questionId: id, status: "CONFIRMED", confidence: 1, evidence: ["QUESTION_BLOCK_CONTAINMENT", document.figures.find((f) => f.id === figureId)?.tableCell ? "SAME_TABLE_CELL" : "PARAGRAPH_ANCHOR_OWNERSHIP"] }));
  const result: QuestionObject = { id, source: { document: document.sourceDocument, sourceHash: document.sourceHash, blockIds: candidate.rawBlocks.map((b) => b.id), sourceLocations: candidate.sourceLocations }, section: candidate.section, index: candidate.questionIndex, type: candidate.questionTypeCandidate, stem, options: candidate.questionTypeCandidate === "MULTIPLE_CHOICE" ? options : [], trueFalseItems: statements, solution: solutionSource.map((block) => block.type === "text" ? { ...block, value: block.value.replace(/^(?:Lời\s*giải|Hướng\s*dẫn\s*giải)\s*:?\s*/iu, "") } : block).filter((block) => block.type !== "text" || block.value.trim()), subquestions: candidate.questionTypeCandidate === "ESSAY" ? splitLabels(content, /(?:^|\s)([a-h])[.)]\s*/gu) : [], figures: document.figures.filter((f) => candidate.figureAnchors.includes(f.id)), figureAssociations: associations, metadata: { questionLabel: candidate.questionLabel ?? "UNRESOLVED" }, warnings: [...candidate.parseWarnings], validationStatus: "VALID" };
  const qa = validateQuestion(result); result.warnings.push(...qa.filter((x) => x.level !== "PASS").map((x) => x.code)); result.validationStatus = qa.some((x) => x.level === "FAIL") ? "INVALID" : qa.some((x) => x.level === "WARNING") ? "REVIEW_REQUIRED" : "VALID"; return result;
}
