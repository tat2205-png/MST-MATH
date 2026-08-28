import assert from "node:assert/strict";
import { createSceneGraph } from "../image-animation/core/scene-graph/index.js";
import { ImageAnimationStudioAdapter } from "../server/studio/adapters/imageAnimationAdapter.js";

const disabled = new ImageAnimationStudioAdapter({
  integrationCanary: false,
  imageAnimation: false,
  luaDraw: false,
  depthTwoPointFiveD: false,
  blender: false,
  generativeMotion: false,
});
const disabledCapabilities = await disabled.capabilities();
assert.equal(disabledCapabilities.find((item) => item.id === "animation.image")?.status, "DISABLED");
assert.equal(disabledCapabilities.find((item) => item.id === "animation.image.segmentation")?.status, "OPTIONAL_RUNTIME_MISSING");
assert.equal(disabledCapabilities.find((item) => item.id === "animation.blender")?.status, "OPTIONAL_RUNTIME_MISSING");
assert.equal((await disabled.execute({ capability: "animation.image", input: createSceneGraph([]) })).status, "DENIED");

const enabled = new ImageAnimationStudioAdapter({
  integrationCanary: true,
  imageAnimation: true,
  luaDraw: false,
  depthTwoPointFiveD: true,
  blender: false,
  generativeMotion: false,
});
const graph = createSceneGraph([{
  identity: { id: "circle" },
  geometry: { kind: "circle", center: { x: 0, y: 0 }, radius: 1 },
  style: {},
  placement: { layer: 1, order: 0 },
  relations: {},
  metadata: { geometryLocked: true },
}]);
const result = await enabled.execute({ capability: "animation.image", input: graph });
assert.equal(result.status, "COMPLETED");
if (result.status !== "COMPLETED") throw new Error("Image Animation Studio adapter did not complete.");
assert.match(JSON.stringify(result.output), /StudioIntegrationCanary/);

console.log("STUDIO_IMAGE_ANIMATION_ADAPTER_QA=PASS");
