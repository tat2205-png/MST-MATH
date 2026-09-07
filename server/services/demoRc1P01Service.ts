import { ingestUnifiedSource } from "../../src/modules/document-ingest/unified.js";
import { normalizeDocument } from "../../src/modules/exam-normalization/index.js";
import { buildP01LessonIR, renderP01OutputBundle, writeP01OutputBundle } from "../../src/modules/learning-material/index.js";
import type { P01OutputBundle } from "../../src/modules/learning-material/types.js";

export type DemoRc1P01Result = { status: "PASS" | "REVIEW_REQUIRED" | "FAIL"; sourceHash: string; diagnostics: unknown[]; qa?: P01OutputBundle["qa"]; lesson?: P01OutputBundle["lesson"]; artifacts?: ReturnType<typeof writeP01OutputBundle> };

export async function buildDemoRc1P01(fileName: string, bytes: Uint8Array, outputDirectory: string): Promise<DemoRc1P01Result> {
  const ingested = await ingestUnifiedSource({ name: fileName, bytes });
  if (!ingested.ok || !ingested.document) return { status: "FAIL", sourceHash: "", diagnostics: ingested.diagnostics };
  const normalized = normalizeDocument(ingested.document);
  const lesson = buildP01LessonIR(ingested.document);
  if (ingested.status !== "PASS" || normalized.review.length) return { status: "REVIEW_REQUIRED", sourceHash: ingested.document.sourceHash, diagnostics: [...ingested.diagnostics, ...normalized.review], lesson };
  const bundle = renderP01OutputBundle(lesson);
  const artifacts = writeP01OutputBundle(bundle, outputDirectory, "mst-math-demo-rc1-p01");
  return { status: "PASS", sourceHash: ingested.document.sourceHash, diagnostics: [], qa: bundle.qa, lesson, artifacts };
}
