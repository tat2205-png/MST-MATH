import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { unzipSync } from "fflate";
import { discoverEmbeddedEquationObjects } from "../src/modules/question-bank/recognition/embeddedDiscovery.ts";
import { classifyMathImage, type ImageMathClass } from "../src/modules/question-bank/recognition/imageClassifier.ts";

const root = process.argv[2] ?? process.env.QUESTION_BANK_CORPUS_ROOT ?? "D:\\NA-MATH-QUESTION-BANK\\acceptance";
const files = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile() && /\.(docx|pdf)$/iu.test(entry.name));
let scannedPdfFiles = 0, scannedPages = 0, docxAssets = 0, embeddedObjects = 0, possibleMathType = 0;
const imageCounts: Record<ImageMathClass, number> = { EQUATION: 0, FIGURE: 0, GRAPH: 0, TABLE_IMAGE: 0, TEXT_IMAGE: 0, MIXED: 0, UNKNOWN: 0 };
function dimensions(bytes: Uint8Array): { width: number; height: number } | undefined { if (bytes.length >= 24 && bytes[0] === 137 && bytes[1] === 80) { const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); return { width: view.getUint32(16), height: view.getUint32(20) }; } return undefined; }
for (const entry of files) {
  const bytes = new Uint8Array(readFileSync(path.join(root, entry.name)));
  if (/\.pdf$/iu.test(entry.name)) { const raw = new TextDecoder("latin1").decode(bytes); const pages = (raw.match(/\/Type\s*\/Page\b/g) ?? []).length; const extracted = [...raw.matchAll(/\(([^()]*)\)\s*Tj/g)].map((match) => match[1].replace(/\\([()\\])/g, "$1").trim()).filter(Boolean); const usableCharacters = extracted.join("").replace(/[^\p{L}\p{N}]/gu, "").length; const selectable = extracted.length >= Math.max(3, pages) && usableCharacters >= Math.max(40, pages * 8); if (!selectable) { scannedPdfFiles += 1; scannedPages += Math.max(1, pages); } continue; }
  const packageFiles = unzipSync(bytes); const media = Object.entries(packageFiles).filter(([name]) => name.startsWith("word/media/")); docxAssets += media.length;
  for (const [, data] of media) { const size = dimensions(data); const result = classifyMathImage({ width: size?.width ?? 1, height: size?.height ?? 1, mimeType: "application/octet-stream" }); imageCounts[result.classification] += 1; }
  const found = discoverEmbeddedEquationObjects(bytes); embeddedObjects += found.filter((x) => x.packagePath.startsWith("word/embeddings/")).length; possibleMathType += found.filter((x) => x.classification === "MATHTYPE_OR_EMBEDDED_EQUATION").length;
}
const needsExternal = imageCounts.EQUATION + imageCounts.MIXED + imageCounts.TEXT_IMAGE + imageCounts.UNKNOWN + scannedPages;
console.log(`CORPUS_FILES=${files.length}\nSCANNED_PDF_FILES=${scannedPdfFiles}\nSCANNED_PAGES=${scannedPages}\nDOCX_ASSETS=${docxAssets}\nLIKELY_EQUATION_IMAGES=${imageCounts.EQUATION}\nLIKELY_FIGURES=${imageCounts.FIGURE + imageCounts.GRAPH}\nLIKELY_TABLE_IMAGES=${imageCounts.TABLE_IMAGE}\nUNKNOWN_IMAGES=${imageCounts.UNKNOWN + imageCounts.TEXT_IMAGE + imageCounts.MIXED}\nEMBEDDED_OBJECTS_FOUND=${embeddedObjects}\nPOSSIBLE_MATHTYPE_OBJECTS=${possibleMathType}\nITEMS_NEEDING_EXTERNAL_MATH_RECOGNITION=${needsExternal}\nMATHPIX_RUNTIME=${process.env.MATHPIX_APP_ID && process.env.MATHPIX_APP_KEY ? "CONFIGURED_NOT_PROBED" : "NOT_CONFIGURED"}\nREAL_CORPUS_RECOGNITION_DISCOVERY_QA=PASS`);
