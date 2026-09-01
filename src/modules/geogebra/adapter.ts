// Compatibility facade.
//
// Generic GeoGebra runtime now lives in ./runtime.ts.
// FOLD-specific V3 implementation lives under pattern-fold/geogebra.
// Existing imports from geogebra/adapter remain source-compatible.

export * from "./runtime.js";

export type {
  CanonicalGgbMap,
  GeoGebraObjectType,
} from "../pattern-fold/geogebra/v3-adapter.js";

export {
  createV3GeoGebraConstruction,
} from "../pattern-fold/geogebra/v3-adapter.js";
