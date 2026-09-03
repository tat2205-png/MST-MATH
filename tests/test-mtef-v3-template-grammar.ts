import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { unzipSync } from "fflate";
import { readCfb } from "../src/modules/document-engine/docx/cfb.js";
import { bridgeMtefV3ToMathExpression } from "../src/modules/document-engine/docx/mtef-mathml.js";
import { scanMtefV3Records } from "../src/modules/document-engine/docx/mtef-v3-fixed.js";

const root = process.env.PIMATH_WORD_REAL_CORPUS ?? "/Users/mac/PiMath-Acceptance/word-real";
const requiredFiles = ["2. MIN MAX HHKG.docx", "BÀI 2. GTLN-GTNN.docx"];
const availableFiles = readdirSync(root).filter((file) => file.endsWith(".docx") && !file.startsWith("~$"));
const availableByNfc = new Map(availableFiles.map((file) => [file.normalize("NFC"), file]));

let objects = 0;
for (const requiredFile of requiredFiles) {
  const file = availableByNfc.get(requiredFile.normalize("NFC"));
  assert.ok(file, `MISSING_REAL_CORPUS_FILE:${requiredFile}`);
  const files = unzipSync(readFileSync(`${root}/${file}`));
  for (const [name, bytes] of Object.entries(files)) {
    if (!name.startsWith("word/embeddings/")) continue;
    const native = readCfb(bytes).find((stream) => stream.name.toLowerCase() === "equation native");
    if (!native) continue;
    const payload = native.bytes.subarray(28);
    if (payload[0] !== 3) continue;
    const scan = scanMtefV3Records(payload);
    assert.equal(scan.version, 3);
    assert.equal(scan.errors.length, 0);
    const bridged = bridgeMtefV3ToMathExpression(payload, { sourceDocumentId: file, sourceObjectId: name });
    assert.equal(bridged.validation, "PASS");
    assert.match(bridged.mathMl, /^<math /);
    objects++;
  }
}
assert.equal(objects, 22);
console.log("MTEF_V3_TEMPLATE_GRAMMAR_QA=PASS");
