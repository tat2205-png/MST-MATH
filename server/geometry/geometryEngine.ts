import type { GeometryArtifactResult, GeometrySpec } from "../../src/types/geometrySpec.js";

export interface GeometryEngine {
  readonly name: string;
  render(spec: GeometrySpec, outputDir: string): Promise<GeometryArtifactResult>;
}
