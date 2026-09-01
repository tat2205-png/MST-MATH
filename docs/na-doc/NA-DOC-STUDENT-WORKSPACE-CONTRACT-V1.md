# NA-DOC Student Workspace Contract V1

## Purpose

`student-workspace/v1` is a deterministic, renderer-independent document contract for space intentionally provided for student work. It extends the canonical Document Engine at `src/modules/document-engine/` without introducing a new Document IR, planner, renderer, or output-role system.

## Supported types

- `NONE`
- `FREE_RESPONSE_SMALL`, `FREE_RESPONSE_MEDIUM`, `FREE_RESPONSE_LARGE`
- `GRID_SMALL`, `GRID_MEDIUM`, `GRID_LARGE`
- `COORDINATE_2D`
- `DRAWING_AREA`

All dimensions use physical millimetres, never screen pixels. V1 uses deterministic presets: free-response areas are 170 × 30/60/90 mm; grids are 170 × 40/70/100 mm; coordinate space is 160 × 100 mm; drawing space is 170 × 90 mm. `NONE` is exactly 0 × 0 mm.

## Student safety invariants

Every workspace has `solutionContentAllowed=false` and `answerContentAllowed=false`. This remains true when the workspace appears in teacher output: answers and solutions belong to the existing teacher-only export mechanisms, not inside workspace data.

Workspace metadata accepts scalar renderer hints only. It rejects solution graphs or curves, shaded solution regions, solution vertices, answer annotations, and pre-solved auxiliary constructions. Original question content remains in the question/document content model and is not copied into workspace metadata.

## Grid semantics

All V1 grid presets use a 5 mm notebook-style cell. Rows and columns exactly tile their physical dimensions. Small, medium, and large are fixed presets rather than arbitrary vertical whitespace. Renderers may choose their own drawing technology but must preserve these physical semantics.

## Coordinate boundary

`COORDINATE_2D` describes only an empty student coordinate workspace: physical size, `xRange`, `yRange`, positive tick spacing, grid visibility, axes visibility, and number visibility. It contains no graph or geometry payload. Coordinate construction/rendering belongs to future `NA-DOC-04`.

## Student and teacher relationship

Validation accepts the existing `STUDENT` and `TEACHER` audience values as context without defining a parallel role model. Both audiences share the same safe workspace contract. Teacher-only pedagogical content continues through the existing Question Bank answer/solution isolation path.

## Renderer independence and future work

The contract does not render DOCX, LaTeX, PDF, HTML, canvas, or SVG and does not alter the default pipeline. Future `NA-DOC-03` may plan which workspace preset a document needs. Future `NA-DOC-04` may implement coordinate workspace rendering and interaction. Neither planner nor coordinate implementation exists in this task.
