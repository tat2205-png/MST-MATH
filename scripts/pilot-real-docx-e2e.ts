import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { JsonQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import type { QuestionType } from "../src/modules/question-bank/types.js";
import { TeacherWorkflowService } from "../server/services/teacherWorkflowService.js";

const root = process.cwd();
const sourcePath = path.resolve(process.argv[2] ?? process.env.MST_MATH_PILOT_DOCX ?? "");
const expectedSourceHash = process.env.MST_MATH_PILOT_SOURCE_SHA256?.trim().toLowerCase();
const expectedBranch = process.env.PILOT_EXPECTED_BRANCH ?? "pilot/mst-math-internal-demo-v1";
const evidenceRoot = path.join(root, "render_output", "pilot-evidence");
const runId = `golden-a-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const runDir = path.join(evidenceRoot, runId);
fs.mkdirSync(runDir, { recursive: true });

function git(args: string[]): string {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", shell: false });
  return result.status === 0 ? (result.stdout ?? "").trim() : "UNKNOWN";
}

function sha256(bytes: Uint8Array | Buffer | string): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

const report: Record<string, unknown> = {
  schemaVersion: 1,
  pilotId: "MST-MATH-INTERNAL-DEMO-V1",
  goldenCase: "GOLDEN_A_TEACHER_DOCUMENT",
  runId,
  branch: git(["branch", "--show-current"]),
  pilotSha: git(["rev-parse", "HEAD"]),
  startedAt: new Date().toISOString(),
  result: "BLOCK",
};

function persist(): void {
  fs.writeFileSync(path.join(runDir, "GOLDEN_A_RESULT.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(evidenceRoot, "golden-a-latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function fail(code: string, details?: unknown): never {
  report.result = "BLOCK";
  report.blocker = code;
  if (details !== undefined) report.details = details;
  report.finishedAt = new Date().toISOString();
  persist();
  console.error(`PILOT_GOLDEN_A=BLOCK | ${code}`);
  console.error(`Evidence: ${runDir}`);
  process.exit(1);
}

if (!process.argv[2] && !process.env.MST_MATH_PILOT_DOCX) fail("SOURCE_PATH_REQUIRED");
if (report.branch !== expectedBranch) fail("WRONG_BRANCH", { expected: expectedBranch, actual: report.branch });
if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) fail("SOURCE_NOT_FOUND", { sourcePath });
if (path.extname(sourcePath).toLowerCase() !== ".docx") fail("SOURCE_NOT_DOCX", { sourcePath });

const sourceBytes = fs.readFileSync(sourcePath);
const sourceHash = sha256(sourceBytes);
const sourceName = path.basename(sourcePath);
report.source = { name: sourceName, path: sourcePath, bytes: sourceBytes.length, sha256: sourceHash };
if (expectedSourceHash && expectedSourceHash !== sourceHash) fail("SOURCE_HASH_MISMATCH", { expected: expectedSourceHash, actual: sourceHash });

const repository = new JsonQuestionBankRepository(path.join(runDir, "question-bank.json"));
const workflow = new TeacherWorkflowService(repository);

let imported;
try {
  imported = await workflow.importDocxForRuntime(sourceBytes.toString("base64"), sourceName);
} catch (error) {
  fail("IMPORT_RUNTIME_FAILED", { message: error instanceof Error ? error.message : String(error) });
}

report.import = {
  importedCount: imported.imported.length,
  diagnostics: imported.diagnostics,
  summary: imported.summary,
};
if (!imported.imported.length) fail("NO_QUESTIONS_IMPORTED", imported.diagnostics);

const approvable = imported.imported.filter((question) =>
  question.bankStatus === "REVIEW" &&
  question.validationStatus !== "INVALID" &&
  question.examQa?.status !== "BLOCKED" &&
  question.examQa?.status !== "NOT_TESTED"
);

if (approvable.length) {
  try {
    workflow.approve(approvable.map((question) => question.id));
  } catch (error) {
    fail("APPROVAL_FAILED", { message: error instanceof Error ? error.message : String(error) });
  }
}

const approved = workflow.query({
  sourceDocuments: [sourceName],
  statuses: ["APPROVED"],
  duplicateStates: ["UNIQUE"],
  sort: { field: "ID", direction: "ASC" },
  limit: 100,
});
report.approval = {
  approvableIds: approvable.map((question) => question.id),
  approvedCount: approved.total,
  approvedIds: approved.items.map((question) => question.id),
  warnings: approved.warnings,
};
if (!approved.items.length) fail("NO_APPROVED_UNIQUE_QUESTIONS", report.approval);

const selected = approved.items.slice(0, 5);
for (const question of selected) {
  if (question.source.document !== sourceName || question.source.sourceHash !== sourceHash) {
    fail("SOURCE_PROVENANCE_MISMATCH", {
      questionId: question.id,
      expectedDocument: sourceName,
      expectedHash: sourceHash,
      actual: question.source,
    });
  }
}

const sections = selected.map((question, index) => ({
  id: `pilot-${index + 1}`,
  title: `Pilot ${index + 1}`,
  questionType: question.type as QuestionType,
  count: 1,
  filters: { ids: [question.id] },
  ordering: "FIXED" as const,
  sourcePolicy: "ANY_SOURCE" as const,
}));

const assessmentResult = workflow.generateAssessment({
  id: `pilot-golden-a-${sourceHash.slice(0, 12)}`,
  title: "MST-MATH Internal Demo — Golden A",
  seed: sourceHash.slice(0, 16),
  sections,
  statuses: ["APPROVED"],
  metadata: { pilot: "MST-MATH-INTERNAL-DEMO-V1", sourceSha256: sourceHash },
});

if (!("assessment" in assessmentResult)) fail("ASSESSMENT_GENERATION_FAILED", assessmentResult);
report.assessment = {
  id: assessmentResult.assessment.id,
  questionIds: assessmentResult.questionIds,
  queryPlan: assessmentResult.queryPlan,
};

let studentExport;
let teacherExport;
try {
  studentExport = workflow.exportAssessment({
    assessmentId: assessmentResult.assessment.id,
    audience: "STUDENT",
    formats: ["JSON", "DOCX", "PDF"],
    filename: `pilot-golden-a-${sourceHash.slice(0, 12)}-student`,
  });
  teacherExport = workflow.exportAssessment({
    assessmentId: assessmentResult.assessment.id,
    audience: "TEACHER",
    formats: ["JSON"],
    includeAnswers: true,
    includeSolutions: true,
    filename: `pilot-golden-a-${sourceHash.slice(0, 12)}-teacher`,
  });
} catch (error) {
  fail("EXPORT_FAILED", { message: error instanceof Error ? error.message : String(error) });
}

const artifacts = [...studentExport.artifacts, ...teacherExport.artifacts];
for (const artifact of artifacts) {
  if (!fs.existsSync(artifact.path)) fail("ARTIFACT_MISSING", artifact);
  const bytes = fs.readFileSync(artifact.path);
  const actualHash = sha256(bytes);
  if (actualHash !== artifact.sha256) fail("ARTIFACT_HASH_MISMATCH", { artifact, actualHash });
  if (artifact.format === "PDF" && !bytes.subarray(0, 5).toString("ascii").startsWith("%PDF")) fail("PDF_SIGNATURE_INVALID", artifact);
  if (artifact.format === "DOCX" && bytes.subarray(0, 2).toString("ascii") !== "PK") fail("DOCX_SIGNATURE_INVALID", artifact);
}

const teacherJsonArtifact = teacherExport.artifacts.find((artifact) => artifact.format === "JSON");
if (!teacherJsonArtifact) fail("TEACHER_JSON_MISSING");
const teacherPackage = JSON.parse(fs.readFileSync(teacherJsonArtifact.path, "utf8"));
for (const questionId of assessmentResult.questionIds) {
  const provenance = teacherPackage?.provenance?.questionSources?.[questionId];
  if (!provenance || provenance.document !== sourceName || provenance.sourceHash !== sourceHash) {
    fail("EXPORTED_PROVENANCE_MISMATCH", { questionId, provenance });
  }
}

report.exports = {
  student: studentExport,
  teacher: teacherExport,
};
report.result = "PASS";
report.finishedAt = new Date().toISOString();
persist();
console.log(`SOURCE_NAME=${sourceName}`);
console.log(`SOURCE_SHA256=${sourceHash}`);
console.log(`IMPORTED=${imported.imported.length}`);
console.log(`APPROVED=${approved.total}`);
console.log(`ASSESSMENT_QUESTIONS=${assessmentResult.questionIds.length}`);
for (const artifact of artifacts) console.log(`${artifact.format}=${artifact.path} SHA256=${artifact.sha256}`);
console.log("SOURCE_PROVENANCE_QA=PASS");
console.log("PDF_SIGNATURE_QA=PASS");
console.log("DOCX_SIGNATURE_QA=PASS");
console.log("PILOT_GOLDEN_A=PASS");
console.log(`Evidence: ${runDir}`);
