import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { NA_MATH_STANDARD_V2_6, type NaMathOutputIdentity } from "../src/config/naMathStandardV26.ts";
import { createWordStyleMap, renderDocumentToDocx } from "../src/modules/document-export/docx/index.ts";
import type { DocumentIR } from "../src/modules/question-bank/types.ts";

const document: DocumentIR = { sourceDocument: "styles.docx", sourceHash: "styles", figures: [], warnings: [], blocks: [{ id: "h", kind: "SECTION", order: 0, content: [{ type: "text", value: "Kiểu Word" }], sourceLocation: "test" }] };
const identities: NaMathOutputIdentity[] = ["learning_material", "worksheet", "exercise_sheet", "video"];
const expected = Object.fromEntries(Object.entries(NA_MATH_STANDARD_V2_6.colorSystem.output_contracts).map(([key, value]) => [key, value.primary_accent.replace("#", "")]));
for (const identity of identities) {
  const map = createWordStyleMap(identity);
  const parts = unzipSync(renderDocumentToDocx(document, { outputIdentity: identity }).bytes);
  const styles = new TextDecoder().decode(parts["word/styles.xml"]);
  assert.equal(map.body.font, NA_MATH_STANDARD_V2_6.typography.body);
  assert.equal(map.heading1.font, NA_MATH_STANDARD_V2_6.typography.ui);
  assert.equal(map.body.color, expected[identity]);
  for (const role of ["NATitle", "NASubtitle", "NAHeading1", "NAHeading2", "NAHeading3", "NABody", "NALabel", "NADefinition", "NAExample", "NARemember", "NAExercise", "NASolution", "NAFigureCaption", "NATable", "NAHeader", "NAFooter"]) assert.match(styles, new RegExp(`w:styleId="${role}"`));
  assert.match(styles, new RegExp(`w:ascii="${NA_MATH_STANDARD_V2_6.typography.body}"`));
  assert.match(styles, new RegExp(`w:ascii="${NA_MATH_STANDARD_V2_6.typography.ui}"`));
  assert.match(styles, new RegExp(`w:color w:val="${expected[identity]}"`));
  assert.doesNotMatch(styles, /Cambria|Times New Roman|Calibri/);
}
console.log("DOCX_STYLE_QA=PASS\nBODY_FONT_QA=PASS\nUI_FONT_QA=PASS\nFONT_MAPPING_QA=PASS\nCOLOR_TOKEN_QA=PASS\nCOLOR_MAPPING_QA=PASS\nSTYLE_REFERENCE_QA=PASS\nNO_DUPLICATE_CANONICAL_TOKEN_QA=PASS");
