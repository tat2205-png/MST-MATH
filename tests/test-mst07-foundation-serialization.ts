import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSessionState, normalizeApiError, assertJsonSafe } from "../src/modules/geogebra/runtime-adapter.ts";

test("SER-01 names are normalized to plain strings", () => {
  const foreign = { 0: { toString: () => "A" }, 1: { toString: () => "B" }, length: 2 };
  const state = normalizeSessionState({ version: 1, objectCount: 2, objectNames: foreign });
  assert.deepEqual(state.objectNames, ["A", "B"]); assert.equal(typeof state.fingerprint, "string");
});

test("SER-02 through SER-07 produce scalar DTOs", () => {
  const state = normalizeSessionState({ version: "6", objectCount: "2", objectNames: ["A", "B"] });
  assert.equal(typeof state.version, "string"); assert.equal(typeof state.objectCount, "number");
  assert.ok(Array.isArray(state.objectNames)); assert.equal(state.objectNames[0], "A"); assertJsonSafe(state);
});

test("SER-08 browser errors are bounded", () => assert.deepEqual(normalizeApiError({ name: "Error", message: "boom", stack: "secret" }), { name: "Error", message: "boom" }));

test("SER-10 cyclic foreign values are rejected", () => { const x: any = {}; x.self = x; assert.throws(() => assertJsonSafe(x), /not JSON-safe/); });
