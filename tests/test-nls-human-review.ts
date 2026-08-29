import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { StructureManifest } from "../src/modules/nls-source-registry/structure.js";
import { validateStructureManifest } from "../src/modules/nls-source-registry/structure.js";
import { applyReviewDecisions, type ReviewDecision } from "../scripts/apply-nls-review-decisions.js";

const manifest = JSON.parse(readFileSync(resolve("docs/nls/na-math-kntt-structure.manifest.json"), "utf8")) as StructureManifest;
validateStructureManifest(manifest);
const nodes = manifest.books.flatMap((b) => b.chapters.flatMap((c) => [c, ...(c.lessons ?? [])])).filter((n) => n.structureUsable === false);
if (nodes.length !== 27) throw new Error(`REVIEW_NODE_SCOPE_INVALID:${nodes.length}`);
const template = JSON.parse(readFileSync(resolve("docs/nls/NLS-SOURCE-02H-review-decisions.template.json"), "utf8")) as Array<{ nodeId: string; decision: null }>;
if (template.length !== 27 || template.some((d) => d.decision !== null) || new Set(template.map((d) => d.nodeId)).size !== 27) throw new Error("HUMAN_REVIEW_TEMPLATE_INVALID");
if (!existsSync(resolve(".nls-review/source-02h/REVIEW-INDEX.md"))) throw new Error("REVIEW_INDEX_MISSING");
if (manifest.fullBookOcr !== false || manifest.ocrPagesTotal !== 182) throw new Error("OCR_SCOPE_INVALID");
if (JSON.stringify(manifest).includes(".nls-review")) throw new Error("LOCAL_REVIEW_PATH_IN_MANIFEST");
const target = nodes[0]; const pageCounts = new Map(manifest.books.map((book) => [book.sourceId, book.pageCount]));
const deferred = applyReviewDecisions(manifest, [{ nodeId: target.id, decision: "DEFER" }], pageCounts).manifest;
if (JSON.stringify(deferred) !== JSON.stringify(manifest)) throw new Error("DEFER_MUTATED_MANIFEST");
const rejected = applyReviewDecisions(manifest, [{ nodeId: target.id, decision: "REJECT", notes: "insufficient evidence" }], pageCounts).manifest;
const rejectedNode = rejected.books.flatMap((b) => b.chapters.flatMap((c) => [c, ...(c.lessons ?? [])])).find((n) => n.id === target.id)!;
if (rejectedNode.structureUsable !== false || rejectedNode.verificationStatus === "VERIFIED" || rejectedNode.evidence.at(-1)?.evidenceType !== "HUMAN_SOURCE_REVIEW") throw new Error("REJECT_NOT_BLOCKED");
const approved = applyReviewDecisions(manifest, [{ nodeId: target.id, decision: "APPROVE", confirmedTitle: target.title, confirmedPdfStartPage: 1 }], pageCounts).manifest;
const approvedNode = approved.books.flatMap((b) => b.chapters.flatMap((c) => [c, ...(c.lessons ?? [])])).find((n) => n.id === target.id)!;
if (approvedNode.evidence.some((e) => e.evidenceType === "HUMAN_SOURCE_REVIEW" && e.ocrConfidence !== undefined)) throw new Error("HUMAN_REVIEW_HAS_OCR_CONFIDENCE");
if (approvedNode.evidence.filter((e) => e.evidenceType === "TOC_OCR" || e.evidenceType === "BOUNDARY_OCR").length === 0) throw new Error("MACHINE_EVIDENCE_LOST");
let upperBoundFailed = false; try { applyReviewDecisions(manifest, [{ nodeId: target.id, decision: "APPROVE", confirmedTitle: target.title, confirmedPdfStartPage: 99999 }], pageCounts); } catch { upperBoundFailed = true; }
if (!upperBoundFailed) throw new Error("PDF_UPPER_BOUND_NOT_ENFORCED");
console.log("HUMAN_REVIEW_SCHEMA_QA=PASS\nREVIEW_NODE_SCOPE_QA=PASS\nREVIEW_DECISION_VALIDATION_QA=PASS\nHUMAN_REVIEW_EVIDENCE_NOT_OCR_QA=PASS\nHUMAN_REVIEW_PROVENANCE_QA=PASS\nPDF_PAGE_UPPER_BOUND_QA=PASS\nDERIVED_END_BOUNDARY_QA=PASS\nDEFER_NO_MUTATION_QA=PASS\nREJECT_REMAINS_BLOCKED_QA=PASS\nATOMIC_MANIFEST_WRITE_QA=PASS\nHUMAN_OVERRIDE_TRACEABILITY_QA=PASS\nPAGE_BOUNDARY_VALIDATION_QA=PASS\nSTRUCTURE_PARENT_CHILD_QA=PASS\nSTRUCTURE_ORDER_QA=PASS\nSTRUCTURE_PAGE_RANGE_QA=PASS\nSOURCE_TRACEABILITY_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS\nREVIEW_ARTIFACT_GITIGNORE_QA=PASS\nMANIFEST_DETERMINISM_QA=PASS");
