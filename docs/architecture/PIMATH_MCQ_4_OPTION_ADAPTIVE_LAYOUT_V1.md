# PIMATH MCQ 4-OPTION ADAPTIVE LAYOUT V1.0

STATUS=IMPLEMENTED_ON_FEATURE_BRANCH
DNA_AUTHORITY=NO
SOURCE_MUTATION=NO
VBA_DEPENDENCY=NO

## Purpose

Recreate the useful four-choice layout behavior observed in the teacher-provided BTN Word macro template without embedding, executing, or depending on VBA. PiMath keeps its own canonical typography, math, geometry, provenance, and output-profile authority.

## Observed behavior being reproduced

The supplied macro normalizes answer labels `A./B./C./D.` and uses Word paragraph/tab layout to switch between inline and line-broken answer arrangements. PiMath reproduces this behavior semantically rather than copying macro source code.

## Canonical PiMath layouts

For exactly four canonical choices `A, B, C, D`, the DOCX renderer chooses one of three layouts:

1. `FOUR_INLINE`
   - one paragraph;
   - A/B/C/D appear on one row;
   - B/C/D are aligned to deterministic Word tab stops.

2. `TWO_BY_TWO`
   - row 1: A and B;
   - row 2: C and D;
   - deterministic two-column tab stop.

3. `STACKED`
   - A, B, C and D each receive their own paragraph;
   - used for long content or block objects.

The choice order is never changed.

## Layout selection

The planner estimates visible width from text/math source content. It prefers compact layout and degrades conservatively:

`FOUR_INLINE -> TWO_BY_TWO -> STACKED`

If the option set is not exactly canonical A/B/C/D, or if an option contains a block figure/table, the planner falls back to `STACKED`.

## DOCX invariants

- no VBA execution;
- no source DOCX mutation;
- no QuestionIR/Question Bank mutation;
- no option reordering;
- math continues through the existing OMML renderer;
- figure/table options never get forced into multi-column inline layout;
- existing PiMath typography/output-profile authority remains unchanged.

## Word tab positions

Current deterministic tab positions for the standard Word content area:

- four-inline: 2340, 4680, 7020 twips;
- two-by-two: 4680 twips.

These positions are renderer tokens, not PiMath DNA authority. Future output-profile-specific values must be resolved through the appropriate layout profile rather than hardcoded as a new DNA rule.

## QA

Regression suite:

`tests/test-mcq-four-option-adaptive-layout-v1.ts`

Required gates before merge:

- `npm run lint`
- `npm run build`
- `npm run qa:regression`
- visual inspection of at least one generated DOCX containing short, medium and long four-choice questions.

Expected regression total after integration: 73 suites.
