export interface StudioFeatureFlags {
  readonly integrationCanary: boolean;
  readonly imageAnimation: boolean;
  readonly luaDraw: boolean;
  readonly depthTwoPointFiveD: boolean;
  readonly blender: boolean;
  readonly generativeMotion: boolean;
}

function enabled(value: string | undefined): boolean {
  return value === "true";
}

export function readStudioFeatureFlags(environment: NodeJS.ProcessEnv = process.env): StudioFeatureFlags {
  return Object.freeze({
    integrationCanary: enabled(environment.STUDIO_INTEGRATION_CANARY),
    imageAnimation: enabled(environment.STUDIO_IMAGE_ANIMATION),
    luaDraw: enabled(environment.STUDIO_LUADRAW),
    depthTwoPointFiveD: enabled(environment.STUDIO_DEPTH_2_5D),
    blender: enabled(environment.STUDIO_BLENDER),
    generativeMotion: enabled(environment.STUDIO_GENERATIVE_MOTION),
  });
}
