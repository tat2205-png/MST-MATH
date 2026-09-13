# MST-MATH P01 Learning Material Pipeline V1.0

**Status:** LOCKED / CANONICAL / APPROVED  
**Human authority decision:** 2026-09-04  
**Profile ID:** `P01_LEARNING_MATERIAL`  
**Audience:** Student  
**Parent architecture:** `MST_MATH_INPUT_OUTPUT_ARCHITECTURE_V1`

## 1. Purpose

This contract defines the canonical semantic pipeline for producing MST-MATH student learning material from normalized source content.

P01 is an **application/consumer pipeline**. It does not own generic document truth, mathematical truth, geometry truth, typography authority, renderer truth, or source truth.

## 2. Canonical P01 flow

```text
SOURCE
→ DOCUMENT IR
→ CONTENT MODEL
→ LESSON BLUEPRINT
→ ACTIVITY GRAPH
→ VISUAL REQUIREMENTS
→ GEOMETRY / GRAPH / TABLE IR
→ ASSESSMENT
→ LESSON IR
→ STUDENT_LEARNING_MATERIAL PROFILE
→ QA
→ RENDERER
→ FINAL ARTIFACT
```

For the Word-to-student-PDF golden case:

```text
REAL DOCX
→ canonical DOCX ingest
→ DOCUMENT IR
→ CONTENT MODEL
→ LESSON BLUEPRINT
→ ACTIVITY / VISUAL / ASSESSMENT processing
→ LESSON IR
→ P01_LEARNING_MATERIAL
→ QA
→ PDF renderer
→ REAL STUDENT PDF
```

## 3. Authority boundaries

P01 must reuse existing canonical authorities.

P01 must **not** own or redefine:

- `DocumentIR`
- `MathIR`
- `QuestionIR`
- Geometry Engine / semantic geometry authority
- source provenance authority
- global typography/design DNA
- output renderer truth
- Question Bank authority
- exam authority

If a required authority is missing, the pipeline must report a gap and fail closed rather than invent a competing canonical source.

## 4. DOCUMENT IR

`DOCUMENT IR` is the normalized source/document boundary received from the canonical document pipeline.

It preserves, as applicable:

- source metadata and provenance
- section/block structure
- paragraphs and lists
- equations/math associations
- figures/images/assets
- tables
- source ordering
- question-like structures
- source identity

P01 must not directly parse Word into final learning-layout output while bypassing `DOCUMENT IR`.

## 5. CONTENT MODEL

The Content Model classifies source semantics independently from presentation.

Typical semantic roles may include:

- topic
- prerequisite
- concept
- definition
- theorem/property
- formula
- explanation
- example
- counterexample
- exercise
- solution
- activity
- assessment item
- visual requirement

Content classification must preserve source traceability.

## 6. LESSON BLUEPRINT

The Lesson Blueprint organizes the content into a student-learning sequence.

A blueprint may include, when supported by source/authority:

- learning goals
- activation / warm-up
- exploration
- concept formation
- core knowledge
- guided example
- student attempt
- practice
- application
- self-check
- summary / memory anchor

The blueprint is semantic learning design, not page layout.

## 7. ACTIVITY GRAPH

The Activity Graph models the learner journey and dependencies between student actions.

Example pattern:

```text
Activate
→ Observe
→ Predict
→ Explore
→ Conclude
→ Guided Example
→ Student Attempt
→ Feedback
→ Practice
→ Apply
```

Each activity should be able to carry semantic fields such as goal, student action, prompt, expected response, feedback requirement, prerequisite, and visual requirement.

Static PDF and interactive HTML may render the same semantic activity differently.

## 8. VISUAL REQUIREMENTS

Visual planning defines **what a visual means and why it is needed**, not renderer-specific drawing instructions.

Visual requirements may route to shared semantic authorities for:

- geometry
- function graphs
- tables
- diagrams
- data visualizations
- approved illustration types

Canonical direction:

```text
LESSON SEMANTICS
→ VISUAL REQUIREMENT
→ SHARED SEMANTIC GEOMETRY / GRAPH / TABLE IR
→ OUTPUT-SPECIFIC RENDERER
```

Never:

```text
PDF DRAWING
→ mathematical/geometry truth
```

## 9. ASSESSMENT

Assessment must align with the lesson goal and approved content scope.

Possible semantic assessment components include:

- check for understanding
- guided practice
- independent practice
- application
- self-assessment
- exit check

P01 must not silently fabricate unsupported canonical subject matter. Any AI-generated extension must remain subordinate to curriculum/source authority and applicable review rules.

## 10. LESSON IR

`LESSON IR` is the canonical semantic representation for learning material produced by P01.

It is renderer-independent and supports `AUTHOR ONCE — RENDER MANY`.

Conceptual structure:

```text
LessonIR
├── metadata
├── sourceProvenance
├── learningGoals
├── contentUnits
├── activityGraph
├── mathReferences
├── visualRequirements
├── semanticVisualIRReferences
├── assessment
├── studentPresentationSemantics
└── QA metadata
```

This file locks the **concept and authority boundary** of `LESSON IR`; implementation schema details remain an implementation task and must not conflict with existing shared IR authorities.

## 11. Output profile vs output format

P01 separates semantic profile from file format.

Canonical profile:

```text
P01_LEARNING_MATERIAL
```

Example renderer combinations:

```text
P01_LEARNING_MATERIAL + PDF
P01_LEARNING_MATERIAL + DOCX
P01_LEARNING_MATERIAL + HTML
```

PDF is not the canonical learning source.

## 12. Student profile behavior

The student profile may control presentation such as:

- hiding teacher-only notes
- isolating answers/solutions according to approved policy
- preserving student working space
- emphasizing key knowledge
- rendering examples and practice distinctly
- using MST-MATH typography/layout/visual DNA
- producing grayscale-safe/accessible output when applicable

Profile behavior must not change mathematical/source truth.

## 13. QA gate

Final output must pass applicable QA before being considered validated.

Required categories include, as applicable:

- source fidelity QA
- content/semantic QA
- mathematics QA
- pedagogy QA
- question/assessment QA
- geometry/graph/table semantic QA
- typography/design DNA QA
- layout/pagination QA
- asset completeness QA
- student-answer-isolation QA
- renderer/output validation

A renderer success alone is not a QA PASS.

## 14. Definition of Done

`P01_LEARNING_MATERIAL=DONE` is forbidden unless real end-to-end evidence exists.

Minimum golden-case evidence:

```text
REAL DOCX
→ INGEST PASS
→ DOCUMENT IR VALID
→ CONTENT MODEL VALID
→ LESSON BLUEPRINT VALID
→ ACTIVITY / VISUAL / ASSESSMENT PROCESSING VALID
→ LESSON IR VALID
→ P01 STUDENT PROFILE APPLIED
→ REQUIRED QA PASS
→ REAL PDF GENERATED
→ OUTPUT VALIDATION PASS
```

The following alone are **not** sufficient for DONE:

- architecture document
- schema only
- UI only
- prompt only
- fixture only
- mock only
- synthetic demo only
- renderer code only

Until the real golden case passes, implementation status must remain `PARTIAL`, `IN_PROGRESS`, `PLANNED`, or another evidence-backed non-DONE state.

## 15. Implementation target

Implementation should reuse:

- `src/modules/document-ingest`
- `src/modules/document-engine`
- shared/canonical `DocumentIR`
- canonical Math IR
- Geometry Engine / semantic geometry
- `src/modules/document-export`

A bounded P01 application module may be introduced, for example:

```text
src/modules/learning-material/
├── content-model.ts
├── lesson-blueprint.ts
├── activity-graph.ts
├── assessment.ts
├── lesson-ir.ts
├── validation.ts
└── pipeline.ts
```

This is an implementation target, not authorization to duplicate existing engine capabilities.

A monolithic semantic `docx-to-student-pdf.ts` pipeline is forbidden.

## 16. Compatibility policy

- Preserve `P01_LEARNING_MATERIAL` as the stable profile ID.
- Preserve legacy compatibility machine IDs unless separately migrated under approved change control.
- Do not rewrite certified history.
- Do not mutate protected Question Bank / DocumentIR / QuestionIR semantics through this P01 task.
- Shared registries and project-state/master-map files require collision review before update.

## 17. Locked status

`MST_MATH_P01_LEARNING_MATERIAL_PIPELINE_V1=LOCKED_CANONICAL_APPROVED`

`LESSON_IR_ROLE=CANONICAL_P01_SEMANTIC_LEARNING_REPRESENTATION`

`P01_PROFILE_FORMAT_SEPARATION=REQUIRED`

`P01_REAL_E2E_REQUIRED_FOR_DONE=YES`
