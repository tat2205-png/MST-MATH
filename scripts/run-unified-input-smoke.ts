import { readFileSync } from "node:fs";
import path from "node:path";
import { ingestUnifiedSource } from "../src/modules/document-ingest/unified.js";
import { createMathpixRecognizerFromEnv } from "../src/modules/document-ingest/mathpix-provider.js";

function mimeFor(filename: string): string | undefined {
  switch (path.extname(filename).toLowerCase()) {
    case ".docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".pdf": return "application/pdf";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    default: return undefined;
  }
}

const input = process.argv[2];
if (!input) {
  console.error("USAGE=node --import tsx scripts/run-unified-input-smoke.ts <file.docx|file.pdf|file.png|file.jpg>");
  process.exit(64);
}

const bytes = new Uint8Array(readFileSync(input));
const recognizer = createMathpixRecognizerFromEnv();
const result = await ingestUnifiedSource({ name: path.basename(input), bytes, mimeType: mimeFor(input) }, { recognizer });

console.log("============================================================");
console.log("MST_MATH_UNIFIED_INPUT_SMOKE");
console.log(`SOURCE=${path.resolve(input)}`);
console.log(`STATUS=${result.status}`);
console.log(`KIND=${result.kind ?? "UNKNOWN"}`);
console.log(`PROVIDER=${result.provider ?? "NONE"}`);
console.log(`TEXT=${result.classification.text}`);
console.log(`MATH=${result.classification.math}`);
console.log(`FIGURE=${result.classification.figure}`);
console.log(`TABLE=${result.classification.table}`);
console.log(`DIAGNOSTIC_COUNT=${result.diagnostics.length}`);
for (const diagnostic of result.diagnostics) {
  console.log(`${diagnostic.severity.toUpperCase()} ${diagnostic.code}${diagnostic.sourceLocation ? ` @ ${diagnostic.sourceLocation}` : ""}: ${diagnostic.message}`);
}
console.log("============================================================");

if (result.status === "FAIL") process.exit(2);
if (result.status === "REVIEW_REQUIRED") process.exit(1);
process.exit(0);
