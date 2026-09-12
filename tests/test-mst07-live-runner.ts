import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { runFoundationSmoke, runSemanticAuthoring, validateSemanticAccounting } from "../src/modules/geogebra/live-runner.ts";
import { createCanonicalCommandMap, parseCanonicalBlocks } from "../src/modules/geogebra/authoring-bridge.ts";
import { readFileSync } from "node:fs";
import { GeoGebraSessionTransaction } from "../src/modules/geogebra/session-transaction.ts";
function fake() { let names: string[] = ["original"]; const fp = () => createHash("sha256").update(JSON.stringify({ version: "6", objectCount: names.length, objectNames: names })).digest("hex"); return { readSessionState: async () => ({ version: "6", objectCount: names.length, objectNames: [...names], fingerprint: fp() }), getBase64: async () => "UEsDBA==", setBase64: async () => { names = ["original"]; }, validateRecovery: async () => true, newConstruction: async () => { names = []; }, executeCommand: async (command: string) => { const m = /^(\w+)=/.exec(command); if (m) names.push(m[1]); return true; }, exists: async (label: string) => names.includes(label), readCommandString: async () => "6" }; }
test("INT-01/03/04/05/06/08/09 transactional foundation smoke", async () => { const a = fake(); const r = await runFoundationSmoke(a as any, { title: "x", url: "classic.html", version: "6" }, "artifacts/mst07/session-recovery/int.ggb"); assert.equal(r.after.fingerprint, r.before.fingerprint); assert.equal(r.probeCreated, true); });
test("INT-04/05 forced failure restores original", async () => { const a = fake(); const r = await runFoundationSmoke(a as any, { title: "x", url: "classic.html", version: "6" }, "artifacts/mst07/session-recovery/int-failure.ggb", true); assert.match(r.forcedError ?? "", /MST07_FOUNDATION_FORCED_FAILURE/); assert.equal(r.after.fingerprint, r.before.fingerprint); });
test("RUN/ACC source-driven semantic runner is transactional and exact", async () => {
  const rendererGuard = async () => {};
  const a: any = fake(); const original = a.executeCommand; a.executeCommand = async (command: string) => { const ok = await original(command); const m = /^SetConditionToShowObject\((\w+),(.+)\)$/.exec(command); if (m) a._conditions = { ...(a._conditions ?? {}), [m[1]]: m[2] }; return ok; };
  a.readColor = async () => "#FFFFFF"; a.readFilling = async () => 0.55; a.readLineThickness = async () => 3; a.readObjectXml = async (label: string) => `<condition showObject="${a._conditions?.[label] ?? ""}"/>`;
  a.assertPinnedRenderer = rendererGuard;
  const evidence = await runSemanticAuthoring(a, { title: "x", url: "classic.html", version: "6" }, "goldens/geogebra/fold/rectangular-prism-fold-golden-v1.commands.txt", "artifacts/mst07/session-recovery/semantic-test.ggb");
  assert.equal(evidence.commands_total, 93); assert.equal(evidence.commands_attempted, 93); assert.equal(evidence.semantic_passed, 93); assert.deepEqual(evidence.missing_indices, []); assert.deepEqual(evidence.duplicate_indices, []); assert.equal(evidence.after.fingerprint, evidence.before.fingerprint);
  const ok = (status: any, index: number) => ({ global_index: index, semantic_status: status, block_id: "x", block_index: index, command_family: "Ordinary", exact_text: "x", raw_eval: true });
  const tinyMap: any = [1, 2, 3].map((global_index) => ({ global_index, block_id: "x", block_index: global_index, command_family: "Ordinary", exact_text: "x" }));
  assert.deepEqual(validateSemanticAccounting(tinyMap, [ok("PASS_EVAL", 1), ok("PASS_POSTCONDITION", 2), ok("PASS_EVAL", 3)] as any).passed, 3);
  assert.throws(() => validateSemanticAccounting(tinyMap, [ok("PASS_EVAL", 1), ok("PASS_EVAL", 3)] as any), /ACCOUNTING/);
  const map = createCanonicalCommandMap(parseCanonicalBlocks(readFileSync("goldens/geogebra/fold/rectangular-prism-fold-golden-v1.commands.txt", "utf8")));
  const record = { global_index: 1, block_id: map[0].block_id, block_index: map[0].block_index, command_family: map[0].command_family, exact_text: map[0].exact_text, raw_eval: true, semantic_status: "PASS_EVAL" };
  assert.throws(() => validateSemanticAccounting(map, [{ ...record, exact_text: "substituted" }] as any), /ACCOUNTING/);
});
test("RID-02/03 renderer guard rejects identity changes and still restores", async () => {
  const a: any = fake(); let guardCalls = 0; const tx = new GeoGebraSessionTransaction(a, "artifacts/mst07/session-recovery/renderer-test.ggb", async () => { guardCalls++; if (guardCalls === 2) throw new Error("SESSION_RENDERER_CHANGED"); });
  await assert.rejects(() => tx.run(async session => { await session.executeCommand("renderer_probe=1"); }), /SESSION_RENDERER_CHANGED/); assert.ok(guardCalls >= 2); assert.equal((await a.readSessionState()).objectCount, 1);
});
