# MST-MATH GOLDEN E2E CASES — INTERNAL DEMO V1

STATUS: READY_FOR_EXECUTION
RULE: G3 is not PASS until all four cases have evidence tied to the exact pilot SHA.

## Required evidence fields

Every Golden Case record must contain:

- `pilot_sha`
- `source_name`
- `source_sha256`
- `source_authority`
- `question_id` or lesson identifier where applicable
- `expected_truth`
- `actual_result`
- `qa_result`
- generated artifact path(s)
- artifact SHA-256 values
- blocking/warning diagnostics

## GOLDEN_A_TEACHER_DOCUMENT

Purpose: prove a real teacher document can traverse the normal teacher workflow.

Source requirements:

- real authorized DOCX;
- 5–10 representative mathematics questions preferred;
- source must be immutable for the test and hashed before ingest;
- at least one non-trivial mathematical expression;
- figure/table preferred when a suitable source exists.

Required path:

`DOCX -> canonical ingest -> detected questions -> human/teacher review surface -> approved Question IDs -> Question Bank -> Assessment -> PDF + DOCX`

PASS requires:

- source/question fidelity PASS;
- stable IDs/provenance PASS;
- no lost or cross-associated figure;
- Assessment references approved bank objects;
- PDF opens and contains expected questions;
- DOCX opens in Word during G4 and preserves required mathematics;
- no P0/P1 defect.

## GOLDEN_B_VERIFIED_SOLUTION_VIDEO

Purpose: prove verified source truth can reach the solution/video path.

Source requirements:

- real authorized problem;
- explicit answer authority available;
- answer is machine-verifiable by the supported deterministic route;
- source answer/solution is preserved when present.

Required path:

`QuestionIR/Question Bank -> deterministic verification -> solution job -> video plan -> Manim render -> MP4 -> frame/runtime QA`

PASS requires:

- answer alignment PASS;
- math verification PASS;
- source/Question ID traceability PASS;
- MP4 stream verified;
- no unsupported item is coerced into a false PASS.

Important: the historical real item `7f26811b8588-q64` is useful as fail-closed evidence but is **not** eligible to close this positive Golden Case because repository evidence records no explicit machine-verifiable answer for the supported deterministic solution route.

## GOLDEN_C_P01_STUDENT_MATERIAL

Purpose: independently prove P01 rather than inferring P01 readiness from Question Bank success.

Source requirements:

- real authorized learning source or bounded teacher source accepted by P01;
- enough structure to exercise the current P01 learning-material implementation.

Required path:

`SOURCE -> canonical content/lesson path implemented at pilot SHA -> P01 Student Learning Material -> QA -> PDF`

PASS requires, where active runtime policy applies:

- source mathematics preserved;
- pedagogical ordering is not corrupted;
- figures remain owned by the correct task;
- student workspace is present according to active policy;
- answer section is present where required;
- page numbering/layout constraints required by active policy are respected;
- PDF opens and is human-reviewable.

If current runtime lacks a required P01 stage, record `BLOCKED_IMPLEMENTATION_GAP`; do not mark the case PASS from documentation alone.

## NEGATIVE_A_FAIL_CLOSED

Purpose: prove the system refuses to fabricate canonical truth.

Use an intentionally unsupported/insufficient item, for example a problem without answer authority for a route that requires deterministic verification.

Expected result must be one of the explicit supported fail-closed states, such as:

- `UNSUPPORTED_SOLUTION_GENERATION`
- `NEED_MORE_INFORMATION`
- another documented blocking state with equivalent semantics.

PASS requires:

- no invented answer;
- no invented source data;
- no artifact presented as verified when verification did not occur;
- original source object remains unchanged;
- diagnostic is actionable.

The existing QB-2C regression already exercises both mathematical rejection and `UNSUPPORTED_SOLUTION_GENERATION`; it supports this negative case, but the final G3 evidence must still identify the exact pilot SHA and selected source/test record.

## G3 decision

`G3_PASS = GOLDEN_A_PASS && GOLDEN_B_PASS && GOLDEN_C_PASS && NEGATIVE_A_PASS`

Synthetic regression fixtures are evidence of implementation contracts, not substitutes for the three positive real-source Golden Cases.
