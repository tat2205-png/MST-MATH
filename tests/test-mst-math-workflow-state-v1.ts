import assert from "node:assert/strict";
import { deriveTeacherWorkflowState } from "../src/services/teacherWorkflowTypes.js";

const base = { sourceReady: true, processing: false, designReady: true, exportReady: true };
assert.equal(deriveTeacherWorkflowState({ ...base, qa: "PASS" }), "EXPORT_READY");
assert.equal(deriveTeacherWorkflowState({ ...base, qa: "WARN" }), "QA_REQUIRED");
assert.equal(deriveTeacherWorkflowState({ ...base, qa: "REVIEW_REQUIRED" }), "QA_REQUIRED");
assert.equal(deriveTeacherWorkflowState({ ...base, qa: "FAIL" }), "ERROR");
assert.equal(deriveTeacherWorkflowState({ ...base, sourceReady: false }), "EMPTY");
assert.equal(deriveTeacherWorkflowState({ ...base, processing: true }), "PROCESSING");
assert.equal(deriveTeacherWorkflowState({ ...base, processingError: true }), "ERROR");
assert.equal(deriveTeacherWorkflowState({ ...base, designReady: false }), "PROCESS_READY");
console.log("MST_MATH_WORKFLOW_STATE_FAIL_CLOSED_QA=PASS");
