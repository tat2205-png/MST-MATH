import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { AssessmentService } from "../src/modules/question-bank/assessment.js";
import { JsonQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import { QuestionSearchService } from "../src/modules/question-bank/search.js";
import type {
  QuestionBankSnapshot,
  QuestionObject,
} from "../src/modules/question-bank/types.js";

function makeQuestion(index: number): QuestionObject {
  const type = index % 4 === 0 ? "ESSAY" : "MULTIPLE_CHOICE";
  const sourceDocument = `source-${Math.floor(index / 50)}.docx`;
  const stemText = `Câu benchmark ${index}: tìm giá trị x trong bài toán dữ liệu ${index}.`;

  return {
    schemaVersion: 1,
    id: `Q-${index.toString().padStart(8, "0")}`,
    source: {
      document: sourceDocument,
      sourceHash: `source-hash-${Math.floor(index / 50)}`,
      blockIds: [`block-${index}`],
      sourceLocations: [`word/document.xml#${index}`],
    },
    section: index % 2 === 0 ? "A" : "B",
    index: index + 1,
    type,
    stem: [{ type: "text", value: stemText }],
    options:
      type === "MULTIPLE_CHOICE"
        ? [
            { label: "A", content: [{ type: "text", value: "1" }] },
            { label: "B", content: [{ type: "text", value: "2" }] },
            { label: "C", content: [{ type: "text", value: "3" }] },
            { label: "D", content: [{ type: "text", value: "4" }] },
          ]
        : [],
    trueFalseItems: [],
    subquestions: [],
    figures: [],
    figureAssociations: [],
    metadata: {
      grade: index % 3 === 0 ? "12" : "11",
      topic: index % 2 === 0 ? "benchmark-even" : "benchmark-odd",
    },
    warnings: [],
    validationStatus: "VALID",
    bankStatus: "APPROVED",
    duplicateState: "UNIQUE",
    examQa: { status: "READY", issueCodes: [] },
  };
}

function makeSnapshot(size: number): QuestionBankSnapshot {
  return {
    schemaVersion: 1,
    questions: Array.from({ length: size }, (_, index) => makeQuestion(index)),
    orphanFigures: [],
    relations: {
      schemaVersion: 1,
      relations: [],
      families: [],
      duplicateAudit: [],
    },
  };
}

function timed<T>(operation: () => T): { value: T; ms: number } {
  const started = performance.now();
  const value = operation();
  return { value, ms: performance.now() - started };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

const requested = process.argv
  .slice(2)
  .map((value) => Number.parseInt(value, 10))
  .filter((value) => Number.isInteger(value) && value > 0);
const sizes = requested.length ? requested : [1_000, 10_000, 50_000];
const root = mkdtempSync(join(tmpdir(), "mst-math-data-benchmark-"));

try {
  const results = [];

  for (const size of sizes) {
    const path = join(root, `question-bank-${size}.json`);
    const repository = new JsonQuestionBankRepository(path);
    const snapshot = makeSnapshot(size);

    const write = timed(() => repository.replace(snapshot));

    const coldRepository = new JsonQuestionBankRepository(path);
    const coldLoad = timed(() => coldRepository.load());
    const hotLoad = timed(() => coldRepository.load());

    const search = new QuestionSearchService(coldRepository);
    const searchResult = timed(() =>
      search.query({
        text: "benchmark",
        statuses: ["APPROVED"],
        types: ["MULTIPLE_CHOICE"],
        metadata: { grade: "12" },
        sort: { field: "INDEX", direction: "ASC" },
        limit: 50,
      }),
    );

    const assessment = new AssessmentService(coldRepository);
    const assessmentResult = timed(() =>
      assessment.generate({
        seed: "benchmark-seed",
        sections: [
          {
            id: "mcq",
            questionType: "MULTIPLE_CHOICE",
            count: 20,
            filters: { metadata: { grade: "12" } },
            ordering: "SEEDED_SHUFFLE",
            sourcePolicy: "DISTINCT_SOURCE_PREFERRED",
          },
        ],
      }),
    );

    results.push({
      questions: size,
      snapshotBytes: statSync(path).size,
      writeMs: round(write.ms),
      coldLoadMs: round(coldLoad.ms),
      hotLoadMs: round(hotLoad.ms),
      searchMs: round(searchResult.ms),
      searchMatches: searchResult.value.total,
      assessmentMs: round(assessmentResult.ms),
      assessmentOk: assessmentResult.value.ok,
      rssMb: round(process.memoryUsage().rss / (1024 * 1024)),
      heapUsedMb: round(process.memoryUsage().heapUsed / (1024 * 1024)),
    });
  }

  console.table(results);
  console.log(JSON.stringify({ benchmark: "MST_MATH_QUESTION_BANK_DATA_ACCESS_V1", results }, null, 2));
} finally {
  rmSync(root, { recursive: true, force: true });
}
