import type { QAResult, QuestionObject } from "./types.js";
export function validateQuestion(question: QuestionObject): QAResult[] {
  const out: QAResult[] = [];
  if (!question.id || !question.source.document || !question.source.sourceHash || !question.source.blockIds.length) out.push({ level: "FAIL", code: "INVALID_SOURCE_LOCATION", message: "Question source traceability is incomplete" });
  if (!question.stem.length) out.push({ level: "FAIL", code: "MISSING_STEM", message: "Question stem is empty" });
  if (question.type === "MULTIPLE_CHOICE") { const labels = question.options.map((x) => x.label); if (labels.length < 2 || new Set(labels).size !== labels.length) out.push({ level: "FAIL", code: "INVALID_OPTIONS", message: "Options must be ordered and unique" }); }
  if (question.type === "TRUE_FALSE" && (!question.trueFalseItems.length || question.trueFalseItems.some((x) => !x.content.length))) out.push({ level: "FAIL", code: "EMPTY_TRUE_FALSE_STATEMENT", message: "True/false statements must be separate and non-empty" });
  const unresolved = [...question.stem, ...question.options.flatMap((x) => x.content), ...question.trueFalseItems.flatMap((x) => x.content)].some((x) => x.type === "math" && x.math.parseStatus !== "PARSED");
  if (unresolved) out.push({ level: "WARNING", code: "UNRESOLVED_MATH", message: "Question contains unresolved source math" });
  return out.length ? out : [{ level: "PASS", code: "VALID", message: "Question is structurally valid" }];
}
