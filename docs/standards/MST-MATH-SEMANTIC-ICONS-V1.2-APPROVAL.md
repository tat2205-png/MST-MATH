# MST-MATH Semantic Icon System V1.2 — Human Approval Record

**Standard ID:** `MST-MATH-DNA-SEMANTIC-ICONS-V1.2`  
**Version:** `1.2.0`  
**Decision:** APPROVED / LOCKED SUCCESSOR  
**Human decision:** `CHỐT`  
**Decision date:** 2026-09-05  
**Predecessor:** `MST-MATH-DNA-SEMANTIC-ICONS-V1.1`

## Governance decision

V1.1 remains immutable in place. V1.2 is a versioned successor. Existing V1.1 SVG assets are not overwritten. Redesigned `CONCEPT` and `ACTIVITY` glyphs and all new semantic roles use versioned assets under `assets/mst-math-icons/v1.2/`.

V1.2 is approved and locked as the semantic-icon successor, but runtime promotion is intentionally pending because the locked root `MST-MATH-DNA-V1.0` currently references V1.1. Activating V1.2 must be done by a separate versioned successor of the root/binding authority. The root must not be edited in place.

## Locked semantic taxonomy — 32 core roles

### Knowledge & Instruction
`CONCEPT`, `DEFINITION`, `THEOREM_PROPERTY`, `FORMULA`, `METHOD_PROCEDURE`, `EXAMPLE`

### Learning Flow
`LEARNING_OBJECTIVE`, `PRIOR_KNOWLEDGE`, `ACTIVITY`, `EXPLORE`, `APPLICATION`, `SYNTHESIS`, `REFLECTION`

### Mathematical Practices
`REASONING`, `PROBLEM_SOLVING`, `PROOF_JUSTIFICATION`, `MATHEMATICAL_MODELING`, `MATHEMATICAL_COMMUNICATION`, `MATHEMATICAL_CONNECTIONS`, `MATHEMATICAL_REPRESENTATION`

### Context
`REAL_WORLD_MATH`

### Practice & Assessment
`QUESTION`, `EXERCISE`, `SOLUTION`, `ANSWER`

### Support
`NOTE`, `IMPORTANT`, `WARNING`, `TIP`

### Mathematical Visual
`GEOMETRY`, `GRAPH`, `TABLE`

## Locked title rule

`ONE TITLE — ONE PRIMARY SEMANTIC ICON — MANY MACHINE SEMANTICS`

A visible title may render only one primary semantic icon. Secondary meanings remain machine-readable through `secondarySemanticTags[]`, along with metadata such as activity type, difficulty, tool and content modality.

A mathematical object may override a generic activity icon when it is the dominant cognitive focus. Example: “Quan sát đồ thị và nhận xét” uses `GRAPH` as the visible primary role, while `EXPLORE` and `REASONING` remain secondary semantic tags.

## Locked semantic boundaries

- `REASONING` is not `PROOF_JUSTIFICATION`.
- `METHOD_PROCEDURE` is not `PROBLEM_SOLVING`.
- `PROBLEM_SOLVING` is not `SOLUTION`.
- `APPLICATION` is not `REAL_WORLD_MATH` and is not `MATHEMATICAL_MODELING`.
- `SYNTHESIS` is not `IMPORTANT`.
- `PRIOR_KNOWLEDGE` is not `CONCEPT`.
- `EXPLORE` is not the same as generic `ACTIVITY`.

## Updated canonical component intent mapping for the successor

- `prerequisite` → `PRIOR_KNOWLEDGE`
- `summary` → `SYNTHESIS`
- `strategy` → `PROBLEM_SOLVING`
- `proof` → `PROOF_JUSTIFICATION`
- `real-world-connection` → `REAL_WORLD_MATH`
- `investigation` / `discovery` → `EXPLORE`
- `how-to` / `procedure` → `METHOD_PROCEDURE`
- `modeling` → `MATHEMATICAL_MODELING`
- `concept-map` → `MATHEMATICAL_CONNECTIONS`
- `representation` → `MATHEMATICAL_REPRESENTATION`
- `self-check` → `REFLECTION`

## Anti-inflation rule

A new core semantic role may be added only when it is durable across multiple mathematical-pedagogy contexts and outputs, is semantically distinct from existing roles, and is not merely a verb, phase label, difficulty level, group format, tool, media type or local activity name.

Items such as `WARM_UP`, `OBSERVE`, `PREDICT`, `DISCUSS`, `CHALLENGE`, `ADVANCED`, `GROUP_WORK`, `GEOGEBRA`, `VIDEO` and similar concepts remain aliases or metadata unless a future versioned governance decision proves that they deserve a core semantic role.

## Golden evidence

Human approval followed review of `MST_MATH_SEMANTIC_ICON_GOLDEN_SHEET_V1_2_32_ROLE_CANDIDATE.pdf`, including taxonomy, semantic boundaries, title-context use, grayscale behavior, small print sizes, glyph distinction and versioned-asset immutability.

## Activation gate

`APPROVED_AND_LOCKED_PENDING_VERSIONED_ROOT_BINDING`

Do not modify `MST-MATH-DNA-V1.0` in place. Runtime activation of V1.2 requires a separate versioned authority successor and regression checks for all consumers that resolve semantic icons.
