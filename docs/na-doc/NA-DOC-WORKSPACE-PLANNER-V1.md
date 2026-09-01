# NA-DOC Workspace Planner V1

## Purpose

`workspace-plan/v1` is a deterministic, renderer-independent policy inside the canonical Document Engine. It selects an existing `student-workspace/v1` preset from structured question/task semantics and records a reason code plus source signals. It does not solve mathematics, construct visual objects, render output, or modify the Studio pipeline.

## Inputs and outputs

Inputs are existing Question Bank question types plus explicit semantic signals: task intent, response complexity, source-presence signals, and an optional author override. The Question adapter reads only `QuestionObject.type` and whether a source figure exists; it does not mutate or reinterpret question content.

Successful output contains only the exact NA-DOC-01S `StudentWorkspace`, a deterministic reason code, and sorted source signals. `workspacePlanToComponent` wraps that workspace in the exact NA-DOC-02 `WORKSPACE` component. Invalid overrides fail closed.

## Deterministic rules

| Structured intent | Workspace |
| --- | --- |
| Multiple choice or true/false | `NONE` |
| Minimal/short response | `FREE_RESPONSE_SMALL` |
| Short written response | `FREE_RESPONSE_SMALL` |
| Multi-step solution | `GRID_MEDIUM` |
| Long derivation | `GRID_LARGE` |
| Explicit graph-on-axes task | `COORDINATE_2D` |
| Explicit geometric construction | `DRAWING_AREA` |
| Unknown or insufficient semantics | `NONE` |

An explicit valid author override may select any canonical V1 preset. Unknown override values are rejected rather than coerced.

## No-forced-workspace policy

Coordinates alone do not select coordinate workspace. Geometry vocabulary alone does not select drawing workspace. A source figure does not imply another drawing. Raw text length is not a planning signal, so it cannot force a large grid. Unknown intent receives `NONE`, preventing arbitrary blank space.

## Visual semantics boundary

Selecting `COORDINATE_2D` or `DRAWING_AREA` creates no point, line, ray, segment, curve, graph, region, vector, vertex, edge, face, solid, label, or auxiliary construction. The planner produces only an empty workspace profile. Mathematical visual semantics and rendering remain future tasks governed by the separate Visual Semantics Safety lock.

## Boundaries

- NA-DOC-04R will audit existing visual architecture.
- NA-DOC-04A0 and 04A1–04A4 will define validated visual semantics contracts.
- NA-DOC-04B will implement validated rendering.
- NA-DOC-05 will integrate existing DOCX/LaTeX/PDF paths.

None of those tasks is implemented by Workspace Planner V1.
