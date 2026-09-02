import assert from "node:assert/strict";
import { evaluateMetrics, BENCHMARK_PROVIDER_COUPLING, type BenchmarkMetric } from "../src/modules/document-intelligence-benchmark/index.js";
import type { DocumentIR } from "../src/modules/question-bank/types.js";

const sourceHash = "fixture-source-hash";
const doc: DocumentIR = { sourceDocument: "fixture://document-001", sourceHash, warnings: [], figures: [{ id: "fig-1", relationshipId: "r1", sourceLocation: "p:1", semanticRole: "RASTER_FIGURE" }], blocks: [{ id: "b1", kind: "PARAGRAPH", order: 0, content: [{ type: "text", value: "Điểm A và góc 30°" }], sourceLocation: "p:1" }] };
const results = evaluateMetrics(doc, structuredClone(doc), { stable: true }, { stable: true });
const absent = evaluateMetrics(doc, structuredClone(doc));
const missingActual = evaluateMetrics(doc, structuredClone(doc), { stable: true }, undefined);
const expected: BenchmarkMetric[] = ["TEXT_FIDELITY", "MATH_FIDELITY", "FIGURE_SEMANTIC_FIDELITY", "READING_ORDER", "TABLE_FIDELITY", "ASSET_IDENTITY_PRESERVATION", "PROVENANCE_PRESERVATION", "VIETNAMESE_FIDELITY", "REPRODUCIBILITY"];
assert.equal(BENCHMARK_PROVIDER_COUPLING, "ABSTRACT_ONLY");
for (const metric of expected) assert.equal(results.find((r) => r.metric === metric)?.status, "PASS", metric);
assert.equal(results.find((r) => r.metric === "RUNTIME")?.status, "NOT_APPLICABLE");
assert.equal(absent.find((r) => r.metric === "REPRODUCIBILITY")?.status, "NOT_APPLICABLE");
assert.equal(missingActual.find((r) => r.metric === "REPRODUCIBILITY")?.status, "REVIEW");
console.log("REPRODUCIBILITY_UNDEFINED_INPUT_QA=PASS");
console.log("REPRODUCIBILITY_STABLE_HASH_QA=PASS");
console.log("DOCUMENT_INTELLIGENCE_BENCHMARK_V1_QA=PASS");
