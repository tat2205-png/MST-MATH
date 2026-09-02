import { createHash } from "node:crypto";
import { normalizeVietnameseText } from "../question-bank/normalization.js";
import type { ContentBlock, DocumentIR, FigureRecord } from "../question-bank/types.js";

export const BENCHMARK_PROVIDER_COUPLING = "ABSTRACT_ONLY" as const;
export const BENCHMARK_FIXTURE_POLICIES = ["UNIT_TEST_FIXTURE", "BENCHMARK_FIXTURE", "REAL_ACCEPTANCE_SOURCE", "GOLDEN_SOURCE"] as const;
export const METRICS = ["TEXT_FIDELITY", "MATH_FIDELITY", "FIGURE_SEMANTIC_FIDELITY", "READING_ORDER", "TABLE_FIDELITY", "ASSET_IDENTITY_PRESERVATION", "PROVENANCE_PRESERVATION", "VIETNAMESE_FIDELITY", "RUNTIME", "REPRODUCIBILITY"] as const;
export type BenchmarkMetric = typeof METRICS[number];
export type MetricStatus = "PASS" | "FAIL" | "REVIEW" | "NOT_APPLICABLE";
export type FixturePolicy = typeof BENCHMARK_FIXTURE_POLICIES[number];

export interface BenchmarkCase { caseId: string; input: { sourceId: string; sourceHash: string; policy: FixturePolicy }; expectedEvidence: Record<string, unknown>; applicableMetrics: BenchmarkMetric[]; }
export interface ProviderRun { provider: string; runId: string; metadata?: Record<string, unknown>; startedAt?: string; finishedAt?: string; durationMs?: number; output: NormalizedRunOutput; }
export interface NormalizedRunOutput { document?: DocumentIR; stableOutput?: unknown; provenance?: Record<string, unknown>; }
export interface MetricResult { metric: BenchmarkMetric; status: MetricStatus; measurement?: number; issues: string[]; }
export interface BenchmarkReport { case: BenchmarkCase; provider: string; runId: string; metrics: MetricResult[]; runtime?: { durationMs: number; monotonic: true }; provenanceStatus: MetricStatus; overallStatus: MetricStatus; }

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value, (_k, v) => v instanceof Uint8Array ? Array.from(v) : v)).digest("hex");
const text = (blocks: ContentBlock[] = []): string => blocks.map((b) => b.type === "text" ? b.value : b.type === "math" ? (b.math.latex ?? b.math.normalized ?? b.math.sourceRaw) : b.type === "figure" ? `[FIGURE:${b.figureId}]` : b.cells.flat().map((c) => text([c])).join(" | ")).join("");
const anchors = (doc?: DocumentIR) => (doc?.blocks ?? []).slice().sort((a, b) => a.order - b.order).map((b) => `${b.kind}:${b.sourceLocation ?? b.id}`);
const figures = (doc?: DocumentIR): FigureRecord[] => doc?.figures ?? [];
const issue = (ok: boolean, metric: BenchmarkMetric, measurement?: number): MetricResult => ({ metric, status: ok ? "PASS" : "FAIL", ...(measurement === undefined ? {} : { measurement }), issues: ok ? [] : [`${metric}_MISMATCH`] });

export function evaluateMetrics(expected: DocumentIR, actual: DocumentIR, expectedStable?: unknown, actualStable?: unknown): MetricResult[] {
  const expectedText = normalizeVietnameseText(expected.blocks.map((b) => text(b.content)).join(""));
  const actualText = normalizeVietnameseText(actual.blocks.map((b) => text(b.content)).join(""));
  const mathExpected = expected.blocks.flatMap((b) => b.content).filter((b) => b.type === "math").map((b) => b.math.latex ?? b.math.normalized ?? b.math.sourceRaw);
  const mathActual = actual.blocks.flatMap((b) => b.content).filter((b) => b.type === "math").map((b) => b.math.latex ?? b.math.normalized ?? b.math.sourceRaw);
  const expFigures = figures(expected), actFigures = figures(actual);
  const provenanceOk = expected.sourceHash === actual.sourceHash && !!actual.sourceDocument;
  return [
    issue(expectedText === actualText, "TEXT_FIDELITY"),
    issue(JSON.stringify(mathExpected) === JSON.stringify(mathActual), "MATH_FIDELITY"),
    issue(expFigures.length === actFigures.length && expFigures.every((f, i) => f.id === actFigures[i]?.id && f.semanticRole === actFigures[i]?.semanticRole), "FIGURE_SEMANTIC_FIDELITY"),
    issue(JSON.stringify(anchors(expected)) === JSON.stringify(anchors(actual)), "READING_ORDER"),
    issue(JSON.stringify(expected.blocks.filter((b) => b.kind === "TABLE")) === JSON.stringify(actual.blocks.filter((b) => b.kind === "TABLE")), "TABLE_FIDELITY"),
    issue(expFigures.every((f) => actFigures.some((a) => a.id === f.id && a.sourceLocation === f.sourceLocation)), "ASSET_IDENTITY_PRESERVATION"),
    issue(provenanceOk, "PROVENANCE_PRESERVATION"),
    issue(expectedText === actualText, "VIETNAMESE_FIDELITY"),
    { metric: "RUNTIME", status: "NOT_APPLICABLE", issues: [] },
    issue(hash(expectedStable) === hash(actualStable), "REPRODUCIBILITY"),
  ];
}

export function runBenchmark(testCase: BenchmarkCase, run: ProviderRun, expected: DocumentIR): BenchmarkReport {
  const started = performance.now();
  const metrics = run.output.document ? evaluateMetrics(expected, run.output.document, testCase.expectedEvidence.stableOutput, run.output.stableOutput) : testCase.applicableMetrics.map((metric) => ({ metric, status: "REVIEW" as const, issues: ["RUN_OUTPUT_UNAVAILABLE"] }));
  const durationMs = run.durationMs ?? Math.max(0, performance.now() - started);
  if (testCase.applicableMetrics.includes("RUNTIME")) metrics[metrics.findIndex((m) => m.metric === "RUNTIME")] = { metric: "RUNTIME", status: Number.isFinite(durationMs) && durationMs >= 0 ? "PASS" : "FAIL", measurement: durationMs, issues: [] };
  const applicable = metrics.filter((m) => testCase.applicableMetrics.includes(m.metric));
  return { case: testCase, provider: run.provider, runId: run.runId, metrics: applicable, runtime: { durationMs, monotonic: true }, provenanceStatus: metrics.find((m) => m.metric === "PROVENANCE_PRESERVATION")?.status ?? "NOT_APPLICABLE", overallStatus: applicable.some((m) => m.status === "FAIL") ? "FAIL" : applicable.some((m) => m.status === "REVIEW") ? "REVIEW" : "PASS" };
}

export function summarizeReport(report: BenchmarkReport): string { return `${report.case.caseId} | ${report.provider} | ${report.overallStatus} | ${report.metrics.map((m) => `${m.metric}=${m.status}`).join(", ")} | ${report.runtime?.durationMs ?? 0}ms`; }
