import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { QuestionBankService } from "../src/modules/question-bank/bankService.ts";
import { ingestDocxQuestions } from "../src/modules/question-bank/pipeline.ts";
import { JsonQuestionBankRepository, MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.ts";
import type { QuestionBankRepository, QuestionBankSnapshot } from "../src/modules/question-bank/types.ts";
import { createQuestionDocx } from "./question-bank-fixture.ts";

const bytes = createQuestionDocx();
const source = ingestDocxQuestions(bytes, "đề toán.docx");
const directory = mkdtempSync(join(tmpdir(), "math-ai-qb1e-"));
try {
  const path = join(directory, "bank.json");
  const service = new QuestionBankService(new JsonQuestionBankRepository(path));
  const first = service.importDocx(bytes, "đề toán.docx");
  const second = service.importDocx(bytes, "bản-sao.pdf");
  const reloaded = new JsonQuestionBankRepository(path).load();
  assert.equal(first.imported.length, 4);
  assert.equal(second.imported.length, 4);
  assert.equal(reloaded.questions.length, 8);
  assert.equal(new Set(reloaded.questions.map((q) => q.id)).size, 8);
  assert.deepEqual(reloaded.questions.map((q) => q.index), [1, 2, 3, 4, 1, 2, 3, 4]);
  assert.deepEqual(reloaded.questions.slice(0, 4).map((q) => q.type), source.questions.map((q) => q.type));
  assert.ok(reloaded.questions.slice(4).every((q) => q.duplicateState === "DUPLICATE" && q.source.document === "bản-sao.pdf" && q.source.sourceHash));
  assert.equal(second.duplicates.filter((x) => x.status === "DUPLICATE").length, 4);
  assert.equal(reloaded.relations?.relations.filter((r) => r.relations.includes("EXACT_DUPLICATE")).length, 4);
  assert.equal(reloaded.relations?.duplicateAudit.length, 4);
  assert.equal(reloaded.orphanFigures.length, 1);
  assert.match(JSON.stringify(reloaded.questions), /Giá trị của/);
  assert.match(JSON.stringify(reloaded.questions), /Hàm số xác định trên ℝ/);
  class FailingRepository implements QuestionBankRepository { constructor(private readonly delegate: MemoryQuestionBankRepository) {} load() { return this.delegate.load(); } replace(_snapshot: QuestionBankSnapshot): void { throw new Error("TEST_ASSET_PERSISTENCE_FAILURE"); } }
  const delegate = new MemoryQuestionBankRepository();
  const before = delegate.load();
  assert.throws(() => new QuestionBankService(new FailingRepository(delegate)).importDocx(bytes, "đề toán.docx"), /TEST_ASSET_PERSISTENCE_FAILURE/);
  assert.deepEqual(delegate.load(), before);
  console.log("IMPORT_TO_BANK_E2E_QA=PASS\nIMPORT_IDEMPOTENCY_QA=PASS\nRELOAD_FIDELITY_QA=PASS\nSOURCE_TO_BANK_FIDELITY_QA=PASS\nDUPLICATE_PROPOSAL_QA=PASS\nQB_1E_STATUS=PASS");
} finally { rmSync(directory, { recursive: true, force: true }); }
