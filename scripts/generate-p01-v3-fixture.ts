import { createCanvas } from "canvas";
import { writeP01OutputBundle } from "../src/modules/learning-material/index.js";
import type { DocumentIR } from "../src/modules/document-engine/document-ir.js";
import { buildP01LessonIR, renderP01OutputBundle } from "../src/modules/learning-material/index.js";
import { document as baseDocument } from "../tests/test-p01-learning-material-v1.ts";

const outputDirectory = process.argv[2];
if (!outputDirectory) throw new Error("Usage: generate-p01-v3-fixture.ts <output-directory>");

function labeledPng(label: string): Uint8Array {
  const canvas = createCanvas(720, 220);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 720, 220);
  context.strokeStyle = "#2563eb";
  context.lineWidth = 6;
  context.strokeRect(4, 4, 712, 212);
  context.fillStyle = "#1e3a8a";
  context.font = "bold 48px Arial";
  context.fillText(label, 42, 128);
  return new Uint8Array(canvas.toBuffer("image/png"));
}

const document: DocumentIR = structuredClone(baseDocument);
const baseFigure = document.figures.find((figure) => figure.id === "fig1");
if (!baseFigure) throw new Error("P01_V3_BASE_FIGURE_MISSING");
baseFigure.bytes = labeledPng("Hình nguồn - P01");
baseFigure.dimensions = { widthPx: 720, heightPx: 220, widthEmu: 3_657_600, heightEmu: 1_117_600 };
baseFigure.caption = "Hình nguồn P01 có nhãn đọc được";
for (let index = 0; index < 3; index += 1) {
  const number = index + 5;
  const figureId = `fig${number - 3}`;
  document.blocks.push({
    id: `b${number}`,
    kind: "PARAGRAPH",
    order: number,
    content: [
      { type: "text", value: `Bài tập ${index + 4}: Tính giá trị biểu thức `, sourceLocation: `word/document.xml#p${number}` },
      { type: "math", math: { sourceType: "LATEX", sourceRaw: `x^${index + 3}+${index + 2}`, latex: `x^${index + 3}+${index + 2}`, normalized: `x^${index + 3}+${index + 2}`, parseStatus: "PARSED", warnings: [], sourceLocation: `word/document.xml#p${number}/r2` }, sourceLocation: `word/document.xml#p${number}/r2` },
      { type: "figure", figureId, sourceLocation: `word/document.xml#p${number}/drawing` },
    ],
    sourceLocation: `word/document.xml#p${number}`,
  });
  document.figures.push({
    id: figureId,
    relationshipId: `rId${number}`,
    mimeType: "image/png",
    bytes: labeledPng(`Hình ${index + 1} - P01`),
    sourceLocation: `word/document.xml#p${number}/drawing`,
    caption: `Hình ${index + 1}: minh họa bài tập P01`,
    semanticRole: "REAL_FIGURE",
    status: "PASS",
    dimensions: { widthPx: 720, heightPx: 220, widthEmu: 3_657_600, heightEmu: 1_117_600 },
  });
}
document.sourceDocument = "p01-recovery-v3-six-exercise-fixture.docx";
document.sourceHash = "p01-recovery-v3-six-exercise-fixture-sha256";
document.provenance = { ...document.provenance!, sourceFile: document.sourceDocument, sourceSha256: document.sourceHash, transformationHistory: ["SYNTHETIC_CONTRACT_FIXTURE_ONLY", "RECOVERY_V3_SIX_EXERCISES"] };

const lesson = buildP01LessonIR(document);
const bundle = renderP01OutputBundle(lesson);
const paths = writeP01OutputBundle(bundle, outputDirectory, "mst-math-p01-v3-six-exercises");
console.log(JSON.stringify({ fixture: "SYNTHETIC_CONTRACT_FIXTURE_ONLY", exerciseCount: 6, expectedPages: 3, paths }, null, 2));
