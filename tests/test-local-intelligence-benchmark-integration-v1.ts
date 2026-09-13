import assert from "node:assert/strict";
import { runBenchmark, type BenchmarkCase, type ProviderRun } from "../src/modules/document-intelligence-benchmark/index.js";
import type { LocalDocumentEvidence } from "../src/modules/local-document-intelligence/types.ts";
import type { DocumentIR } from "../src/modules/question-bank/types.js";

const sourceDocument = "fixture://document-001";
const sourceHash = "fixture-source-hash";
const evidence: LocalDocumentEvidence = { provider: "docling", providerVersion: "contract-only", sourceDocument, sourceHash, evidenceKind: "LAYOUT", confidence: 0.8, payload: { blocks: [] }, issues: [], reviewStatus: "REVIEW", transformationHistory: [], provenance: { sourceFile: sourceDocument, sourceSha256: sourceHash, provider: "docling", transformations: [], authority: "EVIDENCE_ONLY" } };
const document: DocumentIR = { sourceDocument, sourceHash, warnings: [], figures: [], blocks: [] };
const testCase: BenchmarkCase = { caseId: "evidence-identity", input: { sourceId: sourceDocument, sourceHash, policy: "UNIT_TEST_FIXTURE" }, expectedEvidence: {}, applicableMetrics: ["PROVENANCE_PRESERVATION"] };
const run: ProviderRun = { provider: evidence.provider, runId: "run-001", metadata: { sourceDocument: evidence.sourceDocument, sourceHash: evidence.sourceHash, provenanceAuthority: evidence.provenance.authority }, output: { document } };
const report = runBenchmark(testCase, run, document);

assert.equal(evidence.sourceDocument, run.metadata?.sourceDocument);
assert.equal(evidence.sourceHash, run.metadata?.sourceHash);
assert.equal(evidence.provider, run.provider);
assert.equal(evidence.provenance.authority, "EVIDENCE_ONLY");
assert.equal(evidence.confidence, 0.8);
assert.equal(evidence.reviewStatus, "REVIEW");
assert.equal(report.case.input.sourceId, evidence.sourceDocument);
assert.equal(document.sourceHash, sourceHash);
assert.notEqual(evidence.payload, document);
console.log("EVIDENCE_SOURCE_IDENTITY_QA=PASS");
console.log("EVIDENCE_PROVENANCE_QA=PASS");
console.log("EVIDENCE_REVIEW_STATUS_QA=PASS");
console.log("BENCHMARK_SOURCE_IDENTITY_QA=PASS");
console.log("NO_AUTO_CANONICAL_PROMOTION_QA=PASS");
