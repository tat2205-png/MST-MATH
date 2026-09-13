import { ingestUnifiedSource } from "../../src/modules/document-ingest/unified.js";
import { normalizeDocument } from "../../src/modules/exam-normalization/index.js";
import { buildP01LessonIR, renderP01OutputBundle, writeP01OutputBundle } from "../../src/modules/learning-material/index.js";
import type { P01OutputBundle } from "../../src/modules/learning-material/types.js";
import { runProductionMathQA } from "./mathQaProductionAdapter.js";

export type DemoRc1P01Result = { status: "PASS" | "REVIEW_REQUIRED" | "FAIL"; sourceHash: string; diagnostics: unknown[]; qa?: P01OutputBundle["qa"]; mathQA?: ReturnType<typeof runProductionMathQA>; lesson?: P01OutputBundle["lesson"]; artifacts?: ReturnType<typeof writeP01OutputBundle> };

export function buildDemoRc1P01FromCanonical(document: Parameters<typeof buildP01LessonIR>[0], outputDirectory: string, diagnostics: unknown[] = []): DemoRc1P01Result {
  const normalized = normalizeDocument(document);
  const mathQA = runProductionMathQA({ raw: document, normalized });
  const lesson = buildP01LessonIR(document);
  if (normalized.review.length || mathQA.status !== "PASS") return { status: "REVIEW_REQUIRED", sourceHash: document.sourceHash, diagnostics: [...diagnostics, ...normalized.review, ...mathQA.gates.flatMap((gate) => gate.issues)], mathQA, lesson };
  const bundle = renderP01OutputBundle(lesson);
  const artifacts = writeP01OutputBundle(bundle, outputDirectory, "mst-math-demo-rc1-p01");
  return { status: "PASS", sourceHash: document.sourceHash, diagnostics, qa: bundle.qa, mathQA, lesson, artifacts };
}

export async function buildDemoRc1P01(fileName: string, bytes: Uint8Array, outputDirectory: string): Promise<DemoRc1P01Result> {
  const ingested = await ingestUnifiedSource({ name: fileName, bytes });
  if (!ingested.ok || !ingested.document) return { status: "FAIL", sourceHash: "", diagnostics: ingested.diagnostics };
  const result = buildDemoRc1P01FromCanonical(ingested.document, outputDirectory, ingested.diagnostics);
  return ingested.status === "PASS" ? result : { ...result, status: "REVIEW_REQUIRED" };
}
