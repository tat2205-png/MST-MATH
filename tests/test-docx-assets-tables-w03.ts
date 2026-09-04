import assert from "node:assert/strict";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.ts";

const image = ingestDocx({ name: "image.docx", bytes: DOCX_FIXTURES.image });
assert.equal(image.diagnostics.sourceAssetCount, 1);
assert.equal(image.diagnostics.extractedAssetCount, 1);
assert.equal(image.diagnostics.documentIrAssetCount, 1);
assert.equal(image.assetLedger.assets[0]?.kind, "IMAGE");
assert.ok(image.assetLedger.assets[0]?.relationshipId);
assert.ok(image.assetLedger.assets[0]?.sha256 === undefined || image.assetLedger.assets[0]?.sha256.length === 64);
const table = ingestDocx({ name: "table.docx", bytes: DOCX_FIXTURES.table });
assert.equal(table.diagnostics.tableCount, 1);
assert.ok(table.document?.blocks.some(block => block.kind === "TABLE"));
assert.ok(table.assetLedger.assets.some(asset => asset.kind === "TABLE" && asset.sourceAnchor.tableIndex === 0));
assert.equal(table.diagnostics.documentIrAssetCount, table.diagnostics.extractedAssetCount);
console.log("w03-word-assets-tables: PASS");
