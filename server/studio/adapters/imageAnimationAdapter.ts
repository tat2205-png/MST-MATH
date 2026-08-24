import type { SceneGraph } from "../../../image-animation/core/scene-graph/index.js";
import type { StudioFeatureFlags } from "../featureFlags.js";
import type { StudioEngine, StudioEngineRequest, StudioEngineResult } from "../contracts.js";
import { ManimStudioAdapter } from "./manimAdapter.js";

export class ImageAnimationStudioAdapter implements StudioEngine {
  readonly id = "studio.image-animation";

  constructor(
    private readonly flags: StudioFeatureFlags,
    private readonly manim = new ManimStudioAdapter(),
  ) {}

  capabilities() {
    const core = this.flags.imageAnimation ? "AVAILABLE" as const : "DISABLED" as const;
    return Object.freeze([
      Object.freeze({ id: "animation.image", status: core, reason: core === "DISABLED" ? "STUDIO_IMAGE_ANIMATION is disabled." : undefined }),
      Object.freeze({ id: "animation.image.segmentation", status: "OPTIONAL_RUNTIME_MISSING" as const, reason: "Segmentation core is available; optional model runtime is missing." }),
      Object.freeze({ id: "animation.depth25d", status: this.flags.depthTwoPointFiveD ? "AVAILABLE" as const : "DISABLED" as const }),
      Object.freeze({ id: "animation.blender", status: "OPTIONAL_RUNTIME_MISSING" as const, reason: "Blender router is available; Blender runtime is missing." }),
      Object.freeze({ id: "animation.generative", status: "OPTIONAL_RUNTIME_MISSING" as const, reason: "Generative router is available; external provider runtime is missing." }),
    ]);
  }

  async execute(request: StudioEngineRequest): Promise<StudioEngineResult> {
    if (request.capability !== "animation.image") {
      return Object.freeze({ status: "DENIED", engineId: this.id, capability: request.capability, error: "Optional image-animation runtime is unavailable or disabled." });
    }
    if (!this.flags.imageAnimation) {
      return Object.freeze({ status: "DENIED", engineId: this.id, capability: request.capability, error: "STUDIO_IMAGE_ANIMATION is disabled." });
    }
    const result = await this.manim.execute({ capability: "animation.manim", input: request.input as SceneGraph });
    return result.status === "COMPLETED"
      ? Object.freeze({ ...result, engineId: this.id, capability: request.capability })
      : Object.freeze({ ...result, engineId: this.id, capability: request.capability });
  }
}
