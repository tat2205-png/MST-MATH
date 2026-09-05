# MST-MATH INTERNAL PILOT V1 — HUMAN ACCEPTANCE

STATUS=PENDING_HUMAN_EXECUTION
SELF_CERTIFICATION_FORBIDDEN=YES

## Rule

Machine/AI review may prepare evidence, detect defects, classify severity, and recommend GO/BLOCK. Only the Human Product Owner may set G4_HUMAN=PASS.

## Human scenarios

Run these through the normal app UI, not by directly calling internal APIs unless a scenario explicitly requires diagnosis.

1. Launch MST-MATH and reach the Teacher Workspace.
2. Import the selected real Golden-A DOCX.
3. Review detected questions and confirm source text/data fidelity.
4. Correct one editable question field and save through the intended UI flow.
5. Search the Question Bank and find/select stable Question IDs.
6. Create an Assessment from selected questions.
7. Generate/export PDF and open it visually.
8. Generate/export DOCX and open it in Microsoft Word where available.
9. Generate the Golden-C P01 learning material and inspect student usability.
10. Verify figures/tables belong to the correct question and are not cropped/overlapping.
11. Verify answer/key section and mathematical notation on artifacts where applicable.
12. Run Golden-B verified solution generation.
13. Render/play the Golden-B MP4.
14. Run Negative-A unsupported/insufficient input and confirm the app blocks safely.
15. Repeat one ordinary workflow to confirm results are reproducible rather than one-off.

## Severity policy

### P0 — Critical — blocks demo/pilot
- wrong mathematics or answer presented as correct;
- source/data corruption or silent factual mutation;
- canonical/provenance loss affecting trust;
- crash/data loss on the critical path;
- hallucinated answer/geometry/source fact exported as valid.

### P1 — Major — blocks demo/pilot
- critical teacher workflow cannot complete;
- required PDF/DOCX/video artifact cannot be produced/opened;
- severe pagination/figure/math-rendering defect makes output unusable;
- teacher cannot identify or recover from a correctness-affecting failure.

### P2 — Medium — does not block internal demo unless accumulated impact makes the workflow unusable
- confusing wording;
- excessive clicks;
- non-critical spacing/icon/layout defects;
- minor visual inconsistency.

### P3 — Enhancement — post-pilot
- optional feature requests;
- cosmetic polish;
- extra filters/themes/animation.

## Human sign-off

Fill only after G1/G2/G3 are PASS.

- G4_HUMAN: PENDING / PASS / BLOCK
- PRODUCT_OWNER: ____________________
- DATE: ____________________
- PILOT_SHA: ____________________
- P0_OPEN: ____
- P1_OPEN: ____
- P2_OPEN: ____
- P3_OPEN: ____
- DECISION: INTERNAL_PILOT_GO / INTERNAL_PILOT_BLOCK
- NOTES: ____________________

## GO rule

G4_HUMAN=PASS requires:
- all critical scenarios completed;
- P0_OPEN=0;
- P1_OPEN=0;
- the Product Owner explicitly accepts the demonstrated output/workflow.

P2/P3 items must be recorded as post-pilot backlog rather than silently forgotten.
