# MST-MATH Math Notation Render Contract V1.0

Status: **DRAFT / PROPOSED / REQUIRES HUMAN APPROVAL**  
Parent standard: `PIMATH-DNA-MATH-NOTATION-V1.0`

## Contract objective

Every renderer consumes mathematical semantics; no renderer becomes the mathematical source of truth.

Supported target output channels in this contract:

- `PDF`
- `DOCX`
- `HTML`
- `SLIDES`
- `VIDEO`
- `TTS`

A channel appearing in the target contract does not mean it is already production-certified. Certification is channel-by-channel and requires its golden regression gate.

## Required adapter behavior

For every registered notation token, an adapter MUST either:

1. preserve the resolved mathematical role correctly; or
2. fail closed with a notation failure code.

An adapter MUST NOT:

- silently drop vector, ray, angle, perpendicular, parallel, membership, subset, inequality, interval-boundary, exponent, or subscript semantics;
- replace a symbol with a visually similar but semantically different glyph;
- infer a different notation convention from typography limitations;
- rewrite a mathematically meaningful delimiter without semantic validation;
- invent a spoken meaning for a context-dependent symbol solely from its glyph.

## Cross-output invariants

Given one Math IR semantic expression, all certified output adapters MUST preserve:

- operator and relation identity;
- operand order;
- grouping;
- interval openness/closedness;
- superscripts/subscripts;
- vector/ray/line modifiers;
- set-membership and inclusion semantics;
- equality/inequality strength;
- logical direction and equivalence;
- domain-specific notation declared by the source profile.

For registered notation, adapters SHOULD retain a semantic signature so semantic identity can be compared before and after conversion.

## PDF / LaTeX

- Prefer canonical LaTeX from the registry.
- Unknown aliases MUST be normalized before final serialization when the semantic identity is known.
- Unsupported or ambiguous notation MUST not be presented as if successfully validated mathematics.

## DOCX / OMML

- OMML conversion MUST preserve semantic roles rather than relying on visual Unicode substitution alone.
- Round-trip tests SHOULD compare semantic identity before and after DOCX conversion.

## HTML

- KaTeX/MathJax-style rendering MAY be used, but renderer-specific macro substitution MUST preserve semantics.
- Text-only fallbacks MUST be explicit and semantically lossless.

## Slides

- Equation rendering MUST preserve the same semantic source as document/video outputs.
- Converting math into raster/vector artwork MUST not bypass semantic QA.

## Video / Manim

- Mathematical text MUST be generated from validated notation derived from the shared authority.
- Visual QA MUST verify sign visibility, baseline, exponent/subscript position, vector/ray modifiers, delimiters, and clipping.
- Animation MUST NOT morph one semantic token into another without an explicit mathematical transition.
- Syntax validation alone is insufficient; notation identity must be preserved before render.

## TTS / narration

- Spoken Vietnamese is derived from resolved semantic identity, not arbitrary glyph guessing.
- Narration MUST distinguish meanings such as `thuộc`, `không thuộc`, `tập con`, `vuông góc`, `song song`, `nhỏ hơn hoặc bằng`, and `lớn hơn hoặc bằng`.
- Profile-dependent notation MUST be resolved under a declared notation profile before narration.
- Context-dependent notation MUST be resolved by mathematical structure before narration. If context is insufficient, TTS support for that token MUST be rejected rather than guessed.
- Example: `≡` may be visually preserved while generic TTS remains disabled until the expression semantics identify identity, modular congruence, or another intended relation.
- Contextual verbalizers for fractions, roots, powers, coordinates, and similar structures MAY exist, but they MUST consume registered semantic identity and MUST NOT redefine registered notation independently.

## Failure codes

- `MATH_NOTATION_AMBIGUITY`
- `MATH_NOTATION_UNKNOWN_TOKEN`
- `MATH_NOTATION_RENDER_FAILURE`
- `MATH_NOTATION_SEMANTIC_LOSS`
- `MATH_NOTATION_NARRATION_MISMATCH`

These codes are normative for the proposed V1.0 contract and become canonical only after human approval.
