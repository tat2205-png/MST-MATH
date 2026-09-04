import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  strFromU8,
  strToU8,
  unzipSync,
  zipSync,
} from "fflate";

import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import { TeacherWorkflowService } from "../server/services/teacherWorkflowService.js";
import { createQuestionDocx } from "./question-bank-fixture.js";

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

function createNoisyRepeatedNumberDocx(): Uint8Array {
  const parts = unzipSync(createQuestionDocx());

  const documentPart = parts["word/document.xml"];

  assert.ok(
    documentPart,
    "word/document.xml is required by the integration fixture.",
  );

  let xml = strFromU8(documentPart);

  const required = [
    "<w:t>Câu 1. Giá trị của </w:t>",
    "Câu 2:",
    "Câu 3.",
    "Bài 4)",
  ];

  for (const marker of required) {
    assert.ok(
      xml.includes(marker),
      `Expected fixture marker missing: ${marker}`,
    );
  }

  // Force all four questions to reuse question number 1.
  xml = xml
    .replace("Câu 2:", "Câu 1:")
    .replace("Câu 3.", "Câu 1.")
    .replace("Bài 4)", "Bài 1)");

  // Add real Word noise that SAFE CLEAN must remove/normalize.
  xml = xml.replace(
    "<w:t>Câu 1. Giá trị của </w:t>",
    '<w:proofErr w:type="spellStart"/>' +
      "<w:t>Câu 1. Giá trị  của </w:t>",
  );

  parts["word/document.xml"] = strToU8(xml);

  return zipSync(parts, { level: 6 });
}

const original = createNoisyRepeatedNumberDocx();
const originalSha256 = sha256(original);

const repository = new MemoryQuestionBankRepository();
const service = new TeacherWorkflowService(repository);

const result = await service.importDocxForRuntime(
  Buffer.from(original).toString("base64"),
  "safe-clean-segmentation-integration.docx",
);

assert.equal(
  result.imported.length,
  4,
  "All four structurally distinct questions must reach review.",
);

const safeClean = result.diagnostics.find(
  (diagnostic) => diagnostic.code === "WORD_SAFE_CLEAN_APPLIED",
);

assert.ok(
  safeClean,
  "Runtime import must report WORD_SAFE_CLEAN_APPLIED.",
);

assert.equal(
  safeClean.details?.sourceSha256,
  originalSha256,
);

assert.equal(
  safeClean.details?.safeCleanQa,
  "PASS",
);

const snapshot = repository.load();

assert.equal(
  snapshot.questions.length,
  4,
);

const ids = snapshot.questions.map((question) => question.id);

assert.equal(
  new Set(ids).size,
  ids.length,
  "Repeated question numbers must never produce duplicate Question IDs.",
);

for (const question of snapshot.questions) {
  assert.equal(
    question.source.document,
    "safe-clean-segmentation-integration.docx",
  );

  assert.equal(
    question.source.sourceHash,
    originalSha256,
    "Canonical sourceHash must remain the immutable original DOCX hash.",
  );

  assert.equal(
    typeof question.source.processingSha256,
    "string",
    "Processing artifact identity must be persisted.",
  );

  assert.notEqual(
    question.source.processingSha256,
    originalSha256,
    "SAFE CLEAN processing artifact must remain distinct from source identity.",
  );

  assert.ok(
    question.source.transformationHistory?.some((entry) =>
      entry.startsWith("PIMATH_WORD_SAFE_CLEAN:"),
    ),
    "SAFE CLEAN transformation provenance must survive Question Bank import.",
  );

  assert.ok(
    question.id.startsWith(originalSha256.slice(0, 12)),
    "Question ID must derive from immutable original source identity.",
  );
}

console.log("SAFE_CLEAN_RUNTIME_BEFORE_SEGMENTATION_QA=PASS");
console.log("REPEATED_QUESTION_ID_INTEGRATION_QA=PASS");
console.log("ORIGINAL_SOURCE_HASH_CANONICAL_QA=PASS");
console.log("PROCESSING_ARTIFACT_HASH_TRACEABILITY_QA=PASS");
console.log("MST_MATH_SAFE_CLEAN_SEGMENTATION_INTEGRATION_V1=PASS");
