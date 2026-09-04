# MST-MATH Math Notation System V1.0

Status: **DRAFT / PROPOSED / REQUIRES HUMAN APPROVAL**  
Machine standard ID: `PIMATH-DNA-MATH-NOTATION-V1.0`  
Product display name: `MST-MATH`  
Change class: `NEW STANDARD / ADDITIVE`  
Locked predecessors modified: **NONE**

## Purpose

Define one semantic authority for mathematical notation used by MST-MATH across source ingestion, Math IR, documents, slides, HTML, video, and Vietnamese narration.

## Golden rule

> SAME MATHEMATICAL SEMANTICS — SAME CANONICAL NOTATION — SAME MEANING ACROSS ALL OUTPUTS.

Renderers may change representation mechanics, but MUST NOT change mathematical meaning.

## Assurance pipeline

`SOURCE → MATH IR → CANONICAL SYMBOL REGISTRY → SEMANTIC VALIDATION → OUTPUT ADAPTER → POST-RENDER QA`

For narrated video, add `NARRATION QA` after semantic validation.

## Required properties of a registry entry

Each registered notation role MUST define:

- stable `symbolId`;
- mathematical `semantic` meaning;
- canonical LaTeX form;
- Unicode form where appropriate;
- accepted aliases, if any;
- Vietnamese spoken form;
- mathematical category;
- supported output channels.

## Fail-closed rules

1. An unknown or ambiguous mathematical symbol MUST NOT be silently replaced by a visually similar symbol.
2. If a renderer cannot preserve the registered semantics, it MUST report `MATH_NOTATION_RENDER_FAILURE`.
3. If parsing cannot determine the intended semantics, it MUST report `MATH_NOTATION_AMBIGUITY`.
4. Loss of semantic modifiers is forbidden. Examples include:
   - `\vec{AB}` → `AB`;
   - `\leq` → `<`;
   - `\subseteq` → `\subset`;
   - interval endpoint changes such as `(a;b]` → `[a;b]`;
   - perpendicular/parallel substitutions by visually similar glyphs.
5. Plain text fallback is allowed only when it preserves meaning explicitly and is declared by the output adapter.

## Pedagogical requirements

Notation MUST be appropriate to the relevant GDPT 2018 / high-school mathematics context and remain internally consistent within one artifact. A mathematically valid alternative notation MUST NOT be introduced automatically when it changes the notation convention seen by students without an explicit profile or author decision.

Video additionally MUST preserve:

- readable sign, exponent, subscript, vector/arrow and interval markers;
- sufficient display duration and size;
- synchronized Vietnamese narration;
- consistent spoken meaning for the same semantic role.

## Scope of V1.0 proposal

V1.0 begins with high-frequency high-school notation: relations, set membership, set inclusion, logic, geometry, vectors, intervals, common operators, limits, sums/products, roots, integrals, and core number sets.

Full expression-level equivalence checking remains the responsibility of Math IR / Math QA. The notation layer is a semantic token authority and cross-output contract, not a replacement for the mathematics engine.

## Approval gate

This file remains `DRAFT / PROPOSED` until Impact Analysis, Conflict Check, regression testing, and explicit human approval are complete. It MUST NOT be treated as LOCKED/CANONICAL before that transition.
