# MST-MATH FINAL COMPLETION CUT V1

STATUS=PROPOSED_FOR_EXECUTION
CONTROL_ROOM_DISPOSITION=ACCEPTED_WITH_LIVE_TRUTH_CORRECTION
TRACKING_ISSUE=52
CONVERGENCE_ISSUE=33

## Execution freeze

- `FEATURE_EXPANSION=FROZEN`
- `NEW_CORE_ARCHITECTURE=FORBIDDEN`
- `SOLE_TARGET=integration/mst-math-convergence-v1`
- `PRIMARY_PRODUCT=TEACHER_WORKSPACE + P01_GOLDEN`
- `PRIMARY_QUALITY_RULE=NO_EVIDENCE → NO_PASS`
- `REAL_WORLD=FAIL/REVIEW_CLOSED_UNTIL_VERIFIED`
- `TOOLMATH_LEARNING=UX_ONLY / NO_ARCHITECTURE_COPY`
- `NEXT_PRODUCT_MILESTONE=DEMO_BASELINE`
- `PROMOTION=ONLY_AFTER_6_COMPLETION_GATES_PASS`

## Authoritative sequence

`CI exact-head → Control Room Truth → Mac B3 evidence reconciliation → QA Truth → Teacher Workflow → P01 Real Golden → Native/Human Acceptance → Protect Main → Merge/Tag Demo`

### Live-truth correction

At the adoption audit:
- convergence HEAD is `24f0d0355d31737ff25133ebcfdc0faafb3527fe`;
- exact-head Convergence CI run #53 completed SUCCESS;
- Mac R1 structural-numbering was already reconciled by a safe successor; the recovered side branch is forensic only;
- `audit/mac-b-teacher-readiness-consumer-v1@4ad5c66...` is already an ancestor of current convergence;
- therefore Mac B3 work from here is **report/evidence reconciliation**, not a code re-merge;
- QA truth/provider/curriculum/visual fail-closed stabilization is already merged and CI-certified;
- P01 Real Golden remains open and unproven;
- main protection remains OFF.

## Six completion gates

### G1 — CONVERGENCE TRUTH

Must prove:
- exact-head convergence CI PASS;
- Project Control matches live repository truth;
- Mac B3 code lineage is verified in current convergence;
- missing B3 final report/evidence is found or explicitly dispositioned without re-merging old code.

Exit: `G1_CONVERGENCE_TRUTH=PASS`

### G2 — QA TRUTH

Must prove:
- no proxy PASS;
- no QA dimension PASS without dimension-specific evidence;
- configured provider is not treated as connected;
- unknown curriculum context is not silently defaulted;
- AI proposal is not promoted to verified/source/human truth;
- visual/provider failure cannot fabricate mathematics;
- unverified real-world data/assumptions cannot PASS.

Exit: `G2_QA_TRUTH=PASS`

### G3 — TEACHER WORKFLOW

Must prove the authoritative teacher path:

`Source → Work/Process → QA → Result/Export`

Required:
- readiness/export guards are authoritative;
- UI consumes backend authority rather than recreating it;
- question/assessment refs remain authoritative;
- teacher smoke/E2E path passes on the frozen candidate SHA.

Exit: `G3_TEACHER_WORKFLOW=PASS`

### G4 — P01 REAL GOLDEN

Minimum real evidence:

`REAL DOCX → ingest → DocumentIR → validation → Content Model → Lesson Blueprint → Activity Graph → Visual Requirements → LessonIR → P01_LEARNING_MATERIAL → QA → renderer → PDF + DOCX + HTML`

Required:
- no content loss;
- math correctness/typography retained;
- figures/tables remain correctly associated;
- semantic icon identity remains consistent under current active authority;
- layout/pagination valid;
- semantic equivalence across minimum outputs;
- provenance retained;
- accessibility does not rely on icon alone.

Exit:
- `P01_REAL_E2E_GATE=PASS`
- `P01_MATH_TYPOGRAPHY_QA=PASS`
- `P01_OUTPUT_SEMANTIC_EQUIVALENCE_QA=PASS`

### G5 — NATIVE / HUMAN ACCEPTANCE

Required:
- native demo runtime on target machine(s);
- real authorized artifacts;
- Local Render Bridge/runtime dependencies where the demo needs them;
- teacher-facing readability/usability acceptance;
- `P0=0`;
- `P1=0`;
- explicit Human Product Owner acceptance.

Machine/AI evidence cannot set Human Acceptance PASS.

Exit: `G5_NATIVE_HUMAN_ACCEPTANCE=PASS`

### G6 — RELEASE GOVERNANCE

Required:
- freeze final promotion SHA;
- no unresolved parallel authority affecting Demo Baseline;
- main protection / required checks enabled or explicitly dispositioned;
- controlled convergence→main promotion path ready.

Exit: `G6_RELEASE_GOVERNANCE=PASS`

## Promotion

Only after G1–G6 PASS:

`Protect Main → controlled convergence→main merge → post-merge CI → tag Demo Baseline`

## Explicitly out of cut

Unless a failed completion gate provides direct evidence that the work is necessary:
- new features;
- new core architecture;
- storage migration / SQLite / PostgreSQL / vector-search stack;
- full legacy branch/PR merges;
- QuestionIR/DocumentIR semantic redesign;
- broad canonical brand/authority rewrite;
- Semantic Icon V1.2 runtime activation;
- FOLD/Geometry feature expansion;
- unrelated refactor/dependency/toolchain upgrades;
- speculative optimization without benchmark evidence.

## ToolMath learning boundary

`OBSERVE UX PATTERNS → ADAPT NON-DESTRUCTIVE UX ONLY → DO NOT COPY ARCHITECTURE / AUTHORITY MODEL`

## Real-world rule

For real-world problems, correct arithmetic alone is insufficient. Source values, assumptions, units, time/context, feasibility, and answer plausibility must be verified when applicable.

`REAL_WORLD_UNVERIFIED → NO_PASS`

## Governance preservation

This Completion Cut is an operational execution contract. It does not mutate locked/canonical DNA and does not activate a versioned successor.

`LOCKED DOES NOT MEAN UNCHANGEABLE FOREVER. LOCKED MEANS IMMUTABLE IN PLACE. ALL CHANGES REQUIRE A VERSIONED SUCCESSOR.`
