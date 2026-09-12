import assert from "node:assert/strict";
import { test } from "node:test";
import * as bridge from "../src/modules/geogebra/authoring-bridge.ts";

test("PATH-01/02 bridge exports pure capabilities only", () => {
  assert.equal("executeCanonicalBlocks" in bridge, false);
  assert.equal("runAuthoringBridge" in bridge, false);
  assert.equal("exportCandidateGgb" in bridge, false);
});

test("PATH-09 pure parsing and accounting map remain available", () => {
  const blocks = bridge.parseCanonicalBlocks("[A]\nSetLineThickness(H01guide,3)\n");
  assert.deepEqual(bridge.createCanonicalCommandMap(blocks), [{ global_index: 1, block_id: "A", block_index: 1, command_family: "SetLineThickness", exact_text: "SetLineThickness(H01guide,3)" }]);
});
