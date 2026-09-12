import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { bridgeMtefV5ToMathExpression, mtefRecordsToMathMl, serializeMathMl } from "../src/modules/document-engine/docx/mtef-mathml.js";
import { scanMtefV5Records } from "../src/modules/document-engine/docx/mtef-v5.js";
let passed=0;
for(let i=1;i<=8;i++){const payload=readFileSync(`tests/fixtures/mathtype-mtef-v5/G0${i}.bin`);const scan=scanMtefV5Records(payload,`G0${i}`);assert.equal(scan.errors.length,0);const node=mtefRecordsToMathMl(payload,scan.records);const a=serializeMathMl(node),b=serializeMathMl(node);assert.equal(a,b);const bridged=bridgeMtefV5ToMathExpression(payload,{sourceObjectId:`G0${i}`});assert.equal(bridged.validation,"PASS");assert(bridged.expression.metadata?.adapterMetadata);passed++;}
assert.equal(passed,8);console.log(`MTEF_MATHML_VERTICAL_SLICE_QA=PASS:${passed}/8`);
