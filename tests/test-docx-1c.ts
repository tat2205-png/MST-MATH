import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { renderDocumentToDocx } from "../src/modules/document-export/docx/index.ts";
import type { DocumentIR, MathNode } from "../src/modules/question-bank/types.ts";

const corpus = [
  "SA\\perp(ABCD)", "AB\\parallel CD", "H\\in SD", "a\\subset(P)", "a\\cap b=\\{M\\}", "\\sqrt{5}", "\\frac{2a\\sqrt{5}}{5}",
  "\\overrightarrow{AB}", "\\vec{u}", "\\widehat{ABC}", "60^\\circ", "M(x;y;z)", "C_n^k", "A_n^k", "P(A)=\\frac{n(A)}{n(\\Omega)}",
  "\\lim_{x\\to x_0}f(x)", "f'(x)", "\\int_a^b f(x)\\,dx", "x\\notin A", "A\\cup B", "P\\Rightarrow Q", "P\\Leftrightarrow Q",
];
const math = (latex: string, index: number): MathNode => ({ sourceType: "LATEX", sourceRaw: latex, latex, normalized: latex, parseStatus: "PARSED", warnings: [], sourceLocation: `corpus:${index}` });
const document: DocumentIR = { sourceDocument: "native-math.docx", sourceHash: "math", figures: [], warnings: [], blocks: corpus.map((latex, index) => ({ id: `m${index}`, kind: "PARAGRAPH", order: index, content: [{ type: "math", math: math(latex, index) }], sourceLocation: `corpus:${index}` })) };
const parts = unzipSync(renderDocumentToDocx(document).bytes);
const xml = new TextDecoder().decode(parts["word/document.xml"]);
const settings = new TextDecoder().decode(parts["word/settings.xml"]);
assert.equal((xml.match(/<m:oMath>/g) ?? []).length, corpus.length);
for (const structure of ["m:f", "m:rad", "m:sSup", "m:sSub", "m:acc"]) assert.match(xml, new RegExp(`<${structure}>`));
for (const raw of ["⊥", "∥", "∈", "∉", "√", "∠", "⇒", "⇔", "≠", "≤", "≥", "∞"]) assert.doesNotMatch(xml, new RegExp(raw));
for (const entity of ["&#x22A5;", "&#x2225;", "&#x2208;", "&#x2282;", "&#x2229;", "&#x222A;", "&#x21D2;", "&#x21D4;"]) assert.match(xml, new RegExp(entity.replace(/[&;#]/g, (x) => `\\${x}`)));
assert.match(settings, /<m:mathFont m:val="Cambria Math"\/>/);
assert.throws(() => renderDocumentToDocx({ ...document, blocks: [{ ...document.blocks[0], content: [{ type: "math", math: math("AB ⊥ CD", 99) }] }] }), /RAW_UNICODE_MATH/);
console.log("OMML_PRESENT_QA=PASS\nOMML_STRUCTURE_QA=PASS\nEDITABLE_MATH_STRUCTURE_QA=PASS\nOMML_QA=PASS\nMATH_FONT_QA=PASS\nMATH_FONT_CONFIG_QA=PASS\nMATH_SYMBOL_QA=PASS\nRAW_UNICODE_MATH_QA=PASS\nWORD_RUNTIME_QA=NOT_AVAILABLE\nWORD_MATH_FONT_RUNTIME_WARNING");
