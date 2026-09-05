# MST-MATH HUMAN ACCEPTANCE CHECKLIST — INTERNAL DEMO V1

STATUS: PENDING_HUMAN_EXECUTION
AUTHORITY: Human Product Owner
RULE: Automation may prepare evidence but may not mark this gate PASS.

## Exact build identity

- Pilot branch: `pilot/mst-math-internal-demo-v1`
- Pilot SHA: ______________________________
- Machine gate report: ____________________
- Date/time: ______________________________

## Acceptance scenarios

Mark each item `PASS`, `FAIL`, or `NOT_APPLICABLE` and record an issue ID for every FAIL.

| # | Scenario | Result | Issue |
|---|---|---|---|
| H01 | Launch the app using the documented normal workflow |  |  |
| H02 | Import a real authorized DOCX |  |  |
| H03 | Review detected questions and confirm source fidelity |  |  |
| H04 | Correct/edit one detected question without losing provenance |  |  |
| H05 | Search/select stable Question IDs in Question Bank |  |  |
| H06 | Build an Assessment from approved questions |  |  |
| H07 | Export PDF and visually inspect mathematics, figures, pagination and answers |  |  |
| H08 | Export DOCX and open it in Microsoft Word; inspect native math and layout |  |  |
| H09 | Run verified solution generation for an eligible real item |  |  |
| H10 | Render/play MP4 for the verified item and inspect math/visual fidelity |  |  |
| H11 | Run P01 Student Learning Material Golden Case and inspect student usability |  |  |
| H12 | Confirm ruled workspace/figure ownership where required by active P01 policy |  |  |
| H13 | Confirm the answer section is present and aligned where required |  |  |
| H14 | Feed an unsupported/insufficient item and verify fail-closed behavior |  |  |
| H15 | Repeat one full teacher workflow to detect nondeterministic state corruption |  |  |

## Mathematical/source acceptance

The following are zero-tolerance for the Golden Set:

- no changed numerical data;
- no changed hypothesis;
- no wrong answer key;
- no invalid mathematical notation that changes meaning;
- no invented geometry/data/source claim;
- no figure associated with the wrong question;
- no unsupported result presented as verified;
- provenance remains traceable to the source.

Any violation above is P0 unless evidence proves a lower severity without correctness risk.

## Severity summary

- P0 count: ____
- P1 count: ____
- P2 count: ____
- P3 count: ____

## Human decision

Choose exactly one:

- [ ] `APPROVE — MST_MATH_INTERNAL_DEMO=GO`
- [ ] `BLOCK — REMEDIATION_REQUIRED`

Conditions for APPROVE:

- all mandatory H scenarios PASS;
- mathematics/source correctness 100% on the Golden Set;
- P0 = 0;
- P1 = 0;
- G1, G2 and G3 have PASS evidence for the same pilot SHA.

Human Product Owner name/sign-off: __________________________
Decision date/time: _________________________________________
Notes: ______________________________________________________
