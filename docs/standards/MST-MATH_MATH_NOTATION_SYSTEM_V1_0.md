# MST-MATH Math Notation System V1.0

Status: **DRAFT / PROPOSED / REQUIRES HUMAN APPROVAL**  
Machine standard ID: `PIMATH-DNA-MATH-NOTATION-V1.0`  
Product display name: `MST-MATH`  
Change class: `NEW STANDARD / ADDITIVE`  
Locked predecessors modified: **NONE**

## Purpose

Define one notation authority for mathematical representation used by MST-MATH across source ingestion, Math IR, documents, slides, HTML, video, and Vietnamese narration.

This standard does **not** replace Math IR as the mathematical semantic authority.

## Authority separation

- **Math IR / Math QA** own mathematical meaning and expression-level correctness.
- **Math Notation Authority** owns canonical representation of registered semantic notation under a declared profile.
- **Output adapters/renderers** consume authority and never become a source of mathematical truth.
- **TTS verbalization** consumes semantic identity where available; it may not infer a unique meaning from a context-sensitive glyph when context is insufficient.

## Golden rule

> SAME MATHEMATICAL SEMANTICS — SAME CANONICAL NOTATION — SAME MEANING ACROSS ALL OUTPUTS.

Renderers may change representation mechanics, but MUST NOT change mathematical meaning.

## Assurance pipeline

`SOURCE / MATH IR → NOTATION PROFILE → NOTATION AUTHORITY → NOTATION ENVELOPE → OUTPUT ADAPTER → POST-OUTPUT QA`

For narrated video, add contextual `SEMANTIC VERBALIZATION → NARRATION QA` before release.

## Required properties of a registry entry

Each registered notation role MUST define:

- stable `symbolId`;
- mathematical `semantic` meaning, or an explicit profile/context-dependent semantic class when one glyph is not universally interpretable;
- canonical LaTeX form;
- Unicode form where appropriate;
- accepted aliases, if any;
- Vietnamese spoken form when TTS is semantically safe;
- mathematical category;
- supported output channels;
- profile-specific semantics when a notation convention is curriculum/profile dependent.

An output channel MUST NOT be declared for a token unless that channel can preserve the registered role safely.

## Notation profile rule

Mathematical glyphs do not always have one universal pedagogical convention. MST-MATH MUST bind convention-dependent notation to a declared profile before assigning semantics.

Initial profile: `VN_GDPT2018`.

For example, Vietnamese high-school materials commonly use `A \subset B` / `A ⊂ B` to mean “A is a subset of B”, including the reflexive case `A ⊂ A`. Therefore MST-MATH MUST NOT globally interpret `⊂` as “proper subset”. Under `VN_GDPT2018`, the proposed registry maps it to inclusive subset semantics. A proper-subset meaning requires an unambiguous role such as `\subsetneq` / `⊊` or another explicitly approved profile convention.

If a profile-dependent token is encountered without a valid notation profile, validation MUST fail with `MATH_NOTATION_AMBIGUITY` rather than guessing.

## Context-dependent rule

A notation profile does not solve every ambiguity. Some glyphs require surrounding mathematical structure.

Example: `≡` may express identity, modular congruence, or another equivalence relation. V1.0 may preserve the exact glyph in visual outputs, but generic TTS is not declared safe for this token until a contextual semantic parser/verbalizer identifies the intended meaning.

A context-dependent symbol MUST NOT receive a fabricated universal narration merely to keep the pipeline running.

## Notation Envelope

Adapters SHOULD operate on a notation envelope containing:

- source expression;
- canonical representation;
- notation profile;
- ordered semantic token trace;
- semantic signature;
- issues/failure codes.

A semantic-signature change across canonicalization or output conversion is `MATH_NOTATION_SEMANTIC_LOSS`.

The token signature is a preservation guard, not a proof of full expression equivalence.

## Fail-closed rules

1. An unknown or ambiguous registered mathematical symbol MUST NOT be silently replaced by a visually similar symbol.
2. If a renderer cannot preserve the registered role, it MUST report `MATH_NOTATION_RENDER_FAILURE`.
3. If parsing cannot determine the intended profile/context semantics needed for the requested output, it MUST fail rather than guess.
4. Loss of semantic modifiers is forbidden. Examples include:
   - `\vec{AB}` → `AB`;
   - `\leq` → `<`;
   - automatic substitution between `\subset`, `\subseteq`, and `\subsetneq` without profile-aware semantic validation;
   - interval endpoint changes such as `(a;b]` → `[a;b]`;
   - perpendicular/parallel substitutions by visually similar glyphs.
5. Plain text fallback is allowed only when it preserves meaning explicitly and is declared by the output adapter.

## Pedagogical requirements

Notation MUST be appropriate to the relevant GDPT 2018 / high-school mathematics context and remain internally consistent within one artifact. A mathematically valid alternative notation MUST NOT be introduced automatically when it changes the notation convention seen by students without an explicit profile or author decision.

Video additionally MUST preserve:

- readable sign, exponent, subscript, vector/arrow and interval markers;
- sufficient display duration and size;
- synchronized Vietnamese narration;
- consistent spoken meaning for the same resolved semantic role.

## Scope of V1.0 proposal

V1.0 begins with high-frequency high-school notation: relations, set membership, set inclusion, logic, geometry, vectors, common operators, limits, sums/products, roots, integrals, and core number sets.

Full expression-level equivalence checking remains the responsibility of Math IR / Math QA. Composite grammar such as interval structure, absolute-value/determinant bars, contextual arrows, matrices/cases, derivative syntax and nested verbalization requires later expression-level work.

## Approval gate

This file remains `DRAFT / PROPOSED` until Impact Analysis, Conflict Check, regression testing, cross-output verification for every claimed channel, and explicit human approval are complete. It MUST NOT be treated as LOCKED/CANONICAL before that transition.
