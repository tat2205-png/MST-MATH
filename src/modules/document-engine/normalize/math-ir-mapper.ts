import { createHash } from "node:crypto";
import { createMathDocument, createMathProblem, validateMathIR, type MathDocument, type MathDocumentBlock, type MathExpression, type MathMetadata } from "../../math-ir/index.js";
import type { DocumentConversionReport, DocumentEngineIssue, DocxAst, DocxBlockNode, DocxInlineNode, DocxParagraphNode, DocxToMathIRResult } from "../types.js";

interface Fragment { type: "text" | "math"; text?: string; expressionId?: string; }
const problemDelimiter = /^\s*(?:Bài|Câu|Exercise|Problem)\s+(\d+|[IVXLCDM]+)\s*[.:(-]/iu;

function metadata(sourceId: string, adapterMetadata?: Record<string, unknown>): MathMetadata {
  return { sourceEvidence: [{ id: `evidence-${createHash("sha256").update(sourceId).digest("hex").slice(0, 12)}`, origin: "imported", sourceType: "docx", sourceId }], ...(adapterMetadata ? { adapterMetadata } : {}) };
}

function inlineFragments(children: DocxInlineNode[]): Fragment[] {
  return children.flatMap((child): Fragment[] => child.type === "text" ? [{ type: "text", text: child.text }] : child.type === "math" ? [{ type: "math", expressionId: child.expression.id }] : []);
}

function paragraphText(paragraph: DocxParagraphNode): string {
  return paragraph.children.map((child) => child.type === "text" ? child.text : child.type === "math" ? (child.expression.raw || child.expression.latex || "") : "").join("");
}

function tableData(table: Extract<DocxBlockNode, { type: "table" }>): unknown {
  return table.rows.map((row) => row.cells.map((cell) => cell.blocks.map((block) => block.type === "paragraph" ? { text: paragraphText(block), fragments: inlineFragments(block.children) } : { unsupported: block.type })));
}

function reportFor(ast: DocxAst, status: "PASS" | "PARTIAL" | "FAIL", issues: DocumentEngineIssue[]): DocumentConversionReport {
  return {
    status,
    warnings: issues.filter((issue) => issue.severity === "warning" && !issue.code.startsWith("UNSUPPORTED") && !issue.code.includes("FALLBACK") && issue.code !== "IMAGE_MATH_NOT_PARSED"),
    unsupported: issues.filter((issue) => issue.code.startsWith("UNSUPPORTED") || issue.code.includes("FALLBACK") || issue.code === "IMAGE_MATH_NOT_PARSED"),
    errors: issues.filter((issue) => issue.severity === "error"),
    assets: ast.assets.map(({ bytes: _bytes, ...asset }) => asset),
    statistics: {
      paragraphs: ast.blocks.reduce((count, block) => count + (block.type === "paragraph" ? 1 : block.type === "table" ? block.rows.reduce((sum, row) => sum + row.cells.reduce((cellSum, cell) => cellSum + cell.blocks.filter((nested) => nested.type === "paragraph").length, 0), 0) : 0), 0),
      equations: collectExpressions(ast).length,
      images: ast.assets.length,
      tables: ast.blocks.filter((block) => block.type === "table").length,
    },
  };
}

function collectExpressions(ast: DocxAst): MathExpression[] {
  const result = new Map<string, MathExpression>();
  const visit = (blocks: DocxBlockNode[]) => blocks.forEach((block) => {
    if (block.type === "paragraph") block.children.forEach((child) => { if (child.type === "math") result.set(child.expression.id, child.expression); });
    else if (block.type === "table") block.rows.forEach((row) => row.cells.forEach((cell) => visit(cell.blocks)));
  });
  visit(ast.blocks);
  return [...result.values()];
}

function paragraphBlocks(paragraph: DocxParagraphNode, blockCounter: { value: number }): MathDocumentBlock[] {
  const blocks: MathDocumentBlock[] = [];
  let fragments: Fragment[] = [];
  const flush = () => {
    if (!fragments.length) return;
    const text = fragments.filter((fragment) => fragment.type === "text").map((fragment) => fragment.text).join("");
    const expressionIds = fragments.filter((fragment) => fragment.type === "math").map((fragment) => fragment.expressionId!);
    const common = { id: `block-${++blockCounter.value}`, text, ...(expressionIds.length ? { expressionIds } : {}), metadata: metadata(`word/document.xml:paragraph:${paragraph.index}`, { paragraphIndex: paragraph.index, fragments }) };
    if (paragraph.headingLevel) blocks.push({ ...common, type: "heading", level: paragraph.headingLevel });
    else if (paragraph.list) blocks.push({ ...common, type: "list_item", level: paragraph.list.level, ordered: paragraph.list.ordered });
    else blocks.push({ ...common, type: "paragraph" });
    fragments = [];
  };
  paragraph.children.forEach((child) => {
    if (child.type === "text" || (child.type === "math" && !child.display)) fragments.push(...inlineFragments([child]));
    else if (child.type === "math") {
      flush();
      blocks.push({ id: `block-${++blockCounter.value}`, type: "equation", expressionId: child.expression.id, display: true, metadata: metadata(child.sourcePath, { paragraphIndex: paragraph.index }) });
    } else if (child.type === "image") {
      flush();
      if (child.assetId) blocks.push({ id: `block-${++blockCounter.value}`, type: "image_reference", assetId: child.assetId, metadata: metadata(child.sourcePath, { paragraphIndex: paragraph.index, relationshipId: child.relationshipId, widthEmu: child.widthEmu, heightEmu: child.heightEmu }) });
      else blocks.push({ id: `block-${++blockCounter.value}`, type: "paragraph", text: "[missing image]", metadata: metadata(child.sourcePath, { missingRelationshipId: child.relationshipId }) });
    } else if (child.type === "page_break") {
      flush(); blocks.push({ id: `block-${++blockCounter.value}`, type: "page_break", metadata: metadata(`word/document.xml:paragraph:${paragraph.index}`) });
    } else {
      flush(); blocks.push({ id: `block-${++blockCounter.value}`, type: "paragraph", text: `[${child.reason}]`, metadata: metadata(child.sourcePath, { relationshipId: child.relationshipId, status: "NEEDS_FALLBACK" }) });
    }
  });
  flush();
  return blocks;
}

export function docxAstToMathIR(ast: DocxAst): DocxToMathIRResult {
  const issues = [...ast.issues];
  const expressions = collectExpressions(ast);
  const sections: MathDocument["sections"] = [{ id: "section-1", blocks: [], metadata: metadata("word/document.xml:section:0", { sectionIndex: 0 }) }];
  const assets: NonNullable<MathDocument["assets"]> = ast.assets.map((asset) => ({ id: asset.id, kind: "image", uri: asset.packagePath, mimeType: asset.mediaType, metadata: metadata(`relationship:${asset.relationshipId}`, { relationshipId: asset.relationshipId, filename: asset.filename, widthEmu: asset.widthEmu, heightEmu: asset.heightEmu }) }));
  const blockCounter = { value: 0 };
  let sectionIndex = 0;
  for (const block of ast.blocks) {
    if (block.type === "section_break") {
      sectionIndex++;
      sections.push({ id: `section-${sectionIndex + 1}`, blocks: [], metadata: metadata(`word/document.xml:section:${sectionIndex}`, { sectionIndex }) });
    } else if (block.type === "paragraph") sections.at(-1)!.blocks.push(...paragraphBlocks(block, blockCounter));
    else {
      const assetId = `table-${block.index + 1}`;
      assets.push({ id: assetId, kind: "table", metadata: metadata(`word/document.xml:table:${block.index}`, { tableIndex: block.index, rows: tableData(block) }) });
      sections.at(-1)!.blocks.push({ id: `block-${++blockCounter.value}`, type: "table_reference", tableId: assetId, metadata: metadata(`word/document.xml:table:${block.index}`, { tableIndex: block.index }) });
    }
  }

  const problems: MathDocument["problems"] = [];
  let current: { id: string; statementParts: string[]; expressionIds: Set<string>; paragraphIndexes: number[] } | undefined;
  const finalizeProblem = () => {
    if (!current) return;
    problems.push(createMathProblem({
      id: current.id, statement: current.statementParts.join("\n").trim(), problemType: "imported_docx",
      expressions: expressions.filter((expression) => current!.expressionIds.has(expression.id)),
      givens: [], targets: [], sceneIds: [],
      metadata: metadata(`word/document.xml:problem:${current.id}`, { paragraphIndexes: current.paragraphIndexes, boundaryDetection: "explicit_exercise_prefix" }),
      sourceEvidence: [{ id: `evidence-${current.id}`, origin: "imported", sourceType: "docx", sourceId: current.paragraphIndexes.join(","), excerpt: current.statementParts.join(" ").slice(0, 500) }],
    }));
  };
  for (const block of ast.blocks) if (block.type === "paragraph") {
    const text = paragraphText(block);
    const delimiter = problemDelimiter.exec(text);
    if (delimiter) { finalizeProblem(); current = { id: `problem-${delimiter[1].toLowerCase()}`, statementParts: [], expressionIds: new Set(), paragraphIndexes: [] }; }
    if (current) {
      current.statementParts.push(text); current.paragraphIndexes.push(block.index);
      block.children.forEach((child) => { if (child.type === "math") current!.expressionIds.add(child.expression.id); });
    }
  }
  finalizeProblem();

  const document = createMathDocument({
    id: `docx-${createHash("sha256").update(ast.sourceName ?? JSON.stringify(sections)).digest("hex").slice(0, 16)}`,
    title: ast.sourceName, sections, problems, scenes: [], expressions, assets,
    metadata: metadata("word/document.xml", { sourceType: "docx", sourceName: ast.sourceName, problemBoundaryStatus: problems.length ? "DETERMINISTIC" : "NOT_DETECTED" }),
  });
  const validation = validateMathIR(document);
  if (validation.status === "FAIL") validation.issues.forEach((issue) => issues.push({ code: `MATH_IR_${issue.code}`, severity: issue.severity, path: issue.path, message: issue.message }));
  const status = validation.status === "FAIL" ? "FAIL" : issues.length ? "PARTIAL" : "PASS";
  return { status, ...(validation.status === "PASS" ? { document } : {}), ast, report: reportFor(ast, status, issues) };
}
