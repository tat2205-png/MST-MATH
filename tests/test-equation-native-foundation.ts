import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { equationNativeStream, findEquationNative } from "../src/modules/document-engine/docx/equation-native.js";
const bytes = readFileSync("/tmp/pimath-ole/one/word/embeddings/oleObject1.bin");
const profile = findEquationNative(bytes); assert(profile); assert.equal(profile.stream, "Equation Native"); assert.equal(profile.payloadOffset, 28); assert(equationNativeStream(bytes)?.bytes.length);
console.log("EQUATION_NATIVE_FOUNDATION_QA=PASS");
