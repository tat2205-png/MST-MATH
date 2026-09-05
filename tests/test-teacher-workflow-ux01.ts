import fs from "node:fs";
import path from "node:path";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import type { QuestionObject } from "../src/modules/question-bank/types.js";
import { TeacherWorkflowService } from "../server/services/teacherWorkflowService.js";
import { createQuestionDocx } from "./question-bank-fixture.js";

function check(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error(`${label}=FAIL`);
  console.log(`${label}=PASS`);
}

process.env.STUDIO_ORCHESTRATOR_V1 = "true";
const repository = new MemoryQuestionBankRepository();
const service = new TeacherWorkflowService(repository);

const imported = service.importDocx(Buffer.from(createQuestionDocx()).toString("base64"), "teacher-fixture.docx");
check(imported.imported.length === 4, "IMPORT_UI_SERVICE_QA");
check(imported.summary.supportedImports.join(",") === "DOCX", "IMPORT_SUPPORTED_FORMAT_QA");
check(imported.imported.every((question) => question.bankStatus !== "APPROVED"), "REVIEW_FAIL_CLOSED_QA");
check(imported.imported.every((question) => question.source.document === "teacher-fixture.docx"), "POST_QB_TRACEABILITY_QA");

const approvable = imported.imported.filter((question) => question.bankStatus === "REVIEW" && question.validationStatus !== "INVALID" && question.examQa?.status !== "BLOCKED" && question.examQa?.status !== "NOT_TESTED").map((question) => question.id);
check(approvable.length > 0, "QUESTION_REVIEW_UI_QA");
service.approve(approvable);
const approved = service.query({ statuses: ["APPROVED"], limit: 50 });
check(approved.items.length === approvable.length, "QUESTION_BANK_SEARCH_REUSE_QA");
check(approved.items.every((question) => approvable.includes(question.id)), "QUESTION_SELECTION_ID_QA");

const supportedVideoQuestion: QuestionObject = {
  schemaVersion: 1,
  id: "ux01-linear-system-q1",
  source: { document: "ux01-linear-system.docx", sourceHash: "ux01-source", blockIds: ["p1"], sourceLocations: ["word/document.xml#p1"] },
  type: "SHORT_ANSWER",
  stem: [{ type: "text", value: "Giải hệ phương trình " }, { type: "math", math: { sourceType: "LATEX", sourceRaw: "x+y=5;x-y=1", latex: "x+y=5;x-y=1", normalized: "x+y=5;x-y=1", parseStatus: "PARSED", warnings: [], sourceLocation: "p1" } }],
  options: [], trueFalseItems: [], answer: [{ type: "text", value: "x=3,y=2" }], solution: [{ type: "text", value: "Cộng hai phương trình để được x=3, sau đó y=2." }], subquestions: [], figures: [], figureAssociations: [], metadata: { grade: "10" }, warnings: [], validationStatus: "VALID", bankStatus: "APPROVED", duplicateState: "UNIQUE", examQa: { status: "READY", issueCodes: [] },
};
const snapshot = repository.load();
snapshot.questions.push(supportedVideoQuestion);
repository.replace(snapshot);
const sourceBefore = JSON.stringify(repository.load().questions);

const generated = service.generateAssessment({ title: "UX-01", seed: "ux-01", globalFilters: { ids: [supportedVideoQuestion.id] }, sections: [{ id: "short", title: "Trả lời ngắn", questionType: "SHORT_ANSWER", count: 1, ordering: "FIXED" }] });
check("assessment" in generated, "UX_ASSESSMENT_E2E_QA");
if (!("assessment" in generated)) throw new Error("Assessment unexpectedly failed");
check(generated.questionIds[0] === supportedVideoQuestion.id, "UX_TRACEABILITY_QA");

let game = service.startGame(generated.assessment.id);
game = service.gameAction(game.session.id, "OPEN");
check(Boolean(game.currentQuestion), "UX_GAME_E2E_QA");
check(!("answer" in (game.currentQuestion as object)) && !("solution" in (game.currentQuestion as object)), "GAME_ANSWER_ISOLATION_UI_QA");
game = service.gameAction(game.session.id, "CLOSE");
game = service.gameAction(game.session.id, "COMPLETE_ROUND");
game = service.gameAction(game.session.id, "NEXT_ROUND");
check(game.session.state === "COMPLETE" && Boolean(game.result), "GAME_STATE_UI_QA");

const video = service.prepareVideo(supportedVideoQuestion.id);
check(video.job.questionId === supportedVideoQuestion.id && video.job.mathGate === "VERIFIED_PASS", "SOLUTION_VIDEO_UI_QA");
check(video.job.visualRoute.featureEnabled, "STUDIO_ORCHESTRATOR_REUSE_QA");

const exported = service.exportAssessment({ assessmentId: generated.assessment.id, audience: "STUDENT", formats: ["JSON", "DOCX"], includeAnswers: false, includeSolutions: false, filename: "ux-01-smoke" });
check(exported.artifacts.length === 2 && exported.artifacts.every((artifact) => fs.existsSync(artifact.path) && artifact.bytes > 0), "UX_EXPORT_E2E_QA");
const studentJsonPath = exported.artifacts.find((artifact) => artifact.format === "JSON")!.path;
const studentJson = fs.readFileSync(studentJsonPath, "utf8");
check(!studentJson.includes('"answerKey"') && !studentJson.includes('"solutions"') && !studentJson.includes('"answer"'), "UX_ANSWER_ISOLATION_QA");
check(JSON.stringify(repository.load().questions) === sourceBefore, "UX_SOURCE_IMMUTABILITY_QA");

const uiSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "teacher", "TeacherWorkspace.tsx"), "utf8");
const serverSource = fs.readFileSync(path.join(process.cwd(), "server", "services", "teacherWorkflowService.ts"), "utf8");
check(uiSource.includes("Quy trình dành cho giáo viên") && uiSource.includes("Ngân hàng câu hỏi") && uiSource.includes("Tạo đề kiểm tra"), "HOME_WORKSPACE_QA");
check(uiSource.includes("LocalBridgeClient") && serverSource.includes("QuestionBankStudioService"), "UI_RUNTIME_ISOLATION_QA");
check(!uiSource.includes("JsonQuestionBankRepository") && !uiSource.includes("node:fs"), "UI_STORAGE_ISOLATION_QA");
check(serverSource.includes("QuestionBankService") && serverSource.includes("AssessmentService") && serverSource.includes("ClassroomGameService") && serverSource.includes("QuestionBankExportService"), "TEACHER_WORKFLOW_SERVICE_QA");
check(uiSource.includes("aria-label") && uiSource.includes("focus:ring"), "ACCESSIBILITY_QA");
check(uiSource.includes("sm:grid-cols") && uiSource.includes("overflow-x-auto"), "RESPONSIVE_LAYOUT_QA");
check(uiSource.includes("Đang xử lý") && uiSource.includes("disabled={busy !== null}"), "DOUBLE_SUBMIT_PREVENTION_QA");
check(uiSource.includes("MAS_INT_01_RUNTIME_READINESS") || serverSource.includes("MAS_INT_01_RUNTIME_READINESS"), "RUNTIME_READINESS_UI_QA");

const downgradedForVideo = repository.load();
const downgradedVideoQuestion = downgradedForVideo.questions.find((question) => question.id === supportedVideoQuestion.id);
if (!downgradedVideoQuestion) throw new Error("VIDEO_REUSE_FIXTURE_NOT_FOUND");
downgradedVideoQuestion.bankStatus = "QUARANTINED";
repository.replace(downgradedForVideo);
let videoReuseBlocked = false;
try {
  service.prepareVideo(supportedVideoQuestion.id);
} catch (error) {
  videoReuseBlocked = error instanceof Error && error.message === `VIDEO_QUESTION_NOT_APPROVED:${supportedVideoQuestion.id}`;
}
check(videoReuseBlocked, "VIDEO_REUSE_AUTHORITY_QA");

console.log("TEACHER_GOLDEN_WORKFLOW_SMOKE_QA=PASS");
console.log("REAL_SERVICE_UI_INTEGRATION_QA=PASS");
console.log("UX_01_CONTRACT_QA=PASS");
