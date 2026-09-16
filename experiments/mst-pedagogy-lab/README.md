# MST Pedagogy Lab

Status: EXPERIMENTAL / ISOLATED / NOT PRODUCTION

This lab explores pedagogical analysis contracts for MST-MATH without modifying Core runtime behavior, production authorities, input architecture, QuestionIR, DocumentIR, release gates, or root dependencies.

## V1 objective

Prove three properties before any AI exercise generator or third-party parser is integrated:

1. **Authority safety** — MST Canonical IR remains the only canonical truth; external systems can only emit candidate evidence.
2. **Provenance completeness** — every recovered, analyzed, or generated artifact can be traced to its source, engine/version, and validation state.
3. **Deterministic fail-closed policy** — conflicts become `REVIEW_REQUIRED`, `UNSUPPORTED`, or `ERROR`; no numeric confidence score may silently override disagreement.

## Explicit non-goals

V1 does **not**:

- install or import Marker, MinerU, MathOCR, Pix2Text, QuizWeaver, MisstepMath, EDUMATH, or Math-Verify;
- change MST input/OCR architecture;
- write into Canonical IR;
- generate production questions;
- add an MST module number;
- add root dependencies or release-gate requirements;
- modify production UI or output profiles.

## Layout

- `RFC-0001.md` — architecture and promotion criteria.
- `contracts/` — fail-closed JSON contracts.
- `src/policy.mjs` — deterministic authority/recovery routing policy.
- `src/validate.mjs` — dependency-free invariant validation.
- `tests/contract-smoke.mjs` — smoke tests for authority, provenance, and conflict behavior.
- `fixtures/` — small contract examples, not a production golden corpus.
- `THIRD_PARTY_COMPONENTS.lock.md` — license/dependency intake ledger. No runtime third-party component is approved yet.

## Run locally

From this directory:

```powershell
node .\tests\contract-smoke.mjs
```

No package installation is required.

## Promotion rule

Nothing in this lab may be promoted into MST-MATH Core until `WORKING_BASELINE=PASS` / Core `FUNCTIONAL/STABLE`, the lab has a reviewed golden corpus, deterministic gates pass, licensing is cleared, dependency isolation is demonstrated, and Human Authority approves the production contract.
