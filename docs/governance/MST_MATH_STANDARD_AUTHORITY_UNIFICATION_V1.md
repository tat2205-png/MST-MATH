# MST-MATH — STANDARD AUTHORITY UNIFICATION V1

STATUS: PROPOSED_FOR_CONVERGENCE
MODE: NON_DESTRUCTIVE_AUTHORITY_UNIFICATION
BASELINE: `integration/mst-math-convergence-v1`

## Goal

Resolve duplicated or overlapping standard authority so that one semantic meaning has one active canonical authority, while preserving locked historical artifacts and compatibility IDs.

Core rule:

`ONE SEMANTIC FAMILY → ONE ACTIVE CANONICAL AUTHORITY`

This does **not** mean deleting all older files or merging standards that govern different scopes.

## Resolution classes

### 1. MERGE BY SUPERSESSION

#### GLOBAL_BASELINE
- Active: `PIMATH_DNA_GLOBAL_BASELINE_V1.1`
- Historical compatibility: `PIMATH_DNA_GLOBAL_BASELINE_V1.0`
- Current registry marks V1.0 `canonical=false`, `active=false`, `supersededBy=V1.1`.
- Historical V1.0 payload remains immutable.

#### SEMANTIC_ICONS
- Active: `PIMATH-DNA-SEMANTIC-ICONS-V1.1`
- Historical compatibility: `PIMATH-DNA-SEMANTIC-ICONS-V1.0`
- Runtime already imports V1.1.
- Current registry marks V1.0 inactive/non-canonical without rewriting its historical locked payload.

### 2. MERGE BY ALIAS

#### PRODUCT_IDENTITY_ROOT
- Active current technical authority: `PIMATH-DNA-V1.0`
- Compatibility alias: `NA-MATH-EDUCATIONAL-BRAND-SYSTEM-V1.0`
- Future product migration target: `MST-MATH-DNA-V1.0` remains NOT YET CANONICAL until controlled brand convergence.

### 3. GROUP AS SPECIALIZED FACETS — DO NOT DESTRUCTIVELY MERGE

#### DYNAMIC_GEOMETRY
Family root:
- `PIMATH_DNA_DYNAMIC_GEOMETRY_VISUALIZATION_V1.0`

Specialized facets:
- `PIMATH_DNA_GEOGEBRA_FOLD_LAYOUT_V1.0`
- `PIMATH_DNA_GEOGEBRA_2D_DYNAMIC_VISUALIZATION_V1.0`
- `PIMATH_DNA_GEOGEBRA_2D_MIN_MAX_VISUALIZATION_V1.0`
- `PIMATH_DEVELOPABLE_GEOMETRY_KERNEL_V1.0`

These are related but not equivalent standards. They remain separate under one family root.

#### PRESENTATION_SYSTEM
- `NA_MATH_LAYOUT_V1_3` = layout authority.
- `NA_MATH_TYPOGRAPHY_STANDARD_V1_0` = typography-role overlay.

They share a standards package but govern different semantic scopes.

#### VIDEO_PRESENTATION
- `NA_MATH_VIDEO_VISUAL_LANGUAGE_V1_0` = visual-language rules.
- `NA_MATH_VIDEO_GOLDEN_START_MID_END_V1` = golden evidence/reference.

Rule authority and golden evidence must remain distinct.

#### FOLD_PRESENTATION
- `NA_MATH_GEOMETRY_FOLD_VISUAL_STANDARD_V1` remains a presentation/adapter-layer authority.
- It must not replace shared geometry semantics or become a second Geometry Core.

## Historical immutability

Historical locked files may contain metadata such as `canonical=true` that was true when certified. They are not rewritten solely to change history.

Current active authority is resolved by:

`registry/authority.json → registry/standards.json → registry/standard-families.json`

Therefore:

`HISTORICAL_SELF_DECLARATION != CURRENT_ACTIVE_AUTHORITY`

## Machine guard

`tests/test-mst-math-standard-authority-unification-v1.ts` must prove:
- one active canonical authority per semantic family;
- Global Baseline V1.0 is inactive/history and V1.1 is active;
- Semantic Icon V1.0 is inactive/history and V1.1 is active;
- aliases are never active authorities;
- specialized facets are not destructively merged;
- historical payload immutability is preserved.

CI gate:

`STANDARD_AUTHORITY_UNIFICATION_QA=PASS`

## Non-goals

This change does not:
- rename all PiMath IDs to MST-MATH;
- merge Brand Migration PR #8;
- rewrite certified historical payloads;
- merge QuestionIR/DocumentIR;
- merge Geometry/FOLD semantics;
- alter output-profile behavior;
- change runtime renderer mathematics;
- promote anything to `main`.

## Final rule

`MERGE DUPLICATE AUTHORITY — KEEP DISTINCT SEMANTIC FACETS — PRESERVE HISTORY.`
