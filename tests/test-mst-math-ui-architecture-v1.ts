import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.join(process.cwd(), "src/components/teacher/TeacherWorkspace.tsx"), "utf8");
const app = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
const stages = ["Nguồn", "Xử lý", "Thiết kế", "QA", "Xuất"];

if (!workspace.includes('CANONICAL_TEACHER_STAGES = ["Nguồn", "Xử lý", "Thiết kế", "QA", "Xuất"]')) throw new Error("Canonical stage order missing");
if (!workspace.includes("MST-MATH Studio") || !app.includes("<TeacherWorkspace")) throw new Error("Teacher Workspace / MST-MATH identity missing");
if (!workspace.includes("FOLD là mode trong Geometry")) throw new Error("FOLD must remain a Geometry mode");
for (const profile of ["THPTQG", "DGNL", "SAT", "V-SAT"]) if (!workspace.includes(profile)) throw new Error(`Missing output profile: ${profile}`);
if (workspace.includes("JsonQuestionBankRepository") || workspace.includes("QuestionBankService")) throw new Error("UI must not contain Question Bank business logic");
if (workspace.includes("MathProblemIR") || workspace.includes("DocumentEngine")) throw new Error("UI must not contain math/document engine logic");
if (stages.join(" → ") !== "Nguồn → Xử lý → Thiết kế → QA → Xuất") throw new Error("Stage contract changed");

console.log("MST_MATH_UI_ARCHITECTURE_QA=PASS");
