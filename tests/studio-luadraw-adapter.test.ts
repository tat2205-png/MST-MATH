import assert from "node:assert/strict";
import path from "node:path";
import { buildGoldenCubeNet } from "../server/geometry/goldenCube.js";
import type { GeometryEngine } from "../server/geometry/geometryEngine.js";
import { LuaDrawStudioAdapter } from "../server/studio/adapters/luaDrawAdapter.js";

let renders = 0;
const fixtureEngine: GeometryEngine = {
  name: "LUADRAW",
  async render(spec) {
    renders += 1;
    return { engine: "LUADRAW", status: "PASS", sourceFingerprint: spec.sourceFingerprint, pdfPath: "fixture.pdf", svgPath: "fixture.svg" };
  },
};
const disabled = new LuaDrawStudioAdapter(false, fixtureEngine, (_spec, engine) => engine, () => false);
assert.equal((await disabled.capabilities())[0]?.status, "DISABLED");
assert.equal((await disabled.execute({ capability: "geometry.luadraw", input: {} })).status, "DENIED");
assert.equal(renders, 0);

const enabled = new LuaDrawStudioAdapter(true, fixtureEngine, (_spec, engine) => engine, () => true);
const result = await enabled.execute({
  capability: "geometry.luadraw",
  input: { spec: buildGoldenCubeNet(), outputDir: path.resolve("local_bridge", "runs", "studio-luadraw-adapter") },
});
assert.equal(result.status, "COMPLETED");
assert.equal(renders, 1);
const declined = new LuaDrawStudioAdapter(true, fixtureEngine, () => null, () => true);
assert.equal((await declined.execute({ capability: "geometry.luadraw", input: { spec: buildGoldenCubeNet(), outputDir: path.resolve("local_bridge", "runs", "declined") } })).status, "UNAVAILABLE");

console.log("STUDIO_LUADRAW_ADAPTER_QA=PASS");
