import assert from "node:assert/strict";
import { EngineRegistry } from "../server/studio/engineRegistry.js";
import type { StudioEngine } from "../server/studio/contracts.js";

let loads = 0;
const registry = new EngineRegistry();
registry.register("studio.fixture-b", async (): Promise<StudioEngine> => {
  loads += 1;
  return {
    id: "studio.fixture-b",
    capabilities: () => [{ id: "fixture.secondary", status: "AVAILABLE" }],
    execute: async (request) => ({ status: "COMPLETED", engineId: "studio.fixture-b", capability: request.capability, output: "secondary" }),
  };
});
registry.register("studio.fixture-a", async (): Promise<StudioEngine> => {
  loads += 1;
  return {
    id: "studio.fixture-a",
    capabilities: () => [{ id: "fixture.primary", status: "AVAILABLE" }],
    execute: async (request) => ({ status: "COMPLETED", engineId: "studio.fixture-a", capability: request.capability, output: "primary" }),
  };
});

assert.deepEqual(registry.engineIds(), ["studio.fixture-a", "studio.fixture-b"]);
assert.equal(loads, 0, "registration must not eagerly load engines");
const status = await registry.capabilityStatus();
assert.deepEqual(status.map((item) => `${item.id}:${item.engineId}`), [
  "fixture.primary:studio.fixture-a",
  "fixture.secondary:studio.fixture-b",
]);
assert.equal(loads, 2);
assert.equal((await registry.execute({ capability: "fixture.primary", input: null })).status, "COMPLETED");
assert.equal(loads, 2, "loaded engine instances must be reused");
assert.equal((await registry.execute({ capability: "missing", input: null })).status, "UNAVAILABLE");
assert.throws(() => registry.register("studio.fixture-a", () => Promise.reject(new Error("unused"))), /Duplicate/);

console.log("STUDIO_ENGINE_REGISTRY_QA=PASS");
