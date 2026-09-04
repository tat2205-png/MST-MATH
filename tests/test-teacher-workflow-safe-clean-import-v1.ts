import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import { TeacherWorkflowService } from "../server/services/teacherWorkflowService.js";
import { createQuestionDocx } from "./question-bank-fixture.js";

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

function createNoisyQuestionDocx(): Uint8Array {
  const source = createQuestionDocx();
  const parts = unzipSync(source);

  const documentPart = parts["word/document.xml"];
  assert.ok(documentPart, "word/document.xml fixture is required");

  let xml = strFromU8(documentPart);

  const marker = "<w:t>Câu 1. Giá trị của </w:t>";

  assert.ok(
    xml.includes(marker),
    "Expected fixture text marker was not found.",
  );

  xml = xml.replace(
    marker,
    '<w:proofErr w:type="spellStart"/><w:t>Câu 1. Giá trị  của </w:t>',
  );

  parts["word/document.xml"] = strToU8(xml);

  return zipSync(parts, { level: 6 });
}

const original = createNoisyQuestionDocx();
const originalHash = sha256(original);
const immutableCopy = original.slice();

const repository = new MemoryQuestionBankRepository();
const service = new TeacherWorkflowService(repository);

const result = service.importDocx(
  Buffer.from(original).toString("base64"),
  "teacher-safe-clean-source.docx",
);

assert.equal(
  result.imported.length,
  4,
  "Expected the canonical four-question fixture to import.",
);

const cleanDiagnostic = result.diagnostics.find(
  (diagnostic) => diagnostic.code === "WORD_SAFE_CLEAN_APPLIED",
);

assert.ok(cleanDiagnostic, "WORD_SAFE_CLEAN_APPLIED diagnostic is required.");

const cleanDetails = cleanDiagnostic.details ?? {};

assert.equal(cleanDetails.sourceSha256, originalHash);
assert.equal(cleanDetails.protectedFingerprintMatch, true);
assert.equal(cleanDetails.sourceBytesMutated, false);
assert.equal(cleanDetails.safeCleanQa, "PASS");

assert.equal(
  typeof cleanDetails.outputSha256,
  "string",
  "Processing artifact SHA256 is required.",
);

assert.notEqual(
  cleanDetails.outputSha256,
  originalHash,
  "The noisy source must produce a distinct SAFE CLEAN artifact.",
);

const changes = cleanDetails.changes as
  | { total?: number; proofingMarkersRemoved?: number; plainTextWhitespaceRunsNormalized?: number }
  | undefined;

assert.ok(
  (changes?.total ?? 0) > 0,
  "SAFE CLEAN must report an actual normalization change.",
);

assert.ok(
  (changes?.proofingMarkersRemoved ?? 0) > 0,
  "Proofing noise must be removed.",
);

assert.ok(
  (changes?.plainTextWhitespaceRunsNormalized ?? 0) > 0,
  "Repeated plain-text whitespace must be normalized.",
);

const snapshot = repository.load();

assert.equal(snapshot.questions.length, 4);

for (const question of snapshot.questions) {
  assert.equal(
    question.source.document,
    "teacher-safe-clean-source.docx",
    "Original source filename must remain canonical.",
  );

  assert.equal(
    question.source.sourceHash,
    originalHash,
    "Original source SHA256 must remain canonical.",
  );

  assert.equal(
    question.source.processingSha256,
    cleanDetails.outputSha256,
    "Question provenance must retain processing-artifact SHA256.",
  );

  assert.ok(
    question.source.transformationHistory?.some((entry) =>
      entry.startsWith("PIMATH_WORD_SAFE_CLEAN:"),
    ),
    "SAFE CLEAN transformation history must be persisted.",
  );

  assert.ok(
    question.id.startsWith(originalHash.slice(0, 12)),
    "Question ID must be derived from immutable source identity.",
  );
}

assert.equal(
  sha256(original),
  originalHash,
  "Original in-memory source must remain immutable.",
);

assert.deepEqual(
  original,
  immutableCopy,
  "SAFE CLEAN orchestration must not mutate original source bytes.",
);

console.log("WORD_SAFE_CLEAN_BEFORE_QB_QA=PASS");
console.log("WORD_SOURCE_IDENTITY_PRESERVATION_QA=PASS");
console.log("WORD_PROCESSING_ARTIFACT_PROVENANCE_QA=PASS");
console.log("WORD_SOURCE_IMMUTABILITY_AFTER_IMPORT_QA=PASS");
console.log("MST_MATH_SAFE_CLEAN_IMPORT_V1=PASS");
