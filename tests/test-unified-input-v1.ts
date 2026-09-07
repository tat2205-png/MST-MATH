import assert from "node:assert/strict";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.js";
import { ingestUnifiedSource, type StemRecognitionProvider } from "../src/modules/document-ingest/unified.js";
import { createMathpixRecognizerFromEnv } from "../src/modules/document-ingest/mathpix-provider.js";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
const pdf = new Uint8Array(Buffer.from("%PDF-1.4\n% semantic mock\n", "ascii"));

const mockRecognizer: StemRecognitionProvider = {
  id: "MOCK_STEM",
  async recognize(source) {
    return {
      provider: "MOCK_STEM",
      regions: [
        { id: "r-text", kind: "text", order: 0, sourceLocation: `${source.name}:0`, text: "Cho hàm số" },
        { id: "r-math", kind: "math", order: 1, sourceLocation: `${source.name}:1`, latex: "f(x)=x^2+1", confidence: 0.99 },
        {
          id: "r-figure",
          kind: "figure",
          order: 2,
          sourceLocation: `${source.name}:2`,
          confidence: 0.98,
          figure: {
            relationshipId: "mock-figure",
            mediaPath: "recognized/mock.png",
            mimeType: "image/png",
            bytes: png,
            semanticRole: "REAL_FIGURE",
          },
        },
      ],
    };
  },
};

const nativeWord = await ingestUnifiedSource({ name: "native.docx", bytes: DOCX_FIXTURES.inlineEquation });
assert.equal(nativeWord.status, "PASS");
assert.equal(nativeWord.kind, "WORD");
assert.equal(nativeWord.classification.math, 1);
assert.equal(nativeWord.document?.blocks[0].content.some((b) => b.type === "math" && b.math.sourceType === "OMML"), true);

const wordMixedRaster = await ingestUnifiedSource({ name: "figure.docx", bytes: DOCX_FIXTURES.image }, { recognizer: mockRecognizer });
assert.equal(wordMixedRaster.status, "PASS");
assert.deepEqual(wordMixedRaster.classification, { text: 2, math: 1, figure: 1, table: 0 });
assert.equal(wordMixedRaster.document?.figures.length, 1);
assert.equal(wordMixedRaster.document?.figures[0].semanticRole, "REAL_FIGURE");
assert.equal(wordMixedRaster.evidence?.length, 3);

const wordFigureNoRecognizer = await ingestUnifiedSource({ name: "figure.docx", bytes: DOCX_FIXTURES.image });
assert.equal(wordFigureNoRecognizer.status, "REVIEW_REQUIRED");
assert.equal(wordFigureNoRecognizer.classification.figure, 1);
assert.equal(wordFigureNoRecognizer.diagnostics.some((d) => d.code === "WORD_RASTER_ASSET_CLASSIFICATION_SKIPPED"), true);

const badLegacy = await ingestUnifiedSource({ name: "legacy.docx", bytes: DOCX_FIXTURES.legacyMathType });
assert.equal(badLegacy.status, "REVIEW_REQUIRED");
assert.equal(badLegacy.diagnostics.some((d) => d.code === "MATHTYPE_MTEF_DECODE_FAILED" || d.code === "LEGACY_MATHTYPE_UNRESOLVED"), true);

const recognizedPdf = await ingestUnifiedSource({ name: "exam.pdf", bytes: pdf, mimeType: "application/pdf" }, { recognizer: mockRecognizer });
assert.equal(recognizedPdf.status, "PASS");
assert.deepEqual(recognizedPdf.classification, { text: 1, math: 1, figure: 1, table: 0 });
assert.equal(recognizedPdf.document?.figures[0].semanticRole, "REAL_FIGURE");
assert.equal(recognizedPdf.evidence?.length, 3);

const recognizedImage = await ingestUnifiedSource({ name: "page.png", bytes: png, mimeType: "image/png" }, { recognizer: mockRecognizer });
assert.equal(recognizedImage.status, "PASS");
assert.equal(recognizedImage.classification.math, 1);
assert.equal(recognizedImage.classification.figure, 1);

const noRecognizer = await ingestUnifiedSource({ name: "page.png", bytes: png, mimeType: "image/png" });
assert.equal(noRecognizer.status, "FAIL");
assert.equal(noRecognizer.diagnostics[0].code, "SEMANTIC_RECOGNIZER_REQUIRED");

const lowConfidenceRecognizer: StemRecognitionProvider = {
  id: "LOW_CONFIDENCE",
  async recognize(source) {
    return { provider: "LOW_CONFIDENCE", regions: [{ id: "m", kind: "math", order: 0, sourceLocation: source.name, latex: "x=1", confidence: 0.40 }] };
  },
};
const lowConfidence = await ingestUnifiedSource({ name: "page.png", bytes: png }, { recognizer: lowConfidenceRecognizer });
assert.equal(lowConfidence.status, "REVIEW_REQUIRED");
assert.equal(lowConfidence.diagnostics.some((d) => d.code === "LOW_RECOGNITION_CONFIDENCE"), true);

assert.equal(createMathpixRecognizerFromEnv({}), undefined);

console.log("UNIFIED_INPUT_WORD_OMML=PASS");
console.log("UNIFIED_INPUT_WORD_MIXED_RASTER_DECOMPOSITION=PASS");
console.log("UNIFIED_INPUT_WORD_RASTER_FAIL_CLOSED=PASS");
console.log("UNIFIED_INPUT_MATHTYPE_FAIL_CLOSED=PASS");
console.log("UNIFIED_INPUT_PDF_SEMANTIC=PASS");
console.log("UNIFIED_INPUT_IMAGE_SEMANTIC=PASS");
console.log("UNIFIED_INPUT_LOW_CONFIDENCE_GATE=PASS");
console.log("UNIFIED_INPUT_NO_SILENT_CLOUD_UPLOAD=PASS");
