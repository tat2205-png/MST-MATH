# Geometry Engine V1

Geometry Engine V1 applies one deterministic pipeline: `MathScene → validation/reference resolution → normalized runtime scene → capability router → renderer adapter`. Math IR remains the only semantic source of truth. The normalized scene holds resolved ID references, classification, renderer hints, hidden-edge IDs, and render coordinates derived from semantic/layout coordinates or explicitly marked `visual_only` candidates.

Validation rejects duplicate or missing IDs, wrong point references, zero-length segments, invalid polygons/circles/planes/solids, dimension conflicts, non-finite coordinates, missing graph expressions, and unsafe IDs/labels. It never creates missing geometry or derives constraints from appearance.

The capability matrix describes actual IA-3 status. SVG and TikZ provide dependency-free deterministic 2D baselines. LuaDraw maps compatible MathScene data into the existing server-side `GeometrySpec` and existing LuaDraw runtime. Manim routes to the existing video pipeline contract. Three.js and GeoGebra are unavailable capability contracts only; no runtime or dependency is bundled.

```ts
const normalized = normalizeGeometryScene(scene);
const route = normalized.scene && selectGeometryRenderer(normalized.scene, { target: "svg" });
const result = renderGeometry(scene, { target: "svg" });
```

IA-3 does not solve constraints, calculate folding/nets, sample functions, infer geometry from images, execute arbitrary renderer payloads, or implement full collision/label layout.
