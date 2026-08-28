# Math IR V1

Math IR is the renderer-neutral, deterministic data contract shared by future import, geometry, folding, QA, and export engines. Its root schema version is `math-ir/v1`; saved data must retain that value so a future migration layer can distinguish V1 from later schemas.

The root `MathDocument` contains sections, problems, scenes, expressions, and asset references. A `MathProblem` records semantic entities, constraints, givens, targets, optional solution steps, source evidence, and scene references. A `MathScene` selects semantic content for a 2D or 3D visual without embedding Manim, TikZ, SVG, Three.js, LuaDraw, or GeoGebra objects.

Entities have stable string IDs. Relationships use IDs and never duplicate or circularly reference objects. Semantic coordinates may be 2D, 3D, or unknown; optional layout coordinates are separate and do not establish mathematical truth.

Constraints cover common 2D and 3D high-school geometry relationships. Each constraint and relation has fact provenance whose origin is `given`, `derived`, `user`, `imported`, `visual`, or `unknown`. Visual or unknown facts are not silently promoted to givens.

`serializeMathIR` validates before producing JSON. `deserializeMathIR` parses and validates without throwing on malformed imported data. `validateMathIR` returns structured issues for schema, identity, reference, numeric, entity, constraint, relation, and scene errors.

```ts
import { createMathDocument, createPoint, validateMathIR } from "./src/modules/math-ir/index.js";

const document = createMathDocument({
  id: "lesson-1",
  title: "Point A",
  sections: [],
  problems: [],
  scenes: [{ id: "scene-1", name: "Point", dimension: "2d", entities: [createPoint("point-A", "A")], constraints: [] }],
  expressions: [],
});

const result = validateMathIR(document);
```

IA-1 defines contracts, validation, serialization, small factories, and fixtures only. Importers, solvers, renderers, folding, collision detection, and format-specific export remain future adapter responsibilities.

MV-0 adds optional, renderer-neutral scene semantics without changing `math-ir/v1`: dependencies, dynamic parameters, typed mathematical events, case states, and status fields on the existing constraint and relation contracts. The dependency graph and update helpers use immutable results and stable lexical ordering. Geometry remains the responsibility of Geometry Engine or another named evaluator; semantic dependencies store only an `evaluatorRef`. Omitting `semantics` preserves the exact V1 shape and keeps previously serialized documents valid.
