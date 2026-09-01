// Dynamic Geometry public compatibility facade.
//
// Canonical implementation:
//   ./construction-engine.ts
//
// Legacy PatternSheet/FOLD implementation:
//   ../pattern-fold/dynamic-geometry-adapter.ts
//
// Existing imports from dynamic-geometry/index remain source-compatible.

export * from "./construction-engine.js";
export * from "./three-adapter.js";

export type {
  DynamicGeometryObjectType,
  DynamicGeometryObject,
  DynamicCommand,
  SelectionContext,
  DynamicGeometryErrorCode,
} from "../pattern-fold/dynamic-geometry-adapter.js";

export {
  nextPointLabel,
  normalizeDynamicGeometry,
  dependencyIndex,
  describeDynamicGeometry,
  validateDependencyGraph,
  createMidpoint,
  createPointOnCircle,
  renameDynamicObject,
  deleteDynamicObject,
  moveDynamicPoint,
  evaluateSelection,
} from "../pattern-fold/dynamic-geometry-adapter.js";
