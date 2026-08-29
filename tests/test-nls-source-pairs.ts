import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NLS_SOURCE_IDS, serializeNlsSourcePairManifest } from "../src/modules/nls-source-registry/index.js";

const path = resolve("docs/nls/na-math-kntt-source-pairs.manifest.json");
const manifest = JSON.parse(readFileSync(path, "utf8"));
assert.equal(manifest.expectedPairCount, 9);
assert.equal(manifest.pairs.length, 9);
assert.deepEqual(manifest.pairs.map((p: any) => p.canonicalSourceId), [...NLS_SOURCE_IDS]);
assert.equal(new Set(manifest.pairs.map((p: any) => p.canonicalSourceId)).size, 9);
assert.ok(manifest.pairs.every((p: any) => p.pairStatus === "PASS" && p.original.sourceRole === "ORIGINAL_REFERENCE" && p.clean.sourceRole === "CLEAN_CONTENT"));
assert.ok(manifest.pairs.every((p: any) => p.clean.filename.endsWith("-CLEAN.pdf") && p.clean.pageCount > 0 && p.original.pageCount > 0));
assert.ok(manifest.pairs.every((p: any) => p.removedPageCount === p.original.pageCount - p.clean.pageCount));
assert.equal(manifest.pageNumberPolicy, "ORIGINAL_AND_CLEAN_PHYSICAL_PAGES_ARE_DISTINCT");
assert.equal(manifest.oldReviewPacketStatus, "STALE_FOR_CLEAN_CORPUS");
assert.equal(serializeNlsSourcePairManifest(manifest), `${JSON.stringify(manifest, null, 2)}\n`);
console.log("CLEAN_SOURCE_SCHEMA_QA=PASS\nSOURCE_PAIR_UNIQUENESS_QA=PASS\nSOURCE_PAIR_COMPLETENESS_QA=PASS\nSOURCE_PAIR_FILENAME_QA=PASS\nSOURCE_ROLE_QA=PASS\nSTALE_PAGE_MAPPING_PROTECTION_QA=PASS\nMANIFEST_DETERMINISM_QA=PASS");
