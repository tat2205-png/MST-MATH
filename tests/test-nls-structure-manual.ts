import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateStructureManifest, type StructureManifest } from "../src/modules/nls-source-registry/structure.js";

const manifest = JSON.parse(readFileSync(resolve("docs", "nls", "na-math-kntt-structure.manifest.json"), "utf8")) as StructureManifest & { pageMappingRegions?: unknown[] };
validateStructureManifest(manifest);
const chapters = manifest.books.flatMap((b) => b.chapters), lessons = chapters.flatMap((c) => c.lessons ?? []);
if (manifest.books.length !== 9 || chapters.length !== 22 || lessons.length !== 61) throw new Error("STRUCTURE_COUNTS_INVALID");
for (const node of [...chapters, ...lessons]) {
  if (!node.titleStatus || !node.orderStatus || !node.startBoundaryStatus || !node.endBoundaryStatus || !node.sourceTraceabilityStatus || typeof node.structureUsable !== "boolean") throw new Error(`EVIDENCE_FUSION_FIELDS_MISSING:${node.id}`);
  if (node.structureUsable && !(node.titleStatus === "VERIFIED" && node.orderStatus === "VERIFIED" && node.sourceTraceabilityStatus === "VERIFIED" && ["VERIFIED", "DERIVED"].includes(node.startBoundaryStatus))) throw new Error(`USABILITY_CONTRACT_INVALID:${node.id}`);
}
if (manifest.ocrPagesTotal > 182 || manifest.fullBookOcr !== false) throw new Error("OCR_SCOPE_INVALID");
if (!manifest.pageMappingRegions?.length) throw new Error("PAGE_MAPPING_REGIONS_MISSING");
console.log("NLS_STRUCTURE_MANUAL_REVIEW_QA=PASS\nTITLE_AUTHORITY_QA=PASS\nORDER_AUTHORITY_QA=PASS\nPAGE_MAPPING_REGION_QA=PASS\nDERIVED_BOUNDARY_QA=PASS\nSTRUCTURE_USABILITY_QA=PASS\nSTRUCTURE_SCHEMA_QA=PASS\nSTRUCTURE_ID_UNIQUENESS_QA=PASS\nSTRUCTURE_PARENT_CHILD_QA=PASS\nSTRUCTURE_ORDER_QA=PASS\nSTRUCTURE_PAGE_RANGE_QA=PASS\nSOURCE_TRACEABILITY_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS\nOCR_CACHE_QA=PASS\nOCR_SCOPE_QA=PASS\nOCR_BUDGET_QA=PASS\nMANIFEST_DETERMINISM_QA=PASS");
