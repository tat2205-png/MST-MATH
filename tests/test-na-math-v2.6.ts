import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NA_MATH_STANDARD_V2_6 } from "../src/config/naMathStandardV26.ts";
import { adaptQuestionBankDocumentStandard } from "../src/modules/question-bank/standardsAdapter.ts";
import type { DocumentIR } from "../src/modules/question-bank/types.ts";

const EXPECTED_FILE_COUNT = 135;
const EXPECTED_TREE_SHA256 = "03993af602f1ae109bc02b9ddb161de760d4790d013f02741550bff7868de159";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)), NA_MATH_STANDARD_V2_6.canonicalAssetRoot);

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const files = filesUnder(root).sort((a, b) => relative(root, a).localeCompare(relative(root, b), "en"));
const fingerprintSource = files.map((path) => {
  const name = relative(root, path).replaceAll("/", "\\");
  const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
  return `${name}\0${hash}\n`;
}).join("");
const treeHash = createHash("sha256").update(fingerprintSource).digest("hex");
assert.equal(files.length, EXPECTED_FILE_COUNT);
assert.equal(treeHash, EXPECTED_TREE_SHA256);

const standard = NA_MATH_STANDARD_V2_6;
assert.equal(standard.id, "NA_MATH_STANDARD_V2_6");
assert.equal(standard.layout.id, "NA-MATH-LAYOUT-V1.3-CANONICAL");
assert.deepEqual(standard.layout.tokens, {
  a4_margin_mm: 18,
  video_safe_margin_px: 72,
  video_problem_bar_ratio: [0.18, 0.22],
  video_solution_figure_ratio: [0.58, 0.42],
});
assert.deepEqual(Object.fromEntries(Object.entries(standard.colorSystem.output_contracts).map(([key, value]) => [key, value.primary_accent])), {
  learning_material: "#0C2D57",
  worksheet: "#2F8F68",
  exercise_sheet: "#6B4FA3",
  video: "#D9911B",
});
assert.deepEqual(standard.typography, {
  body: "Libertinus Serif",
  math: "Libertinus Math",
  ui: "Source Sans 3",
  fallback_vi_serif: "Noto Serif",
  fallback_vi_sans: "Noto Sans",
});
assert.equal(standard.mathNotation.id, "GDPT2018_KNTT_MATH_NOTATION_POLICY");
assert.equal(standard.symbolRegistry.id, "NA_MATH_KNTT_SYMBOL_STANDARD_V1_0");
assert.equal(standard.validateMathSource("AB\\perp CD\\Rightarrow H\\in(P)").status, "PASS");
assert.equal(standard.validateMathSource("AB ⊥ CD").status, "BLOCK_RENDER");
assert.equal(standard.validateMathSource("x\\unknownsymbol y").status, "BLOCK_RENDER");
assert.deepEqual(standard.semanticGeometry.pipeline, [
  "given_data", "semantic_geometry", "derived_relations_with_provenance", "view_profile",
  "parallel_projection", "edge_visibility_table", "label_placement", "geometry_qa", "render",
]);
assert.equal(standard.semanticGeometry.rules.visual_guessing_forbidden, true);
assert.equal(standard.semanticGeometry.rules.unknown_profile_policy, "BLOCK_RENDER");
assert.ok(standard.approvedGeometryProfiles.profiles.every((profile) => ["LOCKED", "BASELINE", "TEMPLATE"].includes(profile.status)));
assert.equal(standard.qaContracts.locked_layers.length, 8);
assert.throws(() => {
  (standard.typography as { body: string }).body = "Cambria";
}, TypeError);

const document: DocumentIR = { sourceDocument: "fixture.docx", sourceHash: "hash", blocks: [], figures: [], warnings: [] };
const documentAdapter = adaptQuestionBankDocumentStandard(document, "document");
const assessmentAdapter = adaptQuestionBankDocumentStandard(document, "assessment");
assert.equal(documentAdapter.outputIdentity, "learning_material");
assert.equal(documentAdapter.outputContract.primary_accent, "#0C2D57");
assert.equal(assessmentAdapter.outputIdentity, "exercise_sheet");
assert.equal(assessmentAdapter.outputContract.primary_accent, "#6B4FA3");
assert.equal(documentAdapter.standard, NA_MATH_STANDARD_V2_6);

console.log([
  "V2_6_CANONICAL_ASSET_IDENTITY_QA=PASS",
  "STANDARD_REGISTRY_QA=PASS",
  "LAYOUT_LOCK_QA=PASS",
  "COLOR_LOCK_QA=PASS",
  "FONT_LOCK_QA=PASS",
  "MATH_SYMBOL_QA=PASS",
  "RAW_UNICODE_MATH_QA=PASS",
  "GEOMETRY_RULE_QA=PASS",
  "APPROVED_PROFILE_LOCK_QA=PASS",
  "QA_GATE_LOCK_QA=PASS",
  "DOCUMENT_ENGINE_INTEGRATION_QA=PASS",
].join("\n"));
