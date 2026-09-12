import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { clearMtefCache, decodeMtefV5Cached, getMtefCacheMetrics } from "../src/modules/document-engine/docx/mtef-cache.js";
clearMtefCache();
const payload=readFileSync("tests/fixtures/mathtype-mtef-v5/G01.bin");
const a=decodeMtefV5Cached(payload,{oleObjectId:"ole-A",sourceDocumentId:"doc-A",sourceAnchor:"a"});
const b=decodeMtefV5Cached(payload,{oleObjectId:"ole-B",sourceDocumentId:"doc-B",sourceAnchor:"b"});
assert.equal(a.normalizedMathMl,b.normalizedMathMl);assert.equal(a.provenance.oleObjectId,"ole-A");assert.equal(b.provenance.oleObjectId,"ole-B");assert.equal(getMtefCacheMetrics().parseExecutionCount,1);assert.equal(getMtefCacheMetrics().missCount,1);assert.equal(getMtefCacheMetrics().hitCount,1);
const before=b.normalizedMathMl; (a.mathMlNode as any).children=[]; assert.equal(b.normalizedMathMl,before); assert.equal(getMtefCacheMetrics().entryCount,1); console.log("MTEF_CACHE_QA=PASS");
