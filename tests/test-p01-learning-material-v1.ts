import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import type { DocumentIR } from "../src/modules/document-engine/document-ir.js";
import { buildP01LessonIR, renderP01OutputBundle, validateP01LessonIR } from "../src/modules/learning-material/index.js";

function check(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error(`${label}=FAIL`);
  console.log(`${label}=PASS`);
}

const png = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==", "base64"));

export const document: DocumentIR = {
  sourceDocument: "p01-source-backed-fixture.docx",
  sourceHash: "p01-source-backed-fixture-sha256",
  provenance: {
    sourceFile: "p01-source-backed-fixture.docx",
    sourceSha256: "p01-source-backed-fixture-sha256",
    sourceKind: "DOCX",
    parser: "DOCX_INGESTION_V1",
    transformationHistory: ["SYNTHETIC_CONTRACT_FIXTURE_ONLY"],
  },
  blocks: [
    {
      id: "b1",
      kind: "SECTION",
      order: 1,
      content: [{ type: "text", value: "Bài học kiểm chứng P01", sourceLocation: "word/document.xml#p1" }],
      sourceLocation: "word/document.xml#p1",
    },
    {
      id: "b2",
      kind: "PARAGRAPH",
      order: 2,
      content: [
        { type: "text", value: "Xét biểu thức ", sourceLocation: "word/document.xml#p2" },
        { type: "math", math: { sourceType: "LATEX", sourceRaw: "x^2+1", latex: "x^2+1", normalized: "x^2+1", parseStatus: "PARSED", warnings: [], sourceLocation: "word/document.xml#p2/r2" }, sourceLocation: "word/document.xml#p2/r2" },
      ],
      sourceLocation: "word/document.xml#p2",
    },
    {
      id: "b3",
      kind: "TABLE",
      order: 3,
      content: [{ type: "table", cells: [[{ type: "text", value: "A" }], [{ type: "math", math: { sourceType: "LATEX", sourceRaw: "1/2", latex: "\\frac{1}{2}", normalized: "1/2", parseStatus: "PARSED", warnings: [], sourceLocation: "word/document.xml#tbl1/c2" } }]], sourceLocation: "word/document.xml#tbl1" }],
      sourceLocation: "word/document.xml#tbl1",
    },
    {
      id: "b4",
      kind: "PARAGRAPH",
      order: 4,
      content: [{ type: "figure", figureId: "fig1", sourceLocation: "word/document.xml#p4" }],
      sourceLocation: "word/document.xml#p4",
    },
  ],
  figures: [{
    id: "fig1",
    relationshipId: "rId1",
    mimeType: "image/png",
    bytes: png,
    sourceLocation: "word/document.xml#p4",
    caption: "Hình nguồn kiểm chứng",
    semanticRole: "REAL_FIGURE",
    status: "PASS",
    dimensions: { widthPx: 1, heightPx: 1, widthEmu: 914400, heightEmu: 914400 },
  }],
  warnings: [],
  extractionIssues: [],
};

const lesson = buildP01LessonIR(document);
const qa = validateP01LessonIR(lesson);
check(lesson.profileId === "P01_LEARNING_MATERIAL", "P01_PROFILE_AUTHORITY_QA");
check(lesson.iconAuthority === "PIMATH-DNA-SEMANTIC-ICONS-V1.1", "P01_ICON_AUTHORITY_QA");
check(qa.state === "PASS", "P01_LESSON_IR_QA");
check(qa.sourceBlockCount === qa.lessonUnitCount && qa.sourceBlockCount === 4, "P01_NO_CONTENT_LOSS_QA");
check(qa.sourceMathCount === qa.lessonMathCount && qa.sourceMathCount === 2, "P01_MATH_PRESERVATION_QA");
check(qa.referencedFigureCount === 1, "P01_FIGURE_OWNERSHIP_QA");
check(lesson.blueprint.unitIds.length === 4 && lesson.activityGraph.nodes.length === 4 && lesson.activityGraph.edges.length === 3, "P01_SOURCE_SEQUENCE_GRAPH_QA");
check(lesson.visualRequirements.some((item) => item.kind === "EQUATION") && lesson.visualRequirements.some((item) => item.kind === "TABLE") && lesson.visualRequirements.some((item) => item.kind === "FIGURE"), "P01_VISUAL_REQUIREMENTS_SOURCE_BACKED_QA");

export const bundle = renderP01OutputBundle(lesson);
check(bundle.artifacts.length === 3, "P01_THREE_OUTPUTS_QA");
check(bundle.artifacts.every((artifact) => artifact.semanticSignature === lesson.semanticSignature), "P01_CROSS_OUTPUT_SEMANTIC_EQUIVALENCE_QA");

const htmlArtifact = bundle.artifacts.find((artifact) => artifact.format === "HTML")!;
const html = Buffer.from(htmlArtifact.bytes).toString("utf8");
check(html.includes(`p01-semantic-signature\" content=\"${lesson.semanticSignature}`), "P01_HTML_SIGNATURE_QA");
check(html.includes('data-source-block-id="b1"') && html.includes('data-source-block-id="b4"'), "P01_HTML_PROVENANCE_QA");
check(html.includes('aria-label="Biểu thức toán học: x^2+1"') && html.includes('alt="Hình nguồn kiểm chứng"'), "P01_HTML_ACCESSIBILITY_QA");

const docxArtifact = bundle.artifacts.find((artifact) => artifact.format === "DOCX")!;
const docxParts = unzipSync(docxArtifact.bytes);
const wordDocument = Buffer.from(docxParts["word/document.xml"]!).toString("utf8");
check(Boolean(docxParts["word/media/figure-1.png"]), "P01_DOCX_FIGURE_EMBED_QA");
check(wordDocument.includes("Bài học kiểm chứng P01") && wordDocument.includes("m:oMath"), "P01_DOCX_CONTENT_MATH_QA");

const pdfArtifact = bundle.artifacts.find((artifact) => artifact.format === "PDF")!;
check(Buffer.from(pdfArtifact.bytes.subarray(0, 4)).toString("ascii") === "%PDF", "P01_PDF_RUNTIME_QA");
check(pdfArtifact.bytes.length > 500, "P01_PDF_NONEMPTY_QA");

assert.deepEqual(document.blocks.map((block) => block.id), lesson.contentModel.units.map((unit) => unit.sourceBlockId));
console.log("P01_REAL_PIPELINE_CONTRACT_QA=PASS");
console.log("P01_AUTHOR_ONCE_RENDER_MANY_QA=PASS");
