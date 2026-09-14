# MST-MATH Math Notation Unification Architecture V1.0

Status: **DRAFT / PROPOSED / IMPLEMENTATION IN PR #29**  
Parent proposal: `PIMATH-DNA-MATH-NOTATION-V1.0`  
Locked predecessors modified in place: **NONE**

## 1. Problem statement

Production previously had three partially independent notation paths:

1. Document Engine trusted `MathExpression.latex` and serialized it directly.
2. Manim `safe_mathtex` primarily checked basic LaTeX structure before rendering.
3. Vietnamese TTS maintained a separate regex/dictionary mapping for mathematical symbols.

Each component was locally useful, but the architecture allowed semantic drift. A relation could be rendered one way, narrated another way, or normalized differently between document and video output.

## 2. Expert critique of naive unification

### Rejected: one giant glyph dictionary

A single dictionary of `glyph → meaning → pronunciation` is not sufficient. Many mathematical notations are contextual:

- `⊂` depends on notation/curriculum convention;
- `≡` can denote identity, congruence modulo, or another equivalence relation;
- `−` can be unary negation, binary subtraction, or part of a signed number;
- vertical bars can represent absolute value, determinant, norm, divisibility, conditional probability, or set-builder syntax;
- arrow notation can represent vector, ray, mapping, implication, limit direction, or transformation depending on structure and context.

Treating these as universal token meanings would create mathematically plausible but pedagogically wrong output.

### Rejected: rewrite Math IR immediately

A new expression AST inside Math IR would eventually provide stronger guarantees, but modifying the existing Math IR contract now would create a larger compatibility surface and may require a versioned successor of the IR itself. V1.0 therefore uses an additive adapter layer and does not mutate locked/canonical contracts in place.

### Rejected: renderer-specific fixes

Patching Document, Manim, HTML, Slides, and TTS independently would preserve the current drift problem and increase regression cost.

## 3. Chosen architecture

```text
MATHEMATICAL SOURCE / MATH IR
          │
          │ semantic intent remains authoritative
          ▼
MST-MATH NOTATION AUTHORITY
  - one machine-readable registry
  - notation profile
  - canonical representation
  - output support declaration
          │
          ▼
NOTATION ENVELOPE
  - source expression
  - canonical LaTeX
  - semantic token trace
  - semantic signature
  - profile
  - issues / failure codes
          │
          ├──────────► Document / PDF / LaTeX
          ├──────────► DOCX / OMML
          ├──────────► HTML math renderer
          ├──────────► Slides equation renderer
          ├──────────► Manim / Video
          └──────────► TTS semantic verbalizer
                         │
                         ▼
                  POST-OUTPUT QA
```

### Authority rule

**Math IR is the mathematical source of truth. The notation registry is the source of truth for how known semantics are represented under a declared notation profile. A renderer is never a mathematical authority.**

## 4. One registry, multiple language adapters

The machine-readable source is:

`registry/pimath-dna-math-notation-v1.0.json`

TypeScript and Python consume that same JSON registry. They may implement language-specific adapter code, but MUST NOT maintain independent mathematical symbol tables for registered notation.

This is intentionally different from duplicating a TypeScript dictionary and a Python dictionary.

## 5. Notation Envelope

The TypeScript adapter creates a `MathNotationEnvelope` containing:

- original source;
- notation profile;
- canonical LaTeX;
- ordered semantic token trace;
- ordered semantic signature;
- structured issues.

Example semantic signature:

```text
set.subset:SUBSET_INCLUSIVE
relation.less_equal:LESS_THAN_OR_EQUAL
geometry.perpendicular:PERPENDICULAR
```

The signature can be compared before and after an adapter transformation. A changed signature is `MATH_NOTATION_SEMANTIC_LOSS`.

The signature is not a replacement for full expression equivalence checking. It protects registered notation identity while Math IR / Math QA remains responsible for mathematical equivalence.

## 6. Profile-dependent vs context-dependent notation

These are different problems and MUST NOT be conflated.

### Profile-dependent

The meaning/convention is stable after selecting a pedagogical profile.

Example: `⊂` under `VN_GDPT2018` is treated according to the approved Vietnamese high-school subset convention. Without a profile, resolution fails closed.

### Context-dependent

A profile alone is not enough; the surrounding mathematical structure is required.

Example: `≡` may mean identity, modular congruence, or another equivalence relation. V1.0 permits visual preservation of the exact symbol, but generic TTS is not declared supported. Narration MUST fail closed until a contextual semantic parser/verbalizer resolves the meaning.

This distinction prevents a dangerous architecture in which typography silently decides mathematics.

## 7. TTS architecture

TTS is split into two layers:

1. **Registered semantic notation** — pronunciation comes from the shared notation authority.
2. **Contextual verbalization** — fractions, indexed roots, exponents, coordinates, expression grouping, and other structured language remain in a semantic verbalizer.

The contextual verbalizer MUST consume semantic identity where available. It MUST NOT redefine registered notation independently.

## 8. Document/PDF policy

Before LaTeX serialization:

1. validate Math IR;
2. prepare the expression through Math Notation Authority;
3. canonicalize registered tokens;
4. block output on notation ambiguity or declared render failure;
5. serialize only after the notation envelope passes.

An unsupported expression may not be presented as successfully validated mathematics.

## 9. Manim/Video policy

`safe_mathtex` now performs two distinct checks:

1. LaTeX structural validation;
2. registered notation canonicalization using the same JSON authority.

Future visual QA must verify that the rendered frame preserves semantic modifiers such as arrows, exponents, subscripts, inequality strength, interval endpoints, and geometry relation marks.

## 10. Coverage gaps that remain after this PR

Token unification is necessary but not sufficient. The following require later expression-level grammar/AST support or registry expansion:

- unary vs binary minus;
- absolute value / determinant / norm / divisibility vertical bars;
- interval grammar and open/closed endpoints as structured objects;
- set-builder notation;
- function mapping arrows and limit-direction arrows;
- matrices, determinants, systems and cases;
- derivatives, differentials, partial derivatives and higher-order derivatives;
- indexed roots with nested expressions;
- fractions with nested structures;
- logarithm bases and complex superscript/subscript structures;
- trigonometric inverse/power notation;
- Greek-letter variants and domain-specific naming;
- probability/conditional probability notation;
- combinatorics and binomial coefficients;
- degrees, primes, hats, bars, overlines and conjugation;
- geometry composite notation for line/ray/segment/plane conventions;
- units and quantity typography;
- decimal comma/decimal point and coordinate separators by locale/profile.

These gaps MUST NOT be hidden by claiming V1.0 provides full expression-semantic assurance.

## 11. Migration phases

### Phase A — authority foundation

- registry;
- profile semantics;
- fail-closed codes;
- token QA.

Status in PR #29: implemented.

### Phase B — production convergence

- shared TypeScript runtime authority;
- Document/PDF adapter integration;
- TTS authority integration;
- Python/Manim shared-registry adapter;
- semantic-signature regression.

Status in PR #29: implemented, pending CI/runtime verification.

### Phase C — remaining output adapters

- DOCX/OMML semantic round trip;
- HTML/KaTeX adapter;
- Slides equation adapter;
- output-specific semantic trace.

Status: required before canonical lock if those outputs are claimed by V1.0.

### Phase D — expression semantics successor

Introduce a versioned expression grammar/AST or Math IR successor for context-sensitive notation. This is a separate governance decision and MUST NOT be smuggled into the current locked Math IR contract.

## 12. Canonicalization gate

`PIMATH-DNA-MATH-NOTATION-V1.0` MUST remain DRAFT until all claimed output channels demonstrate:

- registry integrity PASS;
- TypeScript token QA PASS;
- Document + TTS integration PASS;
- Python/Manim shared-registry parity PASS;
- DOCX/OMML golden PASS;
- HTML golden PASS;
- Slides golden PASS;
- Video/Manim visual golden PASS;
- TTS semantic/narration golden PASS;
- existing project regression PASS;
- human approval.

If V1.0 is approved before all channels are implemented, its declared `outputChannels` MUST be narrowed to only the channels proven by regression. Unsupported channels cannot be marketed as guaranteed.
