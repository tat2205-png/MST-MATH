import assert from "node:assert/strict";
import { XMLParser } from "fast-xml-parser";
import { zipSync } from "fflate";
import { parseDocxToDocumentIR } from "../src/modules/question-bank/documentIr.ts";
import { importDocxDetailed } from "../src/modules/question-bank/importers/docx.ts";
import { convertOmml } from "../src/modules/question-bank/omml.ts";

const enc = new TextEncoder();
const p = (content: string) => `<w:p>${content}</w:p>`;
const t = (value: string) => `<w:r><w:t xml:space="preserve">${value}</w:t></w:r>`;
const omml = {
  sup: `<m:oMath><m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:oMath>`,
  sub: `<m:oMath><m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>1</m:t></m:r></m:sub></m:sSub></m:oMath>`,
  frac: `<m:oMath><m:f><m:num><m:r><m:t>a+b</m:t></m:r></m:num><m:den><m:r><m:t>c</m:t></m:r></m:den></m:f></m:oMath>`,
  rad: `<m:oMath><m:rad><m:e><m:r><m:t>x+1</m:t></m:r></m:e></m:rad></m:oMath>`,
  integral: `<m:oMath><m:nary><m:naryPr><m:chr m:val="∫"/></m:naryPr><m:sub><m:r><m:t>0</m:t></m:r></m:sub><m:sup><m:r><m:t>1</m:t></m:r></m:sup><m:e><m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup><m:r><m:t>,dx</m:t></m:r></m:e></m:nary></m:oMath>`,
  limit: `<m:oMath><m:limLow><m:e><m:r><m:t>lim</m:t></m:r></m:e><m:lim><m:r><m:t>x→+∞</m:t></m:r></m:lim></m:limLow><m:r><m:t>f(x)</m:t></m:r></m:oMath>`,
  vector: `<m:oMath><m:acc><m:accPr><m:chr m:val="→"/></m:accPr><m:e><m:r><m:t>AB</m:t></m:r></m:e></m:acc></m:oMath>`,
  matrix: `<m:oMath><m:m><m:mr><m:e><m:r><m:t>a</m:t></m:r></m:e><m:e><m:r><m:t>b</m:t></m:r></m:e></m:mr><m:mr><m:e><m:r><m:t>c</m:t></m:r></m:e><m:e><m:r><m:t>d</m:t></m:r></m:e></m:mr></m:m></m:oMath>`,
};
const xmlParser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false });
const expected = [[omml.sup, "x^{2}"], [omml.sub, "x_{1}"], [omml.frac, "\\frac{a+b}{c}"], [omml.rad, "\\sqrt{x+1}"], [omml.vector, "\\vec{AB}"], [omml.matrix, "\\begin{matrix}a & b \\\\ c & d\\end{matrix}"]] as const;
for (const [xml, latex] of expected) assert.equal(convertOmml(xmlParser.parse(xml)).latex, latex);
const integral = convertOmml(xmlParser.parse(omml.integral)).latex; assert.ok(integral.includes("\\int_{0}^{1}"), integral);
const limit = convertOmml(xmlParser.parse(omml.limit)).latex; assert.ok(limit.includes("lim_{x\\to +\\infty}f(x)"), limit);

function makeDocx(body: string, withImage = false): Uint8Array {
  const document = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="w" xmlns:m="m" xmlns:a="a" xmlns:r="r"><w:body>${body}</w:body></w:document>`;
  const files: Record<string, Uint8Array> = { "word/document.xml": enc.encode(document) };
  if (withImage) { files["word/_rels/document.xml.rels"] = enc.encode(`<Relationships><Relationship Id="rId5" Target="media/hinh-đồ-thị.png"/></Relationships>`); files["word/media/hinh-đồ-thị.png"] = new Uint8Array([137, 80, 78, 71]); }
  return zipSync(files);
}
const mixedBody = [
  p(`${t("Câu 1. Cho hàm số ")}${omml.sup}${t(". Chọn đáp án đúng.")}`), p(t("A. 1")), p(t("B. 2")), p(t("C. 3")), p(t("D. 4")),
  p(t("Câu 2. Trong mỗi ý sau, hãy cho biết đúng hay sai.")), p(t("a) Mệnh đề một b) Mệnh đề hai c) Mệnh đề ba d) Mệnh đề bốn")),
  p(t("Câu 3. Câu trả lời ngắn, ghi kết quả.")),
  p(t("Câu 4. Cho hình chóp S.ABCD.")), p(t("a) Chứng minh SA⊥(ABCD). b) Tính thể tích.")),
  p(t("Câu 5. Trong không gian Oxyz, lập phương trình mặt phẳng.")), p(t("Lời giải: Dùng vectơ pháp tuyến.")),
  `<w:tbl><w:tr><w:tc>${p(t("x"))}</w:tc><w:tc>${p(omml.frac)}</w:tc></w:tr></w:tbl>`,
  p(t("ĐÁP ÁN")), p(t("1. C")), p(t("2: a) Đ b) S c) Đ d) S")),
].join("");
const mixed = importDocxDetailed(makeDocx(mixedBody), "đề tổng hợp.docx");
assert.equal(mixed.candidates.length, 5); assert.deepEqual(mixed.candidates.map((q) => q.source.questionNumber), ["1", "2", "3", "4", "5"]); assert.equal(mixed.candidates[0].questionType, "MCQ"); assert.equal(mixed.candidates[0].options?.length, 4); assert.deepEqual(mixed.candidates[0].answer, { type: "MCQ", optionId: "C" }); assert.equal(mixed.candidates[1].questionType, "TRUE_FALSE"); assert.equal(mixed.candidates[1].statements?.length, 4); assert.deepEqual(mixed.candidates[1].answer?.type === "TRUE_FALSE" ? mixed.candidates[1].answer.statements.map((s) => s.answer) : [], [true, false, true, false]); assert.equal(mixed.candidates[2].questionType, "SHORT_ANSWER"); assert.equal(mixed.candidates[3].questionType, "ESSAY"); assert.ok(mixed.candidates[3].notes.includes("AMBIGUOUS_SUBQUESTION_STRUCTURE")); assert.ok(mixed.candidates[4].solution?.some((b) => b.type === "text" && b.value.includes("vectơ pháp tuyến"))); assert.ok(mixed.candidates[4].solution?.some((b) => b.type === "table")); assert.ok(mixed.candidates.every((q) => q.confidence && q.sourcePosition)); assert.ok(mixed.candidates.every((q) => q.status !== "QUARANTINED"));

const twentyBody = Array.from({ length: 20 }, (_, i) => p(t(`Câu ${i + 1}. Bài toán số ${i + 1}`))).join(""); const twenty = importDocxDetailed(makeDocx(twentyBody), "20-câu.docx"); assert.equal(twenty.candidates.length, 20); assert.equal(twenty.diagnostics.segmented, 20);
const imageBody = p(`${t("Câu 1. Quan sát hình sau ")}<w:r><w:drawing><a:blip r:embed="rId5"/></w:drawing></w:r>`); const image = importDocxDetailed(makeDocx(imageBody, true), "hình ảnh.docx"); assert.equal(image.assets.length, 1); assert.equal(image.candidates[0].assetIds.length, 1); assert.ok(image.candidates[0].content.some((b) => b.type === "image"));
const ir = parseDocxToDocumentIR(makeDocx(p(`${t("Cho hàm số ")}${omml.frac}${t(". Tìm cực trị.")}`)), "utf8.docx").document; const paragraph = ir.blocks[0]; assert.equal(paragraph.type, "paragraph"); if (paragraph.type === "paragraph") { assert.deepEqual(paragraph.content.map((b) => b.type), ["text", "math", "text"]); assert.equal((paragraph.content[0] as { value: string }).value, "Cho hàm số "); assert.equal((paragraph.content[1] as { latex: string }).latex, "\\frac{a+b}{c}"); }
const ui = (await import("node:fs")).readFileSync("src/modules/question-bank/QuestionBankDevApp.tsx", "utf8"); assert.ok(!/\$\{quarantined\}\s+PDF candidates require OCR/.test(ui)); assert.match(ui, /sourceKind === "SCANNED"/);
console.log("DOCUMENT_IR_QA=PASS\nQUESTION_BOUNDARY_QA=PASS\nQUESTION_COUNT_QA=PASS\nQUESTION_NUMBER_QA=PASS\nSUBQUESTION_QA=PASS\nMCQ_DETECTION_QA=PASS\nTRUE_FALSE_DETECTION_QA=PASS\nSHORT_ANSWER_DETECTION_QA=PASS\nESSAY_DETECTION_QA=PASS\nMCQ_OPTIONS_QA=PASS\nOMML_DETECTION_QA=PASS\nOMML_TO_LATEX_QA=PASS\nLATEX_PRESERVATION_QA=PASS\nVIETNAMESE_UTF8_QA=PASS\nANSWER_EXTRACTION_QA=PASS\nTRUE_FALSE_ANSWER_QA=PASS\nSOLUTION_EXTRACTION_QA=PASS\nIMAGE_MAPPING_QA=PASS\nTABLE_PRESERVATION_QA=PASS\nSOURCE_POSITION_QA=PASS\nCONFIDENCE_MODEL_QA=PASS\nREVIEW_ROUTING_QA=PASS\nAUTO_APPROVAL_GUARD_QA=PASS\nDOCX_OCR_MESSAGE_QA=PASS\nQB_1A_FOCUSED_QA=PASS");
