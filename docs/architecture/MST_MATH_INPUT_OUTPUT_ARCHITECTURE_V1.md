# MST-MATH Input–Output Architecture V1.0

**Status:** LOCKED / CANONICAL / APPROVED  
**Human authority decision:** 2026-09-04  
**Scope:** Umbrella Input–Processing–Output architecture for MST-MATH  
**Migration policy:** Additive, compatibility-preserving, non-destructive

## 1. Purpose

This contract defines the canonical application-wide boundary between input formats, semantic/domain representations, application pipelines, output profiles, QA, renderers, and final artifacts.

It does **not** replace or invalidate the existing certified v1.6 architecture contract. The existing v1.6 flow remains a valid domain/application path inside this umbrella architecture.

## 2. Canonical global flow

```text
SOURCE
→ SOURCE ADAPTER
→ DOCUMENT IR
→ SEMANTIC / DOMAIN IR
→ APPLICATION PIPELINE
→ CANONICAL DOMAIN IR
→ OUTPUT PROFILE
→ QA
→ RENDERER
→ FINAL ARTIFACT
```

## 3. Locked invariants

The following rules are canonical and locked:

- `INPUT_FORMAT != CONTENT_MODEL`
- `CONTENT_MODEL != OUTPUT_PROFILE`
- `OUTPUT_PROFILE != OUTPUT_FORMAT`
- No direct `INPUT → OUTPUT` bypass is permitted for semantic products.
- Input adapters do not own mathematical, pedagogical, document, or geometry truth.
- Renderers do not own semantic truth.
- Application pipelines must reuse shared canonical IR and shared authorities.
- No application may create a competing `DocumentIR`, `MathIR`, geometry authority, QuestionIR authority, or design authority.
- Canonical semantics precede presentation and rendering.
- QA is a mandatory gate before a final artifact is considered validated.
- `AUTHOR ONCE — RENDER MANY` is locked as the primary authoring/rendering principle.
- One normalized semantic source may feed multiple application pipelines, output profiles, and renderer formats.
- Legacy `PIMATH_*` machine IDs remain compatibility identifiers unless a separate approved migration explicitly replaces them.
- Human-facing product identity is `MST-MATH`.

## 4. Input architecture

Canonical input boundary:

```text
SOURCE FORMAT
→ SOURCE ADAPTER
→ PARSE / EXTRACT
→ NORMALIZE
→ ASSET EXTRACTION
→ MATH EXTRACTION
→ STRUCTURE RECOGNITION
→ PROVENANCE MAPPING
→ DOCUMENT IR
```

Input formats may include DOCX, PDF, image, text, structured data, or approved future adapters. Input-specific code must terminate at the shared semantic boundary and must not directly own output logic.

## 5. Shared semantic boundary

`DOCUMENT IR` is the canonical normalized document/source representation for generic document ingestion.

Downstream domain semantics may include, as applicable:

- `MathIR`
- `QuestionIR`
- semantic geometry / graph / table IR
- assessment structures
- lesson/learning structures
- source provenance and asset identity

Existing canonical ownership and compatibility rules remain authoritative. This contract does not authorize destructive relocation of existing shared types.

## 6. Application pipelines

Applications consume canonical shared semantics and produce domain-specific canonical representations.

Examples:

```text
DOCUMENT IR → P01 Learning Material → LESSON IR
DOCUMENT IR → Question Bank pipeline → QUESTION PACKAGE / QUESTION BANK
DOCUMENT IR → Exam pipeline → EXAM DOMAIN REPRESENTATION
MATH / GEOMETRY IR → FOLD domain → FOLD output representation
```

Application pipelines are consumers/orchestrators. They must not become competing semantic authorities for shared concerns.

## 7. Output architecture

Canonical output boundary:

```text
CANONICAL DOMAIN IR
→ OUTPUT PROFILE
→ CONTENT SELECTION / PRESENTATION MODEL
→ MST-MATH DNA / LOCKED STANDARDS
→ LAYOUT / VISUAL PLANNING
→ QA
→ FORMAT RENDERER
→ FINAL ARTIFACT
```

An output profile defines **audience and purpose**. An output format defines **artifact packaging/rendering**.

Examples:

```text
STUDENT_LEARNING_MATERIAL + PDF
STUDENT_LEARNING_MATERIAL + DOCX
STUDENT_LEARNING_MATERIAL + HTML
TEACHER_GUIDE + PDF
EXAM_THPTQG + PDF
```

`PDF`, `DOCX`, `HTML`, `PPTX`, video, SVG, PNG, and JSON are renderer/output formats, not semantic product profiles.

## 8. AUTHOR ONCE — RENDER MANY

A canonical domain IR is the reusable semantic source for multiple renderers.

For learning material:

```text
LESSON IR
├── Student PDF
├── Student DOCX
├── Interactive HTML
├── Worksheet
├── Teacher Guide
├── Slides
└── approved future renderers
```

A generated PDF must never become the canonical semantic source for the other outputs.

## 9. Relationship to the existing v1.6 contract

The existing v1.6 canonical flow:

```text
SOURCE / INGEST
→ Document IR
→ Math IR
→ Question / Exam QA
→ Geometry / Visual
→ Studio Orchestrator
→ Render / Export
```

remains valid and must not be rewritten by this contract.

This V1.0 umbrella contract classifies that flow as an existing domain/application path under the shared MST-MATH Input–Output architecture. No alternate engine, direct bypass, circular dependency, or competing parallel authority is authorized.

## 10. Implementation boundary

Current implementation should reuse the established document group:

- `src/modules/document-ingest`
- `src/modules/document-engine`
- canonical/shared `DocumentIR`
- canonical Math IR
- Geometry Engine / semantic geometry authority
- `src/modules/document-export`

New application capabilities should be bounded modules that consume these authorities. A monolithic `docx-to-pdf` semantic converter is forbidden for P01.

## 11. Definition of Done policy

Architecture, schema, UI, prompt, fixture, mock, or renderer code alone does **not** make a feature complete.

A semantic feature may be marked `DONE` only when its approved real-input path completes end-to-end, required QA passes, the real final artifact is produced, and no protected authority is bypassed.

For P01, the detailed Definition of Done is defined in `MST_MATH_P01_LEARNING_MATERIAL_PIPELINE_V1.md`.

## 12. Compatibility and change control

- No certified history rewrite.
- No force-push migration.
- No blind bulk rename of `PIMATH_*` compatibility IDs.
- No mutation of existing LOCKED / CANONICAL / APPROVED DNA except through explicit human-authorized successor/change-control work.
- Shared authority files require review and collision checks before mutation.
- Migration must remain forward-only and regression-tested.

## 13. Locked status

`MST_MATH_INPUT_OUTPUT_ARCHITECTURE_V1=LOCKED_CANONICAL_APPROVED`

`AUTHOR_ONCE_RENDER_MANY=LOCKED`

`DIRECT_INPUT_OUTPUT_SEMANTIC_BYPASS=FORBIDDEN`

`INPUT_FORMAT_OUTPUT_PROFILE_SEPARATION=REQUIRED`
