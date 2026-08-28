import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderDocumentToDocx } from "../src/modules/document-export/docx/renderer.ts";
import type { ContentBlock, DocumentIR, MathNode } from "../src/modules/question-bank/types.ts";

const output = resolve("tests/golden/docx"); mkdirSync(output, { recursive: true });
const generatedAt = new Date("2026-01-01T00:00:00.000Z");
const math = (latex: string, index = 0): MathNode => ({ sourceType: "LATEX", sourceRaw: latex, latex, normalized: latex, parseStatus: "PARSED", warnings: [], sourceLocation: `golden:${index}` });
const paragraph = (id: string, order: number, content: ContentBlock[], kind: "PARAGRAPH" | "SECTION" = "PARAGRAPH") => ({ id, kind, order, content, sourceLocation: `golden:${order}` } as const);
const save = (name: string, document: DocumentIR, options = {}) => writeFileSync(resolve(output, name), renderDocumentToDocx(document, { generatedAt, ...options }).bytes);
const empty = (name: string): Omit<DocumentIR, "blocks"> => ({ sourceDocument: name, sourceHash: name, warnings: [], figures: [] });

save("GOLDEN_01_TEXT_STYLES.docx", { ...empty("GOLDEN_01_TEXT_STYLES.docx"), blocks: [paragraph("title", 0, [{ type: "text", value: "Tài liệu học tập" }], "SECTION"), paragraph("body", 1, [{ type: "text", value: "Nội dung tiếng Việt theo kiểu Word gốc." }]), { id: "table", kind: "TABLE", order: 2, content: [{ type: "table", cells: [[{ type: "text", value: "Vai trò" }], [{ type: "text", value: "Giá trị" }]] }], sourceLocation: "golden:2" }] }, { outputIdentity: "learning_material" });

const mathCorpus = ["SA\\perp(ABCD)", "AB\\parallel CD", "H\\in SD", "a\\subset(P)", "\\sqrt{5}", "\\frac{2a\\sqrt{5}}{5}", "\\overrightarrow{AB}", "\\vec{u}", "\\widehat{ABC}", "60^\\circ", "M(x;y;z)", "C_n^k", "A_n^k", "P(A)=\\frac{n(A)}{n(\\Omega)}", "\\lim_{x\\to x_0}f(x)", "\\int_a^b f(x)\\,dx"];
save("GOLDEN_02_NATIVE_MATH.docx", { ...empty("GOLDEN_02_NATIVE_MATH.docx"), blocks: mathCorpus.map((latex, index) => paragraph(`m${index}`, index, [{ type: "math", math: math(latex, index) }])) });

const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><path d="M20 300L300 20L580 300Z" fill="none" stroke="#18212B"/><path d="M300 20L300 300" stroke="#18212B" stroke-dasharray="8 6"/><text x="300" y="18">S</text><text x="305" y="315">H</text><path d="M300 285h15v15" fill="none" stroke="#18212B"/></svg>');
const figure = { id: "approved-geometry", relationshipId: "pending", mimeType: "image/svg+xml", bytes: svg, sourceLocation: "golden:svg", dimensions: { widthEmu: 4_572_000, heightEmu: 3_048_000 } };
const figureOptions = { figureMetadata: { [figure.id]: { title: "Hình chóp", altText: "Hình học đã xác minh", geometryProfileId: "PYRAMID_ALTITUDE_VERTICAL_IF_PROVEN", semanticFigureId: figure.id, semanticFlags: ["VERIFIED_RIGHT_ANGLE"] } } };
save("GOLDEN_03_GEOMETRY_SVG.docx", { ...empty("GOLDEN_03_GEOMETRY_SVG.docx"), figures: [figure], blocks: [paragraph("figure", 0, [{ type: "figure", figureId: figure.id }]), paragraph("caption", 1, [{ type: "text", value: "Hình 1. Hình học SVG xác định" }])] }, figureOptions);

const long = "Học sinh trình bày lập luận rõ ràng, bảo toàn giả thiết và kiểm tra từng bước biến đổi. ".repeat(20);
save("GOLDEN_04_LAYOUT_PAGINATION.docx", { ...empty("GOLDEN_04_LAYOUT_PAGINATION.docx"), figures: [figure], blocks: [paragraph("heading", 0, [{ type: "text", value: "Bố cục lớp học" }], "SECTION"), paragraph("long", 1, [{ type: "text", value: long }]), paragraph("math", 2, [{ type: "math", math: math("\\frac{2a\\sqrt{5}}{5}") }]), paragraph("figure", 3, [{ type: "figure", figureId: figure.id }])] }, { ...figureOptions, pageBreakAfterBlockIds: ["long"], headerText: "Math AI Studio", footerText: "NA-MATH V2.6" });

save("GOLDEN_05_COMBINED_MATH_DOCUMENT.docx", { ...empty("GOLDEN_05_COMBINED_MATH_DOCUMENT.docx"), figures: [figure], blocks: [paragraph("heading", 0, [{ type: "text", value: "Bài toán tổng hợp" }], "SECTION"), paragraph("body", 1, [{ type: "text", value: "Cho hình chóp và chứng minh quan hệ sau:" }]), paragraph("math", 2, [{ type: "math", math: math("SA\\perp(ABCD)\\Rightarrow H\\in(ABCD)") }]), paragraph("figure", 3, [{ type: "figure", figureId: figure.id }]), paragraph("answer", 4, [{ type: "math", math: math("P(A)=\\frac{n(A)}{n(\\Omega)}") }])] }, { ...figureOptions, headerText: "Tài liệu học tập", footerText: "NA-MATH V2.6" });

console.log("DOCX_GOLDEN_CORPUS_GENERATED=PASS");
