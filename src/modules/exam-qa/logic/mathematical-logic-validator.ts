import { EXAM_QA_ISSUE_CODES, type ExamQAIssueCode } from "../issue-codes.js";
import type { NormalizedExamQuestion, QAIssue } from "../types.js";
import { extractDeclarations, extractImpliedGeometrySymbols } from "./declaration-extractor.js";
import type { LogicScope, MathSymbolRecord } from "./logic-rules.js";
import { QuestionSymbolTable } from "./symbol-table.js";
import { extractGeometryReferences, extractTargetReferences } from "./symbol-extractor.js";

const issue = (question: NormalizedExamQuestion, field: string, code: ExamQAIssueCode, severity: QAIssue["severity"], message: string, details: Record<string, unknown>): QAIssue => ({ code, category: "MATH", severity, message, questionId: question.id, location: { field, sectionId: question.section, sourcePage: question.sourcePage, sourceIndex: question.sourceIndex }, details });

function seedQuestionSymbols(question: NormalizedExamQuestion, table: QuestionSymbolTable): void {
  const text = question.stem ?? "";
  for (const symbol of extractImpliedGeometrySymbols(text)) if (!table.has(symbol.name)) table.add({ name: symbol.name, kind: symbol.kind, state: "DERIVED_OR_IMPLIED", declaredAt: symbol.start, sourceLocation: { field: "stem", start: symbol.start }, dependsOn: [], confidence: "HIGH", metadata: { rule: "NAMED_GEOMETRY_OBJECT" } });
  const structured = question.metadata?.logicSymbols;
  if (Array.isArray(structured)) for (const value of structured) if (typeof value === "string" && !table.has(value)) table.add({ name: value, kind: "UNKNOWN", state: "DECLARED", sourceLocation: { field: "metadata.logicSymbols" }, dependsOn: [], confidence: "HIGH", metadata: { structuredSource: true } });
}

function processDeclarations(question: NormalizedExamQuestion, text: string, field: string, table: QuestionSymbolTable): QAIssue[] {
  const issues: QAIssue[] = [];
  for (const declaration of extractDeclarations(text)) {
    if (declaration.dependsOn.includes(declaration.name)) issues.push(issue(question, field, EXAM_QA_ISSUE_CODES.LOGIC_SELF_REFERENTIAL_DEFINITION, "ERROR", `Definition of ${declaration.name} depends on itself.`, { symbol: declaration.name, definition: declaration.definition }));
    const unresolved = declaration.dependsOn.filter((name) => name !== declaration.name && !table.has(name));
    if (unresolved.length) issues.push(issue(question, field, EXAM_QA_ISSUE_CODES.LOGIC_DECLARATION_DEPENDENCY_UNRESOLVED, "ERROR", `Definition of ${declaration.name} depends on unavailable symbols: ${unresolved.join(", ")}.`, { symbol: declaration.name, unresolvedSymbols: unresolved, definition: declaration.definition }));
    const prior = table.get(declaration.name).filter((record) => record.state === "DECLARED");
    if (prior.length) {
      const same = prior.some((record) => record.metadata?.definition === declaration.definition);
      issues.push(issue(question, field, same ? EXAM_QA_ISSUE_CODES.LOGIC_SYMBOL_REDEFINED : EXAM_QA_ISSUE_CODES.LOGIC_CONFLICTING_DEFINITION, "ERROR", `${declaration.name} is declared more than once${same ? "." : " with conflicting definitions."}`, { symbol: declaration.name, previousDefinitions: prior.map((record) => record.metadata?.definition), definition: declaration.definition }));
    }
    const record: MathSymbolRecord = { name: declaration.name, kind: declaration.kind, state: "DECLARED", declaredAt: declaration.start, sourceLocation: { field, start: declaration.start, end: declaration.end }, dependsOn: declaration.dependsOn, confidence: "HIGH", metadata: { definition: declaration.definition } };
    table.add(record);
  }
  return issues;
}

function validateReferences(question: NormalizedExamQuestion, text: string, field: string, table: QuestionSymbolTable, scope: LogicScope, targetOnly: boolean): QAIssue[] {
  const references = targetOnly ? extractTargetReferences(text) : [...new Set([...extractTargetReferences(text), ...extractGeometryReferences(text)])];
  const unresolved = references.filter((name) => !table.has(name));
  if (!unresolved.length) return [];
  const code = targetOnly ? EXAM_QA_ISSUE_CODES.LOGIC_TARGET_REFERENCE_UNRESOLVED : EXAM_QA_ISSUE_CODES.UNDEFINED_SYMBOL_REFERENCE;
  return unresolved.map((symbol) => issue(question, field, code, "ERROR", `Mathematical symbol ${symbol} is not declared in the ${scope.toLowerCase()} scope.`, { symbol, scope }));
}

function explicitContradictions(question: NormalizedExamQuestion, text: string, field: string): QAIssue[] {
  const issues: QAIssue[] = [];
  for (const unequal of text.matchAll(/([A-ZĐ][A-ZĐ0-9_₀-₉'’′]*)\s*≠\s*([A-ZĐ][A-ZĐ0-9_₀-₉'’′]*)/g)) {
    const reverse = new RegExp(`(?:${unequal[1]}\\s*=\\s*${unequal[2]}|${unequal[2]}\\s*=\\s*${unequal[1]})`);
    if (reverse.test(text)) issues.push(issue(question, field, EXAM_QA_ISSUE_CODES.LOGIC_EXPLICIT_CONTRADICTION, "ERROR", "The text explicitly states both equality and inequality for the same symbols.", { left: unequal[1], right: unequal[2] }));
  }
  for (const midpoint of text.matchAll(/gọi\s+([A-ZĐ])\s+là\s+trung điểm (?:của )?([A-ZĐ]{2})/giu)) if (new RegExp(`${midpoint[1]}\\s+không thuộc\\s+${midpoint[2]}`, "iu").test(text)) issues.push(issue(question, field, EXAM_QA_ISSUE_CODES.LOGIC_EXPLICIT_CONTRADICTION, "ERROR", "A declared midpoint is explicitly stated not to lie on its defining segment.", { symbol: midpoint[1], segment: midpoint[2] }));
  return issues;
}

export function validateMathematicalQuestionLogic(question: NormalizedExamQuestion): QAIssue[] {
  const table = new QuestionSymbolTable();
  seedQuestionSymbols(question, table);
  const issues: QAIssue[] = [];
  const stem = question.stem ?? "";
  issues.push(...processDeclarations(question, stem, "stem", table), ...validateReferences(question, stem, "stem", table, "QUESTION", true), ...explicitContradictions(question, stem, "stem"));

  for (const option of question.options ?? []) {
    const local = table.clone(); const field = `option:${option.key}`;
    issues.push(...processDeclarations(question, option.text, field, local), ...validateReferences(question, option.text, field, local, "OPTION", false), ...explicitContradictions(question, option.text, field));
  }
  for (let index = 0; index < (question.trueFalseStatements ?? []).length; index += 1) {
    const statement = question.trueFalseStatements![index]; const local = table.clone(); const field = `statement:${statement.key ?? index + 1}`;
    issues.push(...processDeclarations(question, statement.text, field, local), ...validateReferences(question, statement.text, field, local, "TRUE_FALSE_STATEMENT", false), ...explicitContradictions(question, statement.text, field));
  }
  const unresolvedTarget = issues.some((item) => item.code === EXAM_QA_ISSUE_CODES.LOGIC_TARGET_REFERENCE_UNRESOLVED);
  if (unresolvedTarget && (question.assets?.length ?? 0) > 0) issues.push(issue(question, "assets", EXAM_QA_ISSUE_CODES.LOGIC_FIGURE_REFERENCE_NOT_VERIFIABLE, "WARNING", "Unresolved target symbols may appear only in an unverified figure; EXAM-QA-2 does not inspect raster assets.", { assetCount: question.assets!.length }));
  return issues;
}

export function buildQuestionSymbolTable(question: NormalizedExamQuestion): QuestionSymbolTable {
  const table = new QuestionSymbolTable(); seedQuestionSymbols(question, table); processDeclarations(question, question.stem ?? "", "stem", table); return table;
}

