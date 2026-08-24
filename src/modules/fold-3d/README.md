# Fold / Unfold 3D Engine V1

This module is the deterministic folding layer between the canonical Math IR / Geometry Engine and presentation adapters. It does not contain React or renderer objects.

## Pipeline

`MathScene solid -> Geometry Engine validation -> FoldTopology -> NetLayout -> FoldState -> FoldScene -> renderer boundary`

`FoldTopology` references canonical Math IR entity IDs while recording ordered face loops, normals, edge incidence, and face adjacency. A `NetLayout` contains one deterministic planar placement and an acyclic, rooted hinge spanning tree. `computeFoldState(net, progress)` composes rigid child transforms as `parent transform × rotation about shared edge`; progress is validated in the closed interval `[0, 1]`. The root face remains fixed.

Supported solids are cube, rectangular prism, triangular prism, tetrahedron, square pyramid, and generic convex n-gonal prisms/pyramids for `3 <= baseSides <= 10`. Generic bases may be regular visual-only polygons or ordered explicit convex source polygons. Supplied dimensions are retained; canonical defaults are marked `visual_only`. Each solid has one canonical full net. `generateRouteStrip` unfolds a caller-provided sequence of adjacent faces without performing shortest-path selection. Arbitrary or concave polyhedra, exhaustive net enumeration, curved surfaces, collision physics, and self-intersection simulation are not supported.

Validation fails closed for malformed topology, non-manifold edges, invalid faces or hinges, disconnected/cyclic fold trees, overlapping canonical net interiors, unsafe/non-finite coordinates, invalid progress, and invalid transforms.

The Three.js and Manim functions are explicit adapter boundaries. Three.js is not installed, so the boundary returns `PARTIAL` with `UNAVAILABLE_RENDERER`; no mathematical behavior is moved into a renderer. Planar net output is directly available as deterministic SVG or TikZ.

## Cube example

```ts
import { FOLD_FIXTURES, createFoldScene, updateFoldScene } from "./index.js";

const flat = createFoldScene(FOLD_FIXTURES.cube, 0);
if (flat.value) {
  const halfway = updateFoldScene(flat.value, 0.5);
  const folded = updateFoldScene(flat.value, 1);
}
```

Face, edge, and vertex correspondence IDs remain stable at every progress value.
