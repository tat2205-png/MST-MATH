import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DOCUMENT_COMPONENT_KINDS, DOCUMENT_COMPONENT_SCHEMA_VERSION,
  createExerciseDocumentComponent, createStudentWorkspace,
  deserializeDocumentComponent, isDocumentComponentVisible,
  serializeDocumentComponent, validateDocumentComponent,
  type DocumentComponent,
} from "../src/modules/document-engine/index.js";
import type { MathAssetReference, MathDocumentBlock } from "../src/modules/math-ir/index.js";
import type { QuestionObject } from "../src/modules/question-bank/types.js";

const paragraph: MathDocumentBlock = { id: "block-1", type: "paragraph", text: "Nội dung toán học." };
const metadata = { sourceEvidence: [{ id: "evidence-1", origin: "imported" as const, sourceType: "docx" as const, sourceId: "word/document.xml:p1", excerpt: "Nội dung toán học." }] };
const base = { schemaVersion: DOCUMENT_COMPONENT_SCHEMA_VERSION, id: "component-1", content: [paragraph], metadata };
const imageAsset: MathAssetReference = { id: "asset-image-1", kind: "image", uri: "word/media/figure.svg", mimeType: "image/svg+xml" };
const tableAsset: MathAssetReference = { id: "asset-table-1", kind: "table", metadata: { adapterMetadata: { rows: [["a", "b"]] } } };
const question: QuestionObject = {
  id: "question-1", source: { document: "source.docx", sourceHash: "hash", blockIds: ["p1"], sourceLocations: ["word/document.xml:p1"] },
  type: "ESSAY", stem: [{ type: "text", value: "Chứng minh mệnh đề." }], options: [], trueFalseItems: [], subquestions: [], figures: [], figureAssociations: [], metadata: {}, warnings: [], validationStatus: "VALID",
};
const originalQuestion = structuredClone(question);

const components: DocumentComponent[] = [
  { ...base, kind: "DEFINITION" },
  { ...base, id: "theorem", kind: "THEOREM" },
  { schemaVersion: DOCUMENT_COMPONENT_SCHEMA_VERSION, id: "example", kind: "EXAMPLE", problemId: "problem-1", content: [paragraph], metadata },
  createExerciseDocumentComponent("exercise", question, { metadata }),
  { ...base, id: "solution", kind: "SOLUTION" },
  { ...base, id: "answer", kind: "ANSWER" },
  { ...base, id: "note", kind: "NOTE" },
  { ...base, id: "warning", kind: "WARNING" },
  { schemaVersion: DOCUMENT_COMPONENT_SCHEMA_VERSION, id: "figure", kind: "FIGURE", asset: imageAsset, caption: "Hình 1", metadata },
  { schemaVersion: DOCUMENT_COMPONENT_SCHEMA_VERSION, id: "table", kind: "TABLE", asset: tableAsset, caption: "Bảng 1", metadata },
  { schemaVersion: DOCUMENT_COMPONENT_SCHEMA_VERSION, id: "workspace", kind: "WORKSPACE", workspace: createStudentWorkspace("GRID_MEDIUM"), metadata },
];

for (const component of components) {
  assert.equal(validateDocumentComponent(component).status, "PASS", component.kind);
  assert.deepEqual(deserializeDocumentComponent(serializeDocumentComponent(component)), component);
}
assert.deepEqual(components.map((item) => item.kind), DOCUMENT_COMPONENT_KINDS);
assert.deepEqual(question, originalQuestion);
assert.equal((components.find((item) => item.kind === "EXERCISE") as Extract<DocumentComponent, { kind: "EXERCISE" }>).questionId, question.id);
assert.strictEqual((components.find((item) => item.kind === "FIGURE") as Extract<DocumentComponent, { kind: "FIGURE" }>).asset, imageAsset);
assert.strictEqual((components.find((item) => item.kind === "TABLE") as Extract<DocumentComponent, { kind: "TABLE" }>).asset, tableAsset);
const workspace = (components.find((item) => item.kind === "WORKSPACE") as Extract<DocumentComponent, { kind: "WORKSPACE" }>).workspace;
assert.equal(workspace.schemaVersion, "student-workspace/v1");
assert.equal(workspace.type, "GRID_MEDIUM");
if (workspace.type === "GRID_MEDIUM") assert.equal(workspace.cellSizeMm, 5);

const solution = components.find((item) => item.kind === "SOLUTION")!;
const answer = components.find((item) => item.kind === "ANSWER")!;
assert.equal(isDocumentComponentVisible(solution, "STUDENT"), false);
assert.equal(isDocumentComponentVisible(answer, "STUDENT"), false);
assert.equal(isDocumentComponentVisible(solution, "TEACHER"), true);
assert.equal(isDocumentComponentVisible(answer, "TEACHER"), true);
assert.equal(isDocumentComponentVisible(components[0], "STUDENT"), true);

assert.equal(validateDocumentComponent({ schemaVersion: DOCUMENT_COMPONENT_SCHEMA_VERSION, id: "bad", kind: "PROOF" }).issues[0].code, "UNKNOWN_COMPONENT_KIND");
const rendererSpecific = validateDocumentComponent({ ...base, kind: "NOTE", metadata: { ...metadata, adapterMetadata: { className: "red-box" } } });
assert.equal(rendererSpecific.status, "FAIL");
assert.ok(rendererSpecific.issues.some((item) => item.code === "RENDERER_SPECIFIC_FIELD_FORBIDDEN"));

const source = readFileSync(new URL("../src/modules/document-engine/document-components.ts", import.meta.url), "utf8");
for (const forbidden of ["DocumentIRV2", "DocumentEngineV2", "ComponentEngineV2", "WorkspaceEngineV2", "interface QuestionObject", "interface MathAssetReference", "interface StudentWorkspace"])
  assert.doesNotMatch(source, new RegExp(forbidden));
assert.match(source, /QuestionObject/);
assert.match(source, /MathAssetReference/);
assert.match(source, /StudentWorkspace/);

console.log([
  "COMPONENT_DEFINITION_VALID=PASS", "COMPONENT_THEOREM_VALID=PASS", "COMPONENT_EXAMPLE_VALID=PASS",
  "COMPONENT_EXERCISE_VALID=PASS", "COMPONENT_SOLUTION_VALID=PASS", "COMPONENT_ANSWER_VALID=PASS",
  "COMPONENT_NOTE_VALID=PASS", "COMPONENT_WARNING_VALID=PASS", "COMPONENT_FIGURE_VALID=PASS",
  "COMPONENT_TABLE_VALID=PASS", "COMPONENT_WORKSPACE_VALID=PASS", "UNKNOWN_COMPONENT_REJECTED=PASS",
  "STUDENT_SOLUTION_ISOLATED=PASS", "STUDENT_ANSWER_ISOLATED=PASS", "WORKSPACE_REUSES_NA_DOC_01S=PASS",
  "FIGURE_REUSES_EXISTING_ASSET_MODEL=PASS", "TABLE_REUSES_EXISTING_TABLE_MODEL=PASS",
  "EXERCISE_REUSES_EXISTING_QUESTION_MODEL=PASS", "SOURCE_TRACEABILITY_COMPATIBILITY=PASS",
  "SEMANTIC_SERIALIZATION_ROUNDTRIP=PASS", "NO_RENDERER_SPECIFIC_CANONICAL_FIELDS=PASS",
  "DOCUMENT_ENGINE_DUPLICATED=NO", "DOCUMENT_IR_V2_CREATED=NO", "QUESTION_MODEL_DUPLICATED=NO",
  "ASSET_MODEL_DUPLICATED=NO", "TABLE_MODEL_DUPLICATED=NO", "WORKSPACE_MODEL_DUPLICATED=NO",
  "NA_DOC_02_STATUS=PASS",
].join("\n"));
