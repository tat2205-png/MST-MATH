import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { unzipSync } from "fflate";
import { AssessmentService } from "../src/modules/question-bank/assessment.ts";
import { QuestionBankExportService } from "../src/modules/question-bank/export.ts";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.ts";
import type { QuestionObject } from "../src/modules/question-bank/types.ts";

const malformedCases = "\\left\\{\\begin{matrix}x-1\\le0 \\ y+1\\ge0\\end{matrix}\\right";
const question: QuestionObject = {
  schemaVersion: 1,
  id: "real-omml-dangling-right-q64",
  source: { document: "Full-Toán thực tế 10.docx", sourceHash: "7f26811b8588672cbb9029af3d43b7752ba36c149ec2e9e4caf9c01153c0c23d", blockIds: ["block-577"], sourceLocations: ["word/document.xml:p:577"] },
  type: "MULTIPLE_CHOICE",
  stem: [{ type: "text", value: "Tìm miền nghiệm " }, { type: "math", math: { sourceType: "OMML", sourceRaw: "<m:oMath><m:d><m:dPr><m:begChr m:val=\"{\"/></m:dPr><m:e><m:eqArr><m:e><m:r><m:t>x-1≤0</m:t></m:r></m:e><m:e><m:r><m:t>y+1≥0</m:t></m:r></m:e></m:eqArr></m:e></m:d></m:oMath>", latex: malformedCases, normalized: malformedCases, parseStatus: "PARSED", warnings: [], sourceLocation: "word/document.xml:p:577:math:1" } }],
  options: [{ label: "A", content: [{ type: "text", value: "Đáp án A" }] }], trueFalseItems: [], subquestions: [], figures: [], figureAssociations: [], metadata: {}, warnings: [], validationStatus: "VALID", bankStatus: "APPROVED", duplicateState: "UNIQUE", examQa: { status: "READY", issueCodes: [] },
};
const repository = new MemoryQuestionBankRepository();
const snapshot = repository.load();
snapshot.questions.push(question);
repository.replace(snapshot);
const assessment = new AssessmentService(repository).generate({ seed: "malformed-math", globalFilters: { ids: [question.id] }, sections: [{ id: "mcq", questionType: "MULTIPLE_CHOICE", count: 1, ordering: "FIXED" }] });
assert.equal(assessment.ok, true);
if (!assessment.ok) throw new Error("ASSESSMENT_GENERATION_FAILED");
const output = mkdtempSync(join(tmpdir(), "malformed-math-export-"));
try {
  const result = new QuestionBankExportService().deliver(assessment.assessment, assessment.answerManifest, repository, { audience: "STUDENT", formats: ["LATEX", "PDF", "DOCX"], outputDirectory: output, outputProfile: "NA_MATH_STANDARD", assetMode: "REFERENCE", filename: "malformed-matrix" });
  if ("diagnostics" in result) throw new Error(result.diagnostics.map((item) => item.message).join("; "));
  const pdf = result.artifacts.find((artifact) => artifact.format === "PDF")!;
  const latex = result.artifacts.find((artifact) => artifact.format === "LATEX")!;
  const docx = result.artifacts.find((artifact) => artifact.format === "DOCX")!;
  assert.ok(existsSync(pdf.path) && readFileSync(pdf.path).subarray(0, 4).equals(Buffer.from("%PDF")));
  assert.match(readFileSync(latex.path, "utf8"), /\\right\.\\\)/);
  assert.match(execFileSync("pdftotext", ["-enc", "UTF-8", pdf.path, "-"], { encoding: "utf8" }), /Tìm miền nghiệm/);
  const documentXml = new TextDecoder().decode(unzipSync(readFileSync(docx.path))["word/document.xml"]);
  assert.match(documentXml, /<m:d>/);
  assert.doesNotMatch(documentXml, /\\left/);
  console.log(`PDF_ARTIFACT=${pdf.path}`);
  console.log(`DOCX_ARTIFACT=${docx.path}`);
} finally {
  rmSync(output, { recursive: true, force: true });
}

console.log("MALFORMED_OMML_EXPORT_REGRESSION_QA=PASS");