import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groupTeacherDiagnostics, qaBlocksExport } from "../src/services/teacherWorkflowTypes.js";

const workspace = readFileSync("src/components/teacher/TeacherWorkspace.tsx", "utf8");
assert.deepEqual(["Nguồn", "Xử lý", "Thiết kế", "QA", "Xuất"], ["Nguồn", "Xử lý", "Thiết kế", "QA", "Xuất"]);
assert.ok(!workspace.match(/areas[\s\S]{0,500}Question Bank/), "Question Bank must not be top-level navigation");
assert.match(workspace, /Mở ngân hàng câu hỏi/);
assert.match(workspace, /Chọn tệp DOCX/);
assert.match(workspace, /className="sr-only"/);
assert.doesNotMatch(workspace, /Hỗ trợ văn bản thuần.*PDF/);

const grouped = groupTeacherDiagnostics([
  { code: "UNRESOLVED_FIGURE", severity: "WARNING", questionId: "q1" },
  { code: "UNRESOLVED_FIGURE", severity: "WARNING", questionId: "q2" },
]);
assert.equal(grouped[0].count, 2);
assert.match(grouped[0].message, /Chưa xác định được hình/);
assert.equal(grouped[0].code, "UNRESOLVED_FIGURE");
assert.equal(qaBlocksExport("REVIEW_REQUIRED"), true);
assert.equal(qaBlocksExport("FAIL"), true);
assert.equal(qaBlocksExport("PASS"), false);
console.log("MST_MATH_B4R_HUMAN_ACCEPTANCE_QA=PASS");
