import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const wrapper = readFileSync("scripts/run-pimath-unified-input-certification-readonly.mjs", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };

assert.equal(
  pkg.scripts["qa:unified-input:certify"],
  "node --import tsx tests/test-pimath-unified-input-certification-v1.ts",
  "Existing certification contract must remain stable.",
);
assert.equal(
  pkg.scripts["qa:unified-input:certify:readonly"],
  "node --import tsx scripts/run-pimath-unified-input-certification-readonly.mjs",
);
assert.match(wrapper, /syncBuiltinESMExports/);
assert.match(wrapper, /CERTIFICATION_RESULT_WRITE_INTERCEPTED=YES/);
assert.match(wrapper, /CERTIFICATION_PERSISTENT_MUTATION=NO/);
assert.match(wrapper, /CERTIFICATION_SNAPSHOT_SEMANTIC_MATCH=PASS/);
assert.match(wrapper, /diskHashAfter !== canonicalHash/);
assert.match(wrapper, /candidate === RESULT_PATH/);
assert.doesNotMatch(wrapper, /git\s+restore|git\s+checkout|execFileSync\([^)]*git/i);
assert.doesNotMatch(wrapper, /writeFileSync\(RESULT_PATH/);

console.log("CERTIFICATION_READONLY_ENTRYPOINT_QA=PASS");
console.log("CERTIFICATION_CANONICAL_SCRIPT_COMPATIBILITY_QA=PASS");
console.log("CERTIFICATION_NO_GIT_RESTORE_WORKAROUND_QA=PASS");
console.log("PIMATH_INPUT_CERTIFICATION_READONLY_V1=PASS");
