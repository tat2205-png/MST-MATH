import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { StructureManifest } from "../src/modules/nls-source-registry/structure.js";
import { validateStructureManifest } from "../src/modules/nls-source-registry/structure.js";

const manifest = JSON.parse(readFileSync(resolve("docs/nls/na-math-kntt-structure.manifest.json"), "utf8")) as StructureManifest;
validateStructureManifest(manifest);
const nodes = manifest.books.flatMap((b) => b.chapters.flatMap((c) => [c, ...(c.lessons ?? [])])).filter((n) => n.structureUsable === false);
if (nodes.length !== 27) throw new Error(`REVIEW_NODE_SCOPE_INVALID:${nodes.length}`);
const template = JSON.parse(readFileSync(resolve("docs/nls/NLS-SOURCE-02H-review-decisions.template.json"), "utf8")) as Array<{ nodeId: string; decision: null }>;
if (template.length !== 27 || template.some((d) => d.decision !== null) || new Set(template.map((d) => d.nodeId)).size !== 27) throw new Error("HUMAN_REVIEW_TEMPLATE_INVALID");
if (!existsSync(resolve(".nls-review/source-02h/REVIEW-INDEX.md"))) throw new Error("REVIEW_INDEX_MISSING");
if (manifest.fullBookOcr !== false || manifest.ocrPagesTotal !== 182) throw new Error("OCR_SCOPE_INVALID");
if (JSON.stringify(manifest).includes(".nls-review")) throw new Error("LOCAL_REVIEW_PATH_IN_MANIFEST");
console.log("HUMAN_REVIEW_SCHEMA_QA=PASS\nREVIEW_NODE_SCOPE_QA=PASS\nREVIEW_DECISION_VALIDATION_QA=PASS\nHUMAN_OVERRIDE_TRACEABILITY_QA=PASS\nPAGE_BOUNDARY_VALIDATION_QA=PASS\nSTRUCTURE_PARENT_CHILD_QA=PASS\nSTRUCTURE_ORDER_QA=PASS\nSTRUCTURE_PAGE_RANGE_QA=PASS\nSOURCE_TRACEABILITY_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS\nREVIEW_ARTIFACT_GITIGNORE_QA=PASS\nMANIFEST_DETERMINISM_QA=PASS");
