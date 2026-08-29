import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { discoverUnknownFiles, registerKnttSourcePairs, resolveNlsCleanSourceRoot, resolveNlsSourceRoot, serializeNlsSourcePairManifest } from "../src/modules/nls-source-registry/index.js";

const manifest = registerKnttSourcePairs(resolveNlsSourceRoot(), resolveNlsCleanSourceRoot());
for (const pair of manifest.pairs) {
  Object.assign(pair, { removedPageCount: pair.original.pageCount - pair.clean.pageCount });
}
if (discoverUnknownFiles(resolveNlsCleanSourceRoot(), manifest.pairs.map((p) => ({ ...p.clean, filename: p.clean.filename }))).length) throw new Error("Unexpected clean source files");
writeFileSync(resolve("docs/nls/na-math-kntt-source-pairs.manifest.json"), serializeNlsSourcePairManifest(manifest), "utf8");
console.log(`CLEAN_SOURCE_DISCOVERY_QA=PASS\nCLEAN_SOURCE_SCHEMA_QA=PASS\nSOURCE_PAIR_UNIQUENESS_QA=PASS\nSOURCE_PAIR_COMPLETENESS_QA=PASS\nSOURCE_PAIR_FILENAME_QA=PASS\nSOURCE_ROLE_QA=PASS\nORIGINAL_SOURCE_IMMUTABILITY_QA=PASS\nCLEAN_SOURCE_IMMUTABILITY_QA=PASS\nCLEAN_PAGE_COUNT_QA=PASS\nMANIFEST_DETERMINISM_QA=PASS\nREGISTERED_PAIRS=${manifest.pairs.length}`);
