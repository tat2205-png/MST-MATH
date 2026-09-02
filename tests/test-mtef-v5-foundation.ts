import assert from "node:assert/strict";
import fs from "node:fs";
import { unwrapAndScanEquationNative } from "../src/modules/document-engine/docx/mtef-v5.js";
const bytes=fs.readFileSync("/tmp/pimath-ole/one/word/embeddings/oleObject1.bin");
const result=unwrapAndScanEquationNative(bytes); assert.equal(result.profile.version,5); assert(result.payload.length>0); assert(result.scan.records.length>0);
console.log("MTEF_V5_FOUNDATION_QA=PASS");
