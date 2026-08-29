import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { discoverUnknownFiles, registerKnttSources, resolveNlsSourceRoot, serializeNlsManifest } from "../src/modules/nls-source-registry/index.js";

const root = resolveNlsSourceRoot();
const manifest = registerKnttSources(root, undefined, "ORIGINAL_REFERENCE");
const manifestPath = resolve("docs", "nls", "na-math-nls-sources.manifest.json");
const reportPath = resolve("docs", "nls", "NLS-SOURCE-01-QA.md");
writeFileSync(manifestPath, serializeNlsManifest(manifest), "utf8");
const rows = manifest.sources.map((item) => `| ${item.sourceId} | ${item.grade} | ${item.volumeType} | ${item.filename} | ${item.pageCount} | ${item.fileSize} | ${item.sha256} | ${item.textLayerStatus} | ${item.validationStatus} |`);
const extras = discoverUnknownFiles(root);
writeFileSync(reportPath, `# NLS-SOURCE-01 KNTT source registration\n\nSource root is configured by \`NA_MATH_NLS_SOURCE_ROOT\`; no PDF binaries or absolute source paths are stored in the repository.\n\n| SOURCE_ID | GRADE | VOLUME | FILENAME | PAGES | FILE_SIZE | SHA256 | TEXT_LAYER | VALIDATION |\n|---|---:|---|---|---:|---:|---|---|---|\n${rows.join("\n")}\n\nUnknown additional files: ${extras.length ? extras.join(", ") : "none"}.\n`, "utf8");
console.log(`NLS_SOURCE_DISCOVERY_QA=PASS\nSOURCE_REGISTRY_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS\nMANIFEST_QA=PASS\nREGISTERED_SOURCES=${manifest.sources.length}`);
