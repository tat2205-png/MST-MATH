export interface VisualPedagogyGoldenCase { id: string; category: "algebra" | "inequality" | "proof" | "geometry" | "graph" | "solid" | "fold" | "document" | "video"; sourceFixture: string; expectedRelations: string[]; target: string }

export const VISUAL_PEDAGOGY_GOLDEN_CORPUS: readonly VisualPedagogyGoldenCase[] = Object.freeze([
  { id: "quotient-derivative", category: "algebra", sourceFixture: "Differentiate an original minimal quotient.", expectedRelations: ["rewrite"], target: "document" },
  { id: "exponential-base-conversion", category: "algebra", sourceFixture: "Solve an original base-conversion equation.", expectedRelations: ["base_conversion"], target: "video" },
  { id: "cauchy-two-variable", category: "inequality", sourceFixture: "Prove a minimal two-variable Cauchy case.", expectedRelations: ["comparison"], target: "document" },
  { id: "olympiad-proof", category: "proof", sourceFixture: "An original three-step divisibility proof.", expectedRelations: ["derivation"], target: "document" },
  { id: "external-circle-tangents", category: "geometry", sourceFixture: "Circle A with external point B and derived tangencies C,D.", expectedRelations: ["tangent", "perpendicular", "equal_length"], target: "svg+tikz" },
  { id: "coordinate-parabola", category: "graph", sourceFixture: "A verified parabola with explicit viewport.", expectedRelations: ["incidence"], target: "svg" },
  { id: "triangular-prism", category: "solid", sourceFixture: "A source-defined triangular prism.", expectedRelations: ["parallel"], target: "threejs" },
  { id: "cube-net", category: "fold", sourceFixture: "An original six-face cube net.", expectedRelations: ["topology"], target: "fold" },
  { id: "worksheet-page", category: "document", sourceFixture: "An original student worksheet page.", expectedRelations: ["visibility"], target: "docx" },
  { id: "vertical-scene", category: "video", sourceFixture: "An original 1080x1920 algebra explanation.", expectedRelations: ["continuity", "safe_area"], target: "manim" },
]);
