# MST-MATH Math Notation V1.0 — Impact Analysis & Conflict Check

Status: **DRAFT REVIEW ARTIFACT**  
Target proposal: `PIMATH-DNA-MATH-NOTATION-V1.0`

## Audit scope

Reviewed current notation-related paths before proposing the new standard:

- `src/modules/math-ir/*`
- `src/modules/document-engine/latex/serializer.ts`
- `manim_toolkit/latex_utils.py`
- `src/utils/pronunciation.ts`
- existing registry/authority conventions
- current CI/package scripts

## Findings

### 1. Math IR is already the correct semantic source layer

Existing Math IR validation and serialization provide a suitable upstream authority. The notation layer should consume/validate Math IR semantics rather than replace Math IR.

### 2. LaTeX document serialization is deterministic but not notation-registry aware

The current serializer emits `expression.latex` when present and otherwise reports unsupported serialization. This is safer than guessing, but it does not yet validate every notation token against one cross-output semantic registry.

### 3. Manim helper validation is syntactic, not semantic

`manim_toolkit/latex_utils.py` currently checks basic input validity such as empty input and balanced braces before creating `MathTex`. It does not prove that a visually rendered token still carries the intended mathematical semantics.

### 4. Vietnamese TTS has a useful math dictionary but it is a separate authority

`src/utils/pronunciation.ts` contains regex-based mappings for many symbols. It is not generated from or validated against a shared notation registry, so display semantics and spoken semantics can drift.

### 5. Pedagogical convention conflict detected: subset notation

A first-pass global interpretation of `⊂` as `PROPER_SUBSET` was rejected during audit. Vietnamese high-school/GDPT materials commonly use `A ⊂ B` for inclusive subset semantics, including reflexivity. Therefore set-inclusion notation must support a curriculum/profile convention.

Resolution in this proposal:

- introduce `VN_GDPT2018` notation profile;
- `⊂` is profile-dependent and fails closed without profile context;
- under `VN_GDPT2018`, `⊂` resolves to inclusive subset semantics;
- proposed unambiguous proper-subset role uses `⊊` / `\\subsetneq`.

### 6. No existing LOCKED/CANONICAL standard needs in-place mutation

The proposal is additive. Existing locked files remain untouched.

## Impact matrix

| Area | Current impact | Required before canonical lock |
|---|---|---|
| Math IR | No schema change in this PR | Decide canonical carrier for `notationProfile` |
| Document/LaTeX | No production behavior change | Bind token validation before final serialization |
| DOCX/OMML | No production behavior change | Add semantic round-trip golden cases |
| HTML/KaTeX | No production behavior change | Add registry-aware render adapter tests |
| Slides | No production behavior change | Add semantic source/round-trip checks |
| Manim/Video | No production behavior change | Add notation validation + frame golden QA |
| TTS | No production behavior change | Derive/validate pronunciation from semantic IDs |
| CI | Token-level notation QA added to `qa:ci` | Add cross-output golden suites |

## Regression status

Implemented in this branch:

- registry integrity validation;
- alias collision detection;
- fail-closed unknown token handling;
- output capability checks;
- profile-required handling for convention-dependent tokens;
- `VN_GDPT2018` subset regression case;
- token-level QA command wired into `qa:ci`.

Not yet demonstrated in this branch:

- real PDF golden render comparison;
- DOCX/OMML semantic round trip;
- HTML/KaTeX visual golden;
- Slides render golden;
- Manim frame golden for notation;
- display ↔ narration semantic-ID comparison.

## Recommendation

Keep `PIMATH-DNA-MATH-NOTATION-V1.0` as `DRAFT / PROPOSED`.

Do not transition it to `APPROVED / CANONICAL / LOCKED` until:

1. notation-profile carrier is agreed;
2. all output adapters have semantic preservation checks;
3. cross-output golden regression passes;
4. human approval is explicit.
