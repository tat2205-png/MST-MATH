import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCanvas, loadImage } from "canvas";
import { unzipSync } from "fflate";
import { parseDocx } from "../src/modules/question-bank/document.ts";
import { ingestDocxQuestionsForRuntime } from "../src/modules/question-bank/pipeline.ts";
import { inspectVmlElements, isValidPng } from "../src/modules/question-bank/wmf.ts";

const sourcePath = process.env.MAS_REAL_DOCX_SOURCE;
if (!sourcePath) throw new Error("MAS_REAL_DOCX_SOURCE is required for Q37 VML real-source QA");
const bytes = new Uint8Array(readFileSync(sourcePath));
const raw = parseDocx(bytes, sourcePath, { canonicalVml: true });
const runtime = await ingestDocxQuestionsForRuntime(bytes, sourcePath);
const question = runtime.questions.find((item) => item.index === 37);
assert.ok(question);
const sourceLocations = new Set(question.source.sourceLocations);
const groups = raw.figures.filter((figure) => figure.componentIds?.length && sourceLocations.has(figure.sourceLocation));
assert.equal(groups.length, 2);
assert.ok(groups.every((group) => !/<v:group\b/i.test(group.vmlGroupXml ?? "")), "Q37 groups are siblings, not nested coordinate systems");

const groupXml = groups.map((group) => group.vmlGroupXml ?? "");
const literalCount = (pattern: RegExp) => groupXml.reduce((total, xml) => total + [...xml.matchAll(pattern)].length, 0);
assert.equal(literalCount(/<v:shape\b/gi), 74);
assert.equal(literalCount(/<v:line\b/gi), 0);
assert.equal(literalCount(/<v:imagedata\b/gi), 44);
assert.equal(literalCount(/<v:textbox\b/gi), 0);
assert.equal(groupXml.reduce((total, xml) => total + inspectVmlElements(xml).length, 0), 116);

const componentIds = new Set(groups.flatMap((group) => group.componentIds ?? []));
assert.equal(componentIds.size, 27);
const derived = runtime.document.figures.filter((figure) => componentIds.has(figure.id));
assert.equal(derived.length, 27);
assert.ok(derived.every((figure) => figure.derivation?.status === "DERIVED" && isValidPng(figure.bytes)));
let visibleComponentCount = 0;
for (const component of derived) {
  const image = await loadImage(Buffer.from(component.bytes!));
  assert.ok(image.width > 0 && image.height > 0);
  const canvas = createCanvas(image.width, image.height), context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, image.width, image.height).data;
  if (Array.from({ length: pixels.length / 4 }, (_, index) => index * 4).some((offset) => pixels[offset + 3] > 0 && (pixels[offset] < 250 || pixels[offset + 1] < 250 || pixels[offset + 2] < 250))) visibleComponentCount++;
}
assert.equal(visibleComponentCount, 20, "The immutable source has 20 ink-bearing WMFs and 7 transparent placeholders; native VML supplies the remaining geometry");

const confirmed = question.figureAssociations.filter((association) => association.questionId === question.id && association.status === "CONFIRMED");
assert.equal(confirmed.length, 1);
const composite = question.figures.find((figure) => figure.id === confirmed[0].figureId);
assert.ok(composite?.componentIds?.length === 26 && isValidPng(composite.bytes));
assert.equal(question.warnings.filter((warning) => warning === "OVERLAPPING_VML_GROUP_DEDUPLICATED").length, 1);
const compositeImage = await loadImage(Buffer.from(composite.bytes!));
assert.equal(compositeImage.width, composite.dimensions?.widthPx);
assert.equal(compositeImage.height, composite.dimensions?.heightPx);
const compositeCanvas = createCanvas(compositeImage.width, compositeImage.height), compositeContext = compositeCanvas.getContext("2d");
compositeContext.drawImage(compositeImage, 0, 0);
const compositePixels = compositeContext.getImageData(0, 0, compositeImage.width, compositeImage.height).data;
const visible = Array.from({ length: compositePixels.length / 4 }, (_, index) => index * 4).filter((offset) => compositePixels[offset] < 250 || compositePixels[offset + 1] < 250 || compositePixels[offset + 2] < 250);
assert.ok(visible.length > 1_000);

console.log("Q37_SOURCE_VML_STRUCTURE_QA=PASS");
console.log("Q37_COMPONENT_CONVERSION_QA=PASS");
console.log("Q37_COMPOSITE_BOUNDS_QA=PASS");
console.log("Q37_NO_COMPONENT_CLIPPING_QA=PASS");
console.log("Q37_COMPOSITE_STRUCTURE_QA=PASS");
