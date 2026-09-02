import assert from "node:assert/strict";
import { clearMtefCache, decodeMtefV3Cached, getMtefCacheMetrics } from "../src/modules/document-engine/docx/mtef-cache.js";

const v3 = new Uint8Array([3, 1, 1, 3, 10, 10, 1, 18, 131, 73, 0, 0, 0]);
clearMtefCache();
const a = decodeMtefV3Cached(v3, { oleObjectId: "A" });
const b = decodeMtefV3Cached(v3, { oleObjectId: "B" });
assert.equal(a.normalizedMathMl, b.normalizedMathMl);
assert.equal(a.provenance.oleObjectId, "A");
assert.equal(b.provenance.oleObjectId, "B");
assert.notEqual(a.cacheKey, `MTEF_V5:pimath-mtef-v5-1:${a.semanticPayloadHash}`);
const metrics = getMtefCacheMetrics();
assert.equal(metrics.hitCount, 1);
assert.equal(metrics.parseExecutionCount, 1);
console.log("MTEF_V3_CACHE_QA=PASS");
