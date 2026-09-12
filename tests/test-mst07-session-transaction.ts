import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { GeoGebraSessionTransaction } from "../src/modules/geogebra/session-transaction.ts";

function fake() { let objects: string[] = ["original"]; const original = ["original"]; const fingerprint = () => createHash("sha256").update(JSON.stringify({ version: "6", objectCount: objects.length, objectNames: objects })).digest("hex"); return { adapter: { readSessionState: async () => ({ version: "6", objectCount: objects.length, objectNames: [...objects], fingerprint: fingerprint() }), getBase64: async () => "UEsDBA==", setBase64: async () => { objects = [...original]; }, validateRecovery: async () => true, newConstruction: async () => { objects = []; }, executeCommand: async () => true } as any }; }

test("TX-03 and TX-04 restore after callback failure", async () => { const f = fake(); const tx = new GeoGebraSessionTransaction(f.adapter, "artifacts/mst07/session-recovery/test.ggb", async () => {}); await assert.rejects(() => tx.run(async () => { f.adapter.newConstruction(); throw new Error("SIMULATED_SERIALIZATION_FAILURE"); }), /SIMULATED_SERIALIZATION_FAILURE/); assert.equal((await f.adapter.readSessionState()).objectNames[0], "original"); });

test("TX-10 reports critical restore failure", async () => { const f = fake(); f.adapter.setBase64 = async () => {}; const tx = new GeoGebraSessionTransaction(f.adapter, "artifacts/mst07/session-recovery/test2.ggb", async () => {}); await assert.rejects(() => tx.run(async () => { throw new Error("boom"); }), /CRITICAL_RESTORE_FAILURE/); });

