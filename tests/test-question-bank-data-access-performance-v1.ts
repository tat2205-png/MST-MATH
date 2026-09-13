import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AssessmentService } from "../src/modules/question-bank/assessment.ts";
import { QuestionBankService } from "../src/modules/question-bank/bankService.ts";
import {
  JsonQuestionBankRepository,
  MemoryQuestionBankRepository,
  serializeSnapshot,
} from "../src/modules/question-bank/repository.ts";
import type {
  QuestionBankRepository,
  QuestionBankSnapshot,
} from "../src/modules/question-bank/types.ts";
import { createQuestionDocx } from "./question-bank-fixture.ts";

const seedRepository = new MemoryQuestionBankRepository();
new QuestionBankService(seedRepository).importDocx(
  createQuestionDocx(),
  "data-access-performance.docx",
);
const seeded = seedRepository.load();
for (const question of seeded.questions) {
  question.bankStatus = "APPROVED";
  question.validationStatus = "VALID";
  question.duplicateState = "UNIQUE";
}
seedRepository.replace(seeded);

class CountingRepository implements QuestionBankRepository {
  loads = 0;
  private snapshot: QuestionBankSnapshot;

  constructor(snapshot: QuestionBankSnapshot) {
    this.snapshot = structuredClone(snapshot);
  }

  load(): QuestionBankSnapshot {
    this.loads += 1;
    return structuredClone(this.snapshot);
  }

  replace(snapshot: QuestionBankSnapshot): void {
    this.snapshot = structuredClone(snapshot);
  }
}

const counting = new CountingRepository(seedRepository.load());
const assessmentService = new AssessmentService(counting);
const result = assessmentService.generate({
  seed: "single-snapshot",
  sections: [
    {
      id: "mcq",
      questionType: "MULTIPLE_CHOICE",
      count: 1,
    },
    {
      id: "essay",
      questionType: "ESSAY",
      count: 1,
    },
  ],
});
assert.equal(result.ok, true);
assert.equal(
  counting.loads,
  1,
  "Assessment generation must use exactly one repository snapshot per request.",
);

if (result.ok) {
  counting.loads = 0;
  const materialized = assessmentService.materialize(result.assessment);
  assert.equal(materialized.length, 2);
  assert.equal(
    counting.loads,
    1,
    "Assessment materialization must load one snapshot and resolve refs in-memory.",
  );
}

const directory = mkdtempSync(join(tmpdir(), "mst-math-bank-cache-"));
try {
  const path = join(directory, "question-bank.json");
  const diskRepository = new JsonQuestionBankRepository(path);
  diskRepository.replace(seedRepository.load());
  const first = diskRepository.load();
  const second = diskRepository.load();
  assert.deepEqual(second, first);

  const externallyChanged = structuredClone(first);
  externallyChanged.questions = externallyChanged.questions.slice(0, 1);
  writeFileSync(path, serializeSnapshot(externallyChanged), "utf8");
  const refreshed = diskRepository.load();
  assert.equal(
    refreshed.questions.length,
    1,
    "Repository cache must invalidate when the backing file changes externally.",
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}

console.log(
  [
    "QUESTION_BANK_SINGLE_SNAPSHOT_ASSESSMENT_QA=PASS",
    "QUESTION_BANK_SINGLE_SNAPSHOT_MATERIALIZE_QA=PASS",
    "QUESTION_BANK_JSON_CACHE_INVALIDATION_QA=PASS",
    "QUESTION_BANK_DATA_ACCESS_PERFORMANCE_V1=PASS",
  ].join("\n"),
);
