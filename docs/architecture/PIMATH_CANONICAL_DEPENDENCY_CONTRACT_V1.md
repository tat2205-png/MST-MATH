# PiMath / MATH AI — Canonical Dependency Contract V1

Status: STANDARDIZATION CANDIDATE  
Scope: Phase 2 architecture mapping  
Policy: Registry-first, non-destructive

## 1. Purpose

This contract defines canonical authority, implementation ownership, dependency direction and migration boundaries for PiMath / MATH AI.

It does not authorize bulk source moves, breaking renames or replacement of existing LOCKED / CANONICAL / APPROVED standards.

## 2. Global invariants

- Mathematical semantics precede rendering.
- Renderers do not own mathematical truth.
- Adapters do not own mathematical truth.
- Workspaces do not own mathematical truth.
- Geometry Engine precedes renderer-specific implementations.
- FOLD is a geometry domain and must not replace Geometry Engine.
- Visual Pedagogy plans and validates; it must not create a competing design system.
- Existing LOCKED NA-MATH standards remain immutable.
- Migration must preserve compatibility until regression QA passes.
- No uncertain or NEEDS_REVALIDATION item may be silently converted to DONE.
- No bulk source movement is authorized by this contract.

## 3. MATH_ENGINE

Canonical module:

`MATH_ENGINE`

### MATH_IR

Implementation:

`src/modules/math-ir`

Role:

`CANONICAL_MATHEMATICAL_SEMANTIC_MODEL`

Authority:

`MATHEMATICAL_SEMANTIC_AUTHORITY`

MATH_IR owns canonical mathematical scene, entity, constraint, dependency and semantic structures.

### MATH_AUTHORING_VERIFICATION

Implementation:

`src/modules/math-authoring-verification`

Role:

`VERIFICATION_GATE`

Authority:

`VALIDATION_ONLY`

It may validate and inspect mathematical semantics but must not create an independent mathematical source of truth.

### INTELLIGENT_MATH_RUNTIME

Implementation:

`src/modules/intelligent-math-runtime`

Role:

`PLANNER_ORCHESTRATOR_RUNTIME`

Authority:

`NON_AUTHORITATIVE`

May consume:

- MATH_IR
- DYNAMIC_GEOMETRY
- CONSTRAINT_ORCHESTRATION

Runtime bridges including Three, GeoGebra, LuaDraw, Manim and Fold must remain non-authoritative.

## 4. GEOMETRY_ENGINE

Canonical module:

`GEOMETRY_ENGINE`

Implementation:

`src/modules/geometry-engine`

Role:

`CANONICAL_SEMANTIC_GEOMETRY_AUTHORITY`

Geometry Engine owns normalized semantic geometry and renderer-independent geometry routing requirements.

### DYNAMIC_GEOMETRY

Implementation:

`src/modules/dynamic-geometry`

Canonical construction core:

`src/modules/dynamic-geometry/construction-engine.ts`

Role:

`CONSTRUCTION_ENGINE`

Current legacy coupling exists with:

- `src/modules/fold-3d`
- `src/modules/pattern-fold`

The legacy FOLD-facing APIs are compatibility behavior and are not canonical Geometry Engine authority.

Migration type:

`BOUNDARY_EXTRACTION`

Physical source move required:

`NO`

### CONSTRAINT_ORCHESTRATION

Implementation:

`src/modules/constraint-orchestration`

Role:

`CONSTRAINT_SOLVER_TRANSACTION_LAYER`

Authority:

`EXECUTION_LAYER`

It consumes canonical Math IR and Dynamic Geometry operations.

### DYNAMIC_WORKSPACE

Implementation:

`src/modules/dynamic-workspace`

Role:

`APPLICATION_WORKSPACE_ORCHESTRATOR`

Authority:

`NON_AUTHORITATIVE`

Dynamic Workspace may coordinate:

- MATH_IR
- DYNAMIC_GEOMETRY
- CONSTRAINT_ORCHESTRATION
- renderer adapters

It must not own mathematical semantics.

## 5. FOLD

Canonical module:

`FOLD`

Role:

`GEOMETRY_DOMAIN_AND_OUTPUT`

Implementations:

- `src/modules/fold-3d`
- `src/modules/pattern-fold`
- `src/modules/surface-shortest-path`

FOLD may consume Math IR and Geometry Engine semantics.

FOLD must not replace `GEOMETRY_ENGINE`.

Target relationship:

Math IR  
→ Geometry Engine  
→ FOLD domain  
→ renderer / interactive adapters

## 6. GEOGEBRA

Canonical module:

`GEOGEBRA`

Implementation:

`src/modules/geogebra`

Role:

`INTERACTIVE_GEOMETRY_OUTPUT_ADAPTER`

Authority:

`NON_AUTHORITATIVE_ADAPTER`

Current implementation contains direct Pattern Fold dependencies.

Current coupling:

`GEOGEBRA → PATTERN_FOLD`

This is accepted as an existing FOLD-specific implementation boundary, not as the target canonical dependency direction.

Target generic flow:

`SEMANTIC_GEOMETRY`
→ `GEOGEBRA_CONSTRUCTION_IR`
→ `GEOGEBRA_RUNTIME_ADAPTER`

Target FOLD-specific flow:

`FOLD_DOMAIN`
→ `FOLD_GEOGEBRA_ADAPTER`
→ `GEOGEBRA_CONSTRUCTION_IR`
→ `GEOGEBRA_RUNTIME_ADAPTER`

Migration type:

`GENERIC_ADAPTER_BOUNDARY`

Initial physical move:

`NO`

## 7. DOCUMENT_ENGINE

Canonical module:

`DOCUMENT_ENGINE`

Role:

`CANONICAL_DOCUMENT_PIPELINE`

Implementation group:

- `src/modules/document-ingest`
- `src/modules/document-engine`
- `src/modules/document-export`

### DOCUMENT_INGEST

Role:

`INPUT_ADAPTER`

Supported current input implementations include PDF and image ingestion.

### DOCUMENT_PROCESSING

Implementation:

`src/modules/document-engine`

Role:

`DOCUMENT_NORMALIZATION_AND_MATH_IR_MAPPING`

DOCX processing may produce canonical mathematical/document semantic structures.

### DOCUMENT_EXPORT

Implementation:

`src/modules/document-export`

Role:

`OUTPUT_ADAPTER`

It must consume canonical document/math semantics and locked NA-MATH standards.

### DOCUMENT_IR ownership

Canonical concept:

`DOCUMENT_IR`

Current legacy owner:

`src/modules/question-bank/types.ts::DocumentIR`

Target canonical owner:

`DOCUMENT_ENGINE`

Current ownership is considered legacy because DocumentIR is consumed by document ingest, document export and question-bank processing.

Migration type:

`SHARED_DOCUMENT_IR_EXTRACTION`

Migration strategy:

1. Establish canonical shared DOCUMENT_IR definition.
2. Preserve compatibility re-export from Question Bank.
3. Move imports incrementally.
4. Run regression QA.
5. Remove legacy ownership only after PASS.

Breaking type move before compatibility is established:

`FORBIDDEN`

## 8. QUESTION_BANK

Canonical module:

`QUESTION_BANK`

Implementation:

`src/modules/question-bank`

Role:

`SOURCE_ASSESSMENT_CORE`

Question Bank may consume canonical `DOCUMENT_IR`.

Question Bank must not remain the long-term canonical owner of generic DocumentIR.

## 9. EXAM_QA

Implementation:

`src/modules/exam-qa`

Role:

`ASSESSMENT_VALIDATION_SERVICE`

Authority:

`VALIDATION_ONLY`

Exam QA may validate:

- question structure
- answers
- Vietnamese language
- mathematical logic
- assessment compatibility

It must not replace Math Engine or Question Bank authority.

## 10. CLASSROOM_GAME

Canonical module:

`CLASSROOM_GAME`

Implementation:

`src/modules/classroom-game`

Role:

`GAME_OUTPUT`

Authority:

`QUESTION_BANK_CONSUMER`

Classroom Game may consume Question Bank questions and assessment structures.

It must not become the canonical owner of question content.

## 11. VISUAL_PEDAGOGY

Canonical module:

`VISUAL_PEDAGOGY`

Implementation:

`src/modules/visual-pedagogy`

Role:

`PLANNING_AND_VALIDATION`

Authority:

`NON_MATHEMATICAL_VALIDATION`

Visual Pedagogy may consume MATH_IR.

It must not:

- redefine mathematical truth;
- replace Geometry Engine;
- replace locked NA-MATH design standards;
- create a competing design system.

## 12. NLS_SOURCE_REGISTRY

Canonical module:

`NLS_SOURCE_REGISTRY`

Implementation:

`src/modules/nls-source-registry`

Role:

`CURRICULUM_SOURCE_INDEX`

It indexes curriculum/source authority and must not become renderer or mathematical execution authority.

## 13. VIDEO

Canonical module:

`VIDEO`

Role:

`VIDEO_OUTPUT_PIPELINE`

Authority:

`NON_AUTHORITATIVE_OUTPUT_PIPELINE`

Current canonical implementation locations:

Orchestrator:

`image-animation/automation/orchestrator`

Renderer router:

`image-animation/renderers/router`

Primary deterministic renderer:

`image-animation/renderers/manim`

Local runtime bridge:

`src/services/localBridgeClient.ts`

Application UI:

`src/components/tabs/VideoTab.tsx`

Runtime validation:

`scripts/run-question-video-runtime.ts`

VIDEO is a distributed pipeline.

Creating a new physical `src/modules/video` module solely for naming symmetry is not required.

Video must consume verified mathematical/geometry semantics and may not become mathematical source of truth.

## 14. Canonical dependency direction

Primary dependency direction:

INPUT  
→ DOCUMENT / SOURCE NORMALIZATION  
→ MATH_IR  
→ MATH / LOGIC / PEDAGOGY  
→ GEOMETRY / DOMAIN PROCESSING  
→ OUTPUT PLANNING  
→ ADAPTER / RENDERER  
→ QA  
→ EXPORT

Geometry-specific direction:

MATH_IR  
→ GEOMETRY_ENGINE  
→ DYNAMIC_GEOMETRY / CONSTRAINT_ORCHESTRATION  
→ DOMAIN MODULES  
→ OUTPUT ADAPTERS

Workspace direction:

MATH_IR + GEOMETRY services  
→ DYNAMIC_WORKSPACE

Renderer direction:

SEMANTIC AUTHORITY  
→ renderer contract  
→ renderer

Never:

renderer  
→ canonical mathematical authority

## 15. Migration policy

Phase 2 migration is additive and non-destructive.

Allowed before migration QA:

- architecture documentation;
- registries;
- implementation mapping;
- compatibility adapters;
- bounded dependency extraction.

Not authorized:

- bulk source moves;
- destructive module merges;
- breaking public API renames;
- deletion of legacy compatibility paths;
- mutation of LOCKED NA-MATH standards;
- silent authority changes.

## 16. Phase 2 classification

MATH_IR=ALIGNED_CANONICAL_AUTHORITY

GEOMETRY_ENGINE=ALIGNED_CANONICAL_AUTHORITY

DYNAMIC_GEOMETRY=NEEDS_BOUNDARY_EXTRACTION

DYNAMIC_WORKSPACE=NON_AUTHORITATIVE_WORKSPACE

FOLD=CANONICAL_DOMAIN_GROUP

GEOGEBRA=NEEDS_GENERIC_BOUNDARY_DECOUPLING

DOCUMENT_ENGINE=CANONICAL_GROUP

DOCUMENT_IR=NEEDS_SHARED_CANONICAL_OWNERSHIP

QUESTION_BANK=ALIGNED_DOMAIN_CORE

EXAM_QA=VALIDATION_SERVICE

CLASSROOM_GAME=ALIGNED_CONSUMER

VISUAL_PEDAGOGY=ALIGNED_PLANNING_VALIDATION

NLS_SOURCE_REGISTRY=ALIGNED_SOURCE_INDEX

VIDEO=DISTRIBUTED_CANONICAL_OUTPUT_PIPELINE

## 17. Phase 2 gate

Before source migration:

- dependency contract QA must PASS;
- implementation registry path QA must PASS;
- locked-standard QA must PASS;
- regression QA must PASS;
- each migration must have a bounded integration plan.

No implementation item becomes DONE solely because it appears in this architecture contract.
