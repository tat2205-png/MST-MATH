import assert from "node:assert/strict";
import { readCfb } from "../src/modules/document-engine/docx/cfb.js";
assert.throws(() => readCfb(new Uint8Array(512)), /INVALID_CFB_SIGNATURE/);
console.log("CFB_FOUNDATION_QA=PASS");
