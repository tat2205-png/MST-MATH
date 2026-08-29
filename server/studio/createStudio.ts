import { EngineRegistry } from "./engineRegistry.js";
import { readStudioFeatureFlags, type StudioFeatureFlags } from "./featureFlags.js";
import { StudioOrchestrator } from "./studioOrchestrator.js";

export function createStudio(flags: StudioFeatureFlags = readStudioFeatureFlags()): StudioOrchestrator {
  const registry = new EngineRegistry();
  registry.register("studio.image-animation", async () => {
    const { ImageAnimationStudioAdapter } = await import("./adapters/imageAnimationAdapter.js");
    return new ImageAnimationStudioAdapter(flags);
  });
  registry.register("studio.luadraw", async () => {
    const { LuaDrawStudioAdapter } = await import("./adapters/luaDrawAdapter.js");
    return new LuaDrawStudioAdapter(flags.luaDraw);
  });
  registry.register("studio.manim", async () => {
    const { ManimStudioAdapter } = await import("./adapters/manimAdapter.js");
    return new ManimStudioAdapter();
  });
  return new StudioOrchestrator(registry, flags);
}
