import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { adaptGeometryArtifactToDocxFigure, renderDocumentToDocx } from "../src/modules/document-export/docx/index.ts";
import type { DocumentIR } from "../src/modules/question-bank/types.ts";

const directory = mkdtempSync(join(tmpdir(), "docx-1d-"));
try {
  const svgPath = join(directory, "geometry.svg");
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><path d="M20 300 L300 20 L580 300 Z" fill="none" stroke="#18212B"/><path d="M300 20 L300 300" stroke="#18212B" stroke-dasharray="8 6"/><text x="300" y="18">S</text><text x="305" y="315">H</text><path d="M300 285 h15 v15" fill="none" stroke="#18212B"/></svg>';
  writeFileSync(svgPath, svg);
  const adapted = await adaptGeometryArtifactToDocxFigure({ artifact: { engine: "LUADRAW", status: "PASS", svgPath, sourceFingerprint: "verified" }, figureId: "geometry-approved", profileId: "PYRAMID_ALTITUDE_VERTICAL_IF_PROVEN", title: "Hình chóp có đường cao đã xác minh", altText: "Hình có nhãn, nét đứt và dấu vuông", widthEmu: 4_572_000, heightEmu: 3_048_000, semanticFlags: ["VERIFIED_RIGHT_ANGLE"] });
  const document: DocumentIR = { sourceDocument: "geometry.docx", sourceHash: "geometry", figures: [adapted.figure], warnings: [], blocks: [
    { id: "figure", kind: "PARAGRAPH", order: 0, content: [{ type: "figure", figureId: adapted.figure.id }], sourceLocation: "test:figure" },
    { id: "caption", kind: "PARAGRAPH", order: 1, style: "NAFigureCaption", content: [{ type: "text", value: "Hình 1. Hình học xác định" }], sourceLocation: "test:caption" },
  ] };
  const result = renderDocumentToDocx(document, { figureMetadata: { [adapted.figure.id]: adapted.metadata } });
  const parts = unzipSync(result.bytes);
  const xml = new TextDecoder().decode(parts["word/document.xml"]);
  const rels = new TextDecoder().decode(parts["word/_rels/document.xml.rels"]);
  assert.deepEqual(parts["word/media/figure-1.svg"], new TextEncoder().encode(svg));
  assert.match(xml, /<wp:inline/); assert.doesNotMatch(xml, /<wp:anchor/);
  assert.match(xml, /cx="4572000" cy="3048000"/);
  assert.match(xml, /Profile: PYRAMID_ALTITUDE_VERTICAL_IF_PROVEN/);
  assert.match(rels, /Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/image" Target="media\/figure-1\.svg"/);
  assert.ok(result.warnings.includes("WORD_SVG_RUNTIME_COMPATIBILITY_NOT_VERIFIED"));
  await assert.rejects(() => adaptGeometryArtifactToDocxFigure({ artifact: { engine: "LUADRAW", status: "PASS", svgPath, sourceFingerprint: "x" }, figureId: "bad", profileId: "NEW_PROFILE" }), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GEOMETRY_PROFILE_REVIEW_REQUIRED");
  console.log("SVG_PACKAGE_QA=PASS\nSVG_RELATIONSHIP_QA=PASS\nFIGURE_DIMENSION_QA=PASS\nASPECT_RATIO_QA=PASS\nINLINE_FIGURE_QA=PASS\nGEOMETRY_PROFILE_IDENTITY_QA=PASS\nGEOMETRY_VISIBILITY_QA=PASS\nSVG_DOCX_QA=PASS\nGEOMETRY_DOCX_QA=PASS");
} finally { rmSync(directory, { recursive: true, force: true }); }
