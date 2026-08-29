# NA-DOC Reusable Document Component Contract V1

## Purpose and boundary

`document-component/v1` adds semantic grouping to the canonical Document Engine at `src/modules/document-engine/`. It is not a new Document IR, engine, planner, or renderer. Existing paragraph, heading, equation, list, page-break, problem-reference, image-reference, and table-reference primitives remain `MathDocumentBlock` values.

## Existing representation matrix

| Semantic concept | Existing representation | Decision | Safe extension point |
| --- | --- | --- | --- |
| Paragraph, heading, equation, list | `MathDocumentBlock` | REUSE | Component `content` |
| Example/problem | `MathProblem` and `problem_reference` | ADAPT | Stable `problemId` |
| Exercise/question | Question Bank `QuestionObject` | ADAPT | Stable `questionId`; no copied question schema |
| Figure/image | `MathAssetReference(kind=image)` | REUSE | Component `asset` |
| Table | `MathAssetReference(kind=table)` | REUSE | Component `asset` |
| Source evidence/metadata | `MathMetadata` and `MathSourceEvidence` | REUSE | Component `metadata` |
| Student/teacher audience | Question Bank `ExportAudience` | REUSE | Visibility function; no role in payload |
| Student workspace | `student-workspace/v1` | REUSE | Component `workspace` |
| Definition, theorem, note, warning | No semantic wrapper | EXTEND | `document-component/v1` |
| Solution and answer grouping | Existing isolated content, without document wrapper | EXTEND | Teacher-visible component kinds |

The existing Question Bank `DocumentIR` remains a specialized production representation and is not copied or replaced. This contract does not attempt to reconcile that duplicate-risk boundary.

## Component kinds

V1 supports `DEFINITION`, `THEOREM`, `EXAMPLE`, `EXERCISE`, `SOLUTION`, `ANSWER`, `NOTE`, `WARNING`, `FIGURE`, `TABLE`, and `WORKSPACE`.

Definitions, theorems, notes, warnings, solutions, and answers contain existing `MathDocumentBlock` values. Examples reference an existing `MathProblem`. Exercises reference an existing Question Bank question by stable ID. Figures and tables contain the existing `MathAssetReference`; they do not introduce bytes or another asset/table schema. Workspaces contain the exact NA-DOC-01S `StudentWorkspace` union, including the 5 mm grid convention.

## Student and teacher safety

Components do not store a new audience or visibility field. `isDocumentComponentVisible` consumes the existing `ExportAudience`. `SOLUTION` and `ANSWER` are hidden for `STUDENT` and visible for `TEACHER`; all teacher/student export policy remains owned by the existing Question Bank pipeline. Workspace payloads remain answer- and solution-free.

## Source immutability and traceability

Component metadata reuses `MathMetadata.sourceEvidence`. Exercise adaptation stores only the stable question ID and never mutates or copies source question text, answers, solutions, figures, or provenance. Source ownership remains with the existing model.

## Renderer independence

Canonical components contain semantics and references only. Validation rejects authoritative CSS/HTML classes, pixels, OOXML fragments, Word style IDs, LaTeX commands, TikZ, font names, hex colors, and page coordinates. DOCX, LaTeX, PDF, HTML, SVG, and other adapters may interpret components later; no renderer integration is implemented here.

## Future task boundaries

- NA-DOC-03 may plan which components and workspace presets a document needs; no planner exists here.
- NA-DOC-04 may render or interact with coordinate workspaces; this contract only reuses the empty semantic workspace.
- NA-DOC-05 may adapt these components to existing DOCX/TeX/PDF paths; those serializers are unchanged by V1.
