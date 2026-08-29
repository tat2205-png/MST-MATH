import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { createWordLayoutMap, renderDocumentToDocx } from "../src/modules/document-export/docx/index.ts";
import type { DocumentIR, MathNode } from "../src/modules/question-bank/types.ts";

const math: MathNode = { sourceType: "LATEX", sourceRaw: "\\frac{2a\\sqrt{5}}{5}", latex: "\\frac{2a\\sqrt{5}}{5}", normalized: "\\frac{2a\\sqrt{5}}{5}", parseStatus: "PARSED", warnings: [], sourceLocation: "layout:math" };
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500"><path d="M0 500L500 0L1000 500"/></svg>');
const paragraph = "Trong quá trình học tập môn Toán, học sinh cần trình bày lập luận rõ ràng, bảo toàn giả thiết và kiểm tra từng bước biến đổi. ".repeat(18);
const document: DocumentIR = { sourceDocument: "pagination.docx", sourceHash: "layout", warnings: [], figures: [{ id: "large", relationshipId: "pending", mimeType: "image/svg+xml", bytes: svg, sourceLocation: "layout:svg", dimensions: { widthEmu: 9_000_000, heightEmu: 4_500_000 } }], blocks: [
  { id: "h1", kind: "SECTION", order: 0, content: [{ type: "text", value: "Bố cục và phân trang" }], sourceLocation: "layout:0" },
  { id: "long", kind: "PARAGRAPH", order: 1, content: [{ type: "text", value: paragraph }], sourceLocation: "layout:1" },
  { id: "math", kind: "PARAGRAPH", order: 2, content: [{ type: "math", math }], sourceLocation: "layout:2" },
  { id: "card", kind: "TABLE", order: 3, content: [{ type: "table", cells: [[{ type: "text", value: paragraph }], [{ type: "text", value: "Ghi nhớ" }]] }], sourceLocation: "layout:3" },
  { id: "figure", kind: "PARAGRAPH", order: 4, content: [{ type: "figure", figureId: "large" }], sourceLocation: "layout:4" },
  { id: "caption", kind: "PARAGRAPH", order: 5, style: "NAFigureCaption", content: [{ type: "text", value: "Hình 1. Hình lớn trong vùng an toàn" }], sourceLocation: "layout:5" },
] };
const result = renderDocumentToDocx(document, { pageBreakAfterBlockIds: ["long"], headerText: "Math AI Studio", footerText: "NA-MATH V2.6" });
const parts = unzipSync(result.bytes); const xml = new TextDecoder().decode(parts["word/document.xml"]); const styles = new TextDecoder().decode(parts["word/styles.xml"]);
const layout = createWordLayoutMap();
assert.match(xml, new RegExp(`<w:pgMar w:top="${layout.page.marginTwips}"`));
assert.match(xml, /<w:br w:type="page"\/>/); assert.match(xml, /<w:cantSplit\/>/); assert.match(xml, /<w:keepNext\/>/); assert.match(xml, /<w:keepLines\/>/);
assert.match(xml, new RegExp(`cx="${layout.availableTextWidthEmu}"`)); assert.ok(result.warnings.includes("DOCX_FIGURE_SCALED_TO_SAFE_WIDTH:large"));
assert.ok(parts["word/header1.xml"]); assert.ok(parts["word/footer1.xml"]); assert.doesNotMatch(xml, /wp:anchor|w:txbxContent|w:hRule="exact"/);
assert.match(styles, /<w:widowControl\/>/); assert.doesNotMatch(styles, /w:hRule="exact"/);
console.log("PAGE_LAYOUT_QA=PASS\nPAGE_BREAK_QA=PASS\nTABLE_SPLIT_QA=PASS\nINLINE_LAYOUT_QA=PASS\nSTRUCTURAL_OVERFLOW_QA=PASS");
