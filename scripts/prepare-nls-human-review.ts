import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { registerKnttSources } from "../src/modules/nls-source-registry/index.js";
import type { StructureManifest, StructureNode } from "../src/modules/nls-source-registry/structure.js";

const root = resolve(".nls-review", "source-02h");
const manifest = JSON.parse(readFileSync(resolve("docs/nls/na-math-kntt-structure.manifest.json"), "utf8")) as StructureManifest & { pageMappingRegions?: unknown[] };
const sourceRoot = process.env.NA_MATH_NLS_SOURCE_ROOT ?? "D:\\NA-MATH-NLS-AI-SOURCES";
const registry = registerKnttSources(sourceRoot);
const byId = new Map<string, (typeof registry.sources)[number]>(registry.sources.map((source) => [source.sourceId, source]));
const nodes: StructureNode[] = manifest.books.flatMap((book) => book.chapters.flatMap((chapter) => [chapter, ...(chapter.lessons ?? [])])).filter((node) => node.structureUsable === false);
if (nodes.length !== 27) throw new Error(`REVIEW_NODE_SCOPE_INVALID:${nodes.length}`);
const endMatter = /BẢNG TRA CỨU THUẬT NGỮ|BANG TRA CUU THUAT NGU|MỤC LỤC|MUC LUC|TÀI LIỆU THAM KHẢO|TAI LIEU THAM KHAO|BẢNG TRA CỨU|BANG TRA CUU|(?:copyright|colophon|publication)/i;
const allNodes = manifest.books.flatMap((book) => book.chapters.flatMap((chapter) => [chapter, ...(chapter.lessons ?? [])]));
const crediblePagesBySource = new Map<string, Set<number>>();
for (const node of allNodes) for (const evidence of node.evidence) {
  if (evidence.evidenceType === "BOUNDARY_OCR" && !endMatter.test(evidence.detectedHeading)) {
    const pages = crediblePagesBySource.get(node.sourceId) ?? new Set<number>(); pages.add(evidence.pdfPageNumber); crediblePagesBySource.set(node.sourceId, pages);
  }
}
for (const node of allNodes) if (node.structureUsable && node.pdfStartPage != null) {
  const pages = crediblePagesBySource.get(node.sourceId) ?? new Set<number>(); pages.add(node.pdfStartPage); crediblePagesBySource.set(node.sourceId, pages);
}
const candidateFor = (node: StructureNode): { page: number | null; confidence: string; method: string; reason: string } => {
  const direct = [...node.evidence].reverse().find((e) => e.evidenceType === "BOUNDARY_OCR" && !endMatter.test(e.detectedHeading));
  if (direct) return { page: direct.pdfPageNumber, confidence: "HIGH_CONFIDENCE", method: "DIRECT_NODE_BOUNDARY_EVIDENCE", reason: "Direct source-local heading evidence requires visual confirmation" };
  const mapped = [...node.evidence].reverse().find((e) => e.evidenceType === "TOC_OCR" && e.detectedHeading === "TOC printed page + confirmed book offset");
  const trusted = crediblePagesBySource.get(node.sourceId);
  const source = byId.get(node.sourceId);
  const isTailEndMatterRisk = source != null && mapped != null && mapped.pdfPageNumber >= source.pageCount - 3;
  if (mapped && trusted?.size && trusted.has(mapped.pdfPageNumber) && !endMatter.test(mapped.detectedHeading) && !isTailEndMatterRisk) return { page: mapped.pdfPageNumber, confidence: "MEDIUM_CONFIDENCE", method: "SOURCE_LOCAL_VERIFIED_PAGE_MAPPING", reason: "Source-local mapped boundary requires visual confirmation" };
  return { page: null, confidence: "UNKNOWN", method: "MANUAL_SOURCE_REVIEW_REQUIRED", reason: "No credible source-local candidate page; inspect source PDF manually" };
};
const candidates = new Map(nodes.map((node) => [node.id, candidateFor(node)]));
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
const pageSet = new Map<string, Set<number>>();
for (const node of nodes) { const candidate = candidates.get(node.id)!; if (candidate.page != null) { const pages = pageSet.get(node.sourceId) ?? new Set<number>(); for (const page of [candidate.page - 1, candidate.page, candidate.page + 1]) if (page >= 1) pages.add(page); pageSet.set(node.sourceId, pages); } }
const files = new Map<string, string[]>();
for (const [sourceId, pages] of pageSet) { const source = byId.get(sourceId); if (!source) throw new Error(`SOURCE_NOT_REGISTERED:${sourceId}`); const dir = join(root, sourceId); mkdirSync(dir, { recursive: true }); const paths: string[] = []; for (const page of [...pages].sort((a, b) => a - b)) { const base = join(dir, `pdf-page-${String(page).padStart(4, "0")}`); const out = `${base}.jpg`; if (!existsSync(out)) execFileSync("pdftoppm", ["-f", String(page), "-l", String(page), "-singlefile", "-jpeg", "-r", "150", join(sourceRoot, source.filename), base], { windowsHide: true, stdio: "ignore" }); paths.push(out.replaceAll("\\", "/")); } files.set(sourceId, paths); }
const packet = nodes.map((node) => { const candidate = candidates.get(node.id)!; const localFiles = candidate.page == null ? [] : (files.get(node.sourceId) ?? []); return { nodeId: node.id, sourceId: node.sourceId, nodeType: node.nodeType, parentId: node.parentId, order: node.order, currentTitle: node.title, tocTitle: node.evidence.find((e) => e.evidenceType === "TOC_OCR")?.detectedHeading ?? null, titleStatus: node.titleStatus ?? "UNKNOWN", orderStatus: node.orderStatus ?? "UNKNOWN", startBoundaryStatus: node.startBoundaryStatus ?? "UNKNOWN", endBoundaryStatus: node.endBoundaryStatus ?? "UNKNOWN", printedStartPage: node.printedStartPage, predictedPdfPage: candidate.page, currentPdfStartPage: candidate.page, candidateConfidence: candidate.confidence, candidateEvidenceMethod: candidate.method, reviewReason: candidate.reason, tocEvidence: node.evidence.filter((e) => e.evidenceType === "TOC_OCR"), directHeadingEvidence: node.evidence.filter((e) => e.evidenceType === "BOUNDARY_OCR"), pageMappingEvidence: manifest.pageMappingRegions ?? [], recommendedDecision: "VISUALLY_REVIEW", localReviewFiles: localFiles }; });
writeFileSync(resolve("docs/nls/NLS-SOURCE-02H-review-decisions.template.json"), `${JSON.stringify(packet.map((item) => ({ nodeId: item.nodeId, decision: null, confirmedTitle: null, confirmedPdfStartPage: null, confirmedPrintedStartPage: null, notes: "" })), null, 2)}\n`, "utf8");
const lines = ["# NLS-SOURCE-02H local visual review index", "", "Generated from exactly 27 blocked nodes. Images are local and ignored; no OCR or approvals were performed.", "", ...packet.map((item) => `## ${item.nodeId}\n- NODE_ID: ${item.nodeId}\n- SOURCE_ID: ${item.sourceId}; TYPE: ${item.nodeType}\n- CURRENT_TITLE: ${item.currentTitle}\n- TOC_TITLE: ${item.tocTitle ?? "UNKNOWN"}\n- PRINTED_START_PAGE: ${item.printedStartPage ?? "UNKNOWN"}\n- PREDICTED_PDF_PAGE: ${item.predictedPdfPage ?? "UNKNOWN"}\n- CANDIDATE_CONFIDENCE: ${item.candidateConfidence}\n- CANDIDATE_EVIDENCE_METHOD: ${item.candidateEvidenceMethod}\n- REVIEW_REASON: ${item.reviewReason}\n- REVIEW_PAGE_FILES: ${item.localReviewFiles.length ? item.localReviewFiles.map((file) => `[${file.split("/").pop()}](../../${file})`).join(", ") : "NONE"}`)];
writeFileSync(join(root, "REVIEW-INDEX.md"), `${lines.join("\n\n")}\n`, "utf8");
writeFileSync(resolve("docs/nls/NLS-SOURCE-02H-QA.md"), `# NLS-SOURCE-02H human review package\n\nPhase A only: exactly 27 blocked nodes were packaged for visual review. No nodes were approved and no OCR was run.\n\nReview images: local \`.nls-review/source-02h/\` (ignored, not committed).\nDecision template: \`docs/nls/NLS-SOURCE-02H-review-decisions.template.json\`.\nReview index: local \`.nls-review/source-02h/REVIEW-INDEX.md\`.\n\n| SOURCE_ID | BLOCKED_CHAPTERS | BLOCKED_LESSONS | REVIEW_NODES | REVIEW_PAGES_REQUIRED | STATUS |\n|---|---:|---:|---:|---:|---|\n${manifest.books.map((book) => { const ns = nodes.filter((n) => n.sourceId === book.sourceId); return `| ${book.sourceId} | ${ns.filter((n) => n.nodeType === "CHAPTER").length} | ${ns.filter((n) => n.nodeType === "LESSON").length} | ${ns.length} | ${(files.get(book.sourceId) ?? []).length} | REVIEW_REQUIRED |`; }).join("\n")}\n\nGlobal: total review nodes=27; unique review pages=${[...files.values()].reduce((n, f) => n + f.length, 0)}; decision template=UNPOPULATED; apply script=READY; new OCR pages=0; full-book OCR=NO.\n`, "utf8");
console.log(`REVIEW_NODE_SCOPE_QA=PASS\nTOTAL_REVIEW_NODES=${nodes.length}\nTOTAL_UNIQUE_REVIEW_PAGES=${[...files.values()].reduce((n, f) => n + f.length, 0)}\nNODES_WITH_CREDIBLE_CANDIDATES=${[...candidates.values()].filter((c) => c.page != null).length}\nNODES_REQUIRING_MANUAL_PDF_LOOKUP=${[...candidates.values()].filter((c) => c.page == null).length}\nNEW_OCR_PAGES=0\nREVIEW_IMAGES_COMMITTED=0`);
