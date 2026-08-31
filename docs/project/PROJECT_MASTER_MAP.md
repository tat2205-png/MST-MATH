# PROJECT MASTER MAP — PiMath / MATH AI

**Snapshot date:** 2026-08-30  
**Umbrella project:** `PiMath / MATH AI`  
**Primary software implementation:** `Math AI Studio`  
**Standards / publishing layer:** `NA-MATH`  
**Purpose:** Single human-readable source of truth to prevent loss of prior decisions, completed work, unfinished work, deferred work, version names, gates, and project relationships.

> IMPORTANT: This file is a reconstructed master inventory from the current conversation, retained project history, prior execution logs, and project artifacts found in the user's Library. It deliberately separates **confirmed/locked** facts from **needs revalidation** items. It must not silently promote an uncertain item to DONE/APPROVED.

## AUTHORITATIVE RECONCILIATION SNAPSHOT — V1.6-FIELD-ACCEPTANCE-RECONCILIATION-01R

This repository-forensic snapshot (2026-08-31) supersedes conflicting current-status conclusions, but does not alter or invalidate historical evidence. Baseline: branch `fix/v1.6-field-acceptance-reconciliation`, HEAD `9c4bd8428e9869ce893fc86bafdee50c7902fc02`; the expected master base is an ancestor and the initial worktree was clean.

### Current authoritative conclusion

The v1.6 RC document and field report cover different gates and stages. `docs/releases/v1.6.0/RELEASE_CANDIDATE_EVIDENCE.md` records a controlled self-pilot plus machine/targeted closure at `7e10080`; `field-validation/v1.6/FIELD_ACCEPTANCE_REPORT.md` applies the separately specified Level 2 external-teacher and Level 3 classroom gate. The field dataset is empty. Therefore the RC document is valid for its controlled scope, the field report is valid for external acceptance, and neither establishes production release readiness. `READY_FOR_V1_6_RC=YES` is superseded as a current aggregate decision by `V1_6_RELEASE_READY=NO`.

No application code changed after the two recorded human visual checks; only the RC evidence and project-state documentation followed the relevant Q37/pagination fixes. `HUMAN_PAGINATION_QA=PASS` and `HUMAN_Q37_VISUAL_QA=PASS` therefore remain current. A distinct complete `HUMAN_UI_QA` approval was not found and remains `NEEDS_REVALIDATION`.

The selected Pilot-01 MCQ has no machine-verified explicit answer. The adapter's `UNSUPPORTED_SOLUTION_GENERATION` is correct fail-closed behavior, but the field contract requires PILOT-06 and PILOT-09. Consequently the selected source cannot close those required field tasks: `PILOT_SOLUTION_QA=BLOCKED` and `PILOT_VIDEO_QA=BLOCKED`. No alternate authorized real source with a verified explicit answer was proven in this reconciliation.

`package.json` and the root of `package-lock.json` both report `1.4.0`; the same value exists at the v1.5.0 tag, while v1.5.0 is a released Git version and v1.6.0 is the active release line. No separate public runtime version display was found. This is stale package/release metadata, not an intentional independent version axis. It must be corrected in a separate feature-freeze-safe packaging task together with the lockfile root metadata.

### Current release truth table

| Gate | Required | Current status | Evidence | Blocking | Owner | Next action |
|---|---:|---|---|---:|---|---|
| ARCHITECTURE_QA | YES | PASS | `npm run arch:check`: 0 errors, 3 documented warnings | NO | Machine | Retain warnings for review |
| BUILD_QA | YES | PASS | `npm run lint`; `npm run build` | NO | Machine | None |
| REGRESSION_QA | YES | PASS | `npm run qa:regression`: 70/70 | NO | Machine | None |
| NA_MATH_V2_6_QA | YES | PASS | `npm run qa:na-math-v2.6` via `qa:docx` | NO | Machine | None |
| IMPORT_QA | YES | PASS | `npm run qa:ingest`; RC Pilot-01 | NO | Machine | External observation still required |
| EXAM_QA | YES | PASS | RC Pilot-01 and Question Bank adapter evidence | NO | Machine | External observation still required |
| QUESTION_BANK_QA | YES | PASS | QB-1A–1F targeted QA | NO | Machine | External observation still required |
| PAGINATION_QA | YES | PASS | QB-1F and RC real-source evidence; direct rerun lacked source path | NO | Machine | Preserve source-path evidence |
| SELECTION_QA | YES | PASS | QB-2A and UX-01 | NO | Machine | External observation still required |
| ASSESSMENT_QA | YES | PASS | `npm run qa:assessment` | NO | Machine | External observation still required |
| GAME_QA | YES | PASS | `npm run qa:game` | NO | Machine | None |
| SOLUTION_QA | YES | PASS_CONTRACT / BLOCKED_PILOT | QB-2C passes; selected real item unsupported | YES | Human/source owner | Select an authorized real item with verified answer |
| VIDEO_QA | YES | PASS_CONTRACT / BLOCKED_PILOT | QB-2C passes; selected item cannot create solution video | YES | Human/source owner | Exercise PILOT-09 with eligible real item |
| EXPORT_QA | YES | PASS | `npm run qa:export` | NO | Machine | External visual review still required |
| DOCX_QA | YES | PASS | DOCX-1A–1F and Pilot artifact evidence | NO | Machine | Word runtime/human field review remains separate |
| WMF_QA | YES | PASS | `npm run qa:wmf` | NO | Machine | None |
| Q37_QA | YES | PASS | RC source/render/human evidence; no later application change | NO | Machine/Human | Preserve source-path evidence |
| HUMAN_PAGINATION_QA | YES | PASS | RC evidence at `7e10080` | NO | Human | None unless relevant code changes |
| HUMAN_Q37_VISUAL_QA | YES | PASS | RC evidence at `7e10080` | NO | Human | None unless relevant code changes |
| HUMAN_UI_QA | YES | NEEDS_REVALIDATION | No distinct complete approval | YES | Human | Perform and record complete UI acceptance |
| EXTERNAL_FIELD_ACCEPTANCE | YES | PENDING_REAL_WORLD_EVIDENCE | Empty field template/KPI/issue records | YES | External teachers/classroom | Execute Levels 2 and 3 and preserve raw rows |
| PACKAGE_VERSION_QA | YES | FAIL | manifests say `1.4.0` on v1.6 line | YES | Machine/release owner | Separate metadata remediation |

Current aggregate state: `V1_6_MACHINE_READY=NO`, `V1_6_HUMAN_READY=NO`, `V1_6_FIELD_READY=NO`, `V1_6_RELEASE_READY=NO`.

### Minimum legitimate acceptance checklist

1. `MACHINE_GENERATABLE`: preserve the green build, architecture, regression, ingest, Question Bank, assessment, game, solution/video contract, export, DOCX, WMF, and NA-MATH evidence; rerun Q37/pagination only with the immutable real-source path and matching SHA-256.
2. `REAL_SOURCE_REQUIRED`: use an authorized immutable real item with a machine-verifiable explicit answer for PILOT-06 and PILOT-09; do not silently replace Pilot-01 or invent an answer.
3. `HUMAN_REQUIRED`: record distinct complete UI acceptance, external teacher task results, corrections, output acceptance, visual/export review, and teacher acceptance.
4. `EXTERNAL_ENVIRONMENT_REQUIRED`: complete Level 2 with 2–3 external teachers and Level 3 supervised classroom validation; calculate KPIs only from recorded rows and retain zero open F3/F4 issues.
5. `MACHINE_GENERATABLE`: correct the package and lockfile root version metadata in a separate remediation task, then rerun typecheck, build, and regression.

### Next executable tasks

- `V1.6-PACKAGE-VERSION-METADATA-REMEDIATION-01`: align package/release metadata without feature work and validate lockfile reproducibility.
- `V1.6-EXTERNAL-FIELD-ACCEPTANCE-EXECUTION-01`: obtain the required real source, complete HUMAN_UI_QA and Levels 2/3, and record unmanufactured field rows/KPIs.

## AUTHORITATIVE RECOVERY SNAPSHOT — PROJECT-MASTER-RECOVERY-01

This repository-forensic snapshot (2026-08-30) supersedes conflicting status claims in the older reconstructed material below. Git and tracked repository artifacts are authoritative; the older material remains as recovery context only.

### 1. PROJECT IDENTITY

`PiMath / MATH AI` is the umbrella project; `Math AI Studio` is the software implementation; `NA-MATH` is the standards, pedagogy, and publishing layer. These identities are `LOCKED` and must not be collapsed.

Repository: `/Users/mac/Projects/mas-main-promotion-v1.6`; branch: `chore/project-master-recovery-01`; HEAD: `7e10080ebc8838238207c7331f9a6b9a91432c69`; historical finalization head: `fa742d2a14c82e1eb7153e9d89cb7edfe849d51e`.

### 2. GOVERNANCE

Authority is `MASTER > APPROVED ARTIFACT > ORCHESTRATOR > MODULE TASK`; principle: **AUTOMATE EXECUTION, NOT AUTHORITY**. The names `SYSTEM-ARCHITECTURE-V1.0`, `AI-GOVERNANCE-AND-CHANGE-CONTROL-V1.0`, `PROJECT-DECISION-LOG-V1.0`, `PROJECT-ROADMAP-V1.0`, and `PIMATH-AHP-V1.0` occur only in the pre-existing untracked master reconstruction, not as independently tracked canonical artifacts at HEAD; each is therefore `UNKNOWN`, not newly promoted to approved.

### 3. LOCKED DECISIONS

- Identity hierarchy and feature freeze: `LOCKED` (task authority and tracked release specifications).
- NA-MATH System V2.6 core lock and NA-MATH Layout V1.3: `LOCKED`; evidence: `standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/`, `tests/test-na-math-v2.6.ts`.
- Fail-closed math, source immutability, deterministic gates, and no parallel document pipeline: `LOCKED`; evidence: `specs/v1.6/MASTER_SPEC.md`, `docs/releases/v1.6.0/RELEASE_CANDIDATE_EVIDENCE.md`.

### 4. COMPLETED / PASS

- Question Bank QB-1A through QB-2D and QB-3A program acceptance: `PASS`; evidence: `QB_3A_ACCEPTANCE.md`, `PROJECT_CONTROL.md`, phase tests and commits `1a55926` through `a5d3d1c`. QB-0A–QB-0K exact task mapping is not independently present and remains `NEEDS_REVALIDATION` despite older prose.
- Exam QA foundation/language/logic: `PASS`; evidence: `src/modules/exam-qa/`, `tests/test-exam-qa*.ts`, commits `240c285`, `1f6b52e`, `8a3aef9`.
- DOCX export 1A–1F: `PASS` historically; evidence: commits `53610ec`–`1c4e289`, `tests/test-docx-1*.ts`. Current runtime QA was not rerun in this audit.
- NLS registry for nine KNTT sources: `PASS` historically; evidence: `docs/nls/`, `src/modules/nls-source-registry/`, v1.5 release report.
- Math/MV engine chain, Fold/Unfold/shortest-path implementations, Manim/video/image-animation, Teacher Golden Workflow UX-01, WMF pipeline, Q37 deterministic source QA, and pagination implementation: `DONE` or historical `PASS` with tracked implementation/tests. Current live runtime remains subject to release gates.

### 5. IN PROGRESS

- Math AI Studio v1.6 release finalization: `IN_PROGRESS`; RC evidence exists at HEAD, but external field acceptance is unproven.
- Brand System / BRAND-00 and Agent Web WEB-00–WEB-10: `UNKNOWN`; no independent tracked canonical implementation/status evidence was found, so older `IN_PROGRESS` language is not authoritative.

### 6. PENDING HUMAN GATES

- `HUMAN_PAGINATION_QA=PASS` and `HUMAN_Q37_VISUAL_QA=PASS` are recorded in `docs/releases/v1.6.0/RELEASE_CANDIDATE_EVIDENCE.md`.
- `HUMAN_UI_QA=NEEDS_REVALIDATION`: the RC document records two specific UI closures but no distinct complete UI approval.
- External teacher/classroom field acceptance: `PENDING_HUMAN_GATE`; `field-validation/v1.6/FIELD_ACCEPTANCE_REPORT.md` says `PENDING_REAL_WORLD_EVIDENCE` and `READY_FOR_V1_6_RC=NO`.

### 7. BLOCKED

- Final v1.6 release approval is `BLOCKED` by absent external field evidence and unresolved reconciliation between RC evidence and the field-acceptance report.
- Pilot solution gate is `BLOCKED` for the selected Pilot-01 MCQ because the repository records `UNSUPPORTED_SOLUTION_GENERATION`; this was correct fail-closed behavior, not a passed solution gate.

### 8. DEFERRED

- E2E-TEACHER-01 is `DEFERRED`; evidence: `ROADMAP.md`, `PROJECT_CONTROL.md`.
- v1.5 V15-ARCH-01 and V15-QA-01 are `DEFERRED`; V15-VIS-01 is planned experimental work; evidence: `docs/releases/v1.5.0/RELEASE_REPORT.md`.

### 9. PLANNED / NOT STARTED

The following remain `PLANNED` with no tracked implementation proof: `NA-MATH REAL-WORLD MATHEMATICS STANDARD V1.0`, `NA-MATH REAL-WORLD SOURCE & DATA STANDARD V1.0`, `NA-MATH REAL-WORLD MATRIX V1.0`, the PISA/SAT/Japan/Korea/China/India/Europe reference corpus, verified real-data registry, and `REALWORLD-00` through `REALWORLD-04`. The NA-MATH Document Converter V1.0 as a separately named product is also `PLANNED`; existing document import/export components do not prove that named converter complete.

### 10. RELEASE HISTORY

| Release | Evidence status |
|---|---|
| v1.1 | `RELEASED`; annotated tag present; LuaDraw/image-animation lineage |
| v1.2 | `RELEASED`; annotated tag present at `ceefd17` after peeling |
| v1.3-rc.1 | `RC`; tag and validation commit `e6edcfd` |
| v1.3.0 | `RELEASED`; tag at `f0f4a0d` |
| v1.3.1 | `RELEASED`; tag at `57956cd`; post-release report |
| v1.4.0 | `RELEASED`; tag at `85d6ad2`; post-release report |
| v1.5.0 | `RELEASED`; tag at `39f2271`; release report |
| v1.6.x | `DEVELOPMENT` / release candidate, no v1.6 tag; external field release gate unproven |

### 11. VERSION REGISTRY

Distinct axes: Math AI Studio releases (`v1.1`–`v1.6` development); NA-MATH System `V2.6`; Layout `V1.3`; Textbook Style `V1.0`; Student Workspace `V1.2`; Geometry Rules `V1.8/GEO8`; Math Visual Standard `V1.0`; Digital & AI Matrix `V1.0`; and separate Manim/video/image-animation task/version lines. `package.json` still says `1.4.0`, creating ambiguous package metadata relative to the v1.5 release tag and v1.6 branch; no axis is to be inferred from another.

### 12. MODULE REGISTRY

| ID/range | Canonical name or artifact | Version/status | Dependency, evidence, gate, next action |
|---|---|---|---|
| MASTER | PiMath / MATH AI governance | `UNKNOWN` artifact approval | Names recovered; canonical tracked files absent; human authority must revalidate |
| 10–13 | Knowledge foundation | `UNKNOWN` exact module registry | Older prose only; recover canonical artifacts before asserting names/status |
| 20 | Question Bank | `PASS` | QB-3A acceptance; retain regression coverage |
| 21 | Assessment Builder | `PASS` core | QB-2A; external pilot remains gated |
| 22 | Worksheet/Learning Materials | `NEEDS_REVALIDATION` | document/UI code exists; exact canonical artifact and final gate unproven |
| 23 | Math Visual & GeoGebra Studio | `DONE` implementation | geometry/dynamic-workspace modules and tests; current runtime not rerun |
| 24 | Digital Competency & Analytics | `UNKNOWN` | no independently tracked canonical matrix artifact found |
| 30 | Math/Exam QA | `PASS` | Exam QA implementations/tests |
| 31 | Classification Engine | `NEEDS_REVALIDATION` | functionality exists across modules; exact artifact approval unproven |
| 32 | Validation Engine | `DONE` | deterministic validation implementations/tests |
| 33 | Source Control / Anti-Hallucination | `DONE` | fail-closed/provenance contracts and regression evidence |
| 40–44 | Content | `UNKNOWN` exact names | range known only from reconstruction; do not invent mappings |
| 50 | Math Visual | `DONE` implementation | Math IR/dynamic visual code |
| 51 | Geometry | `PASS` historical | geometry engines, locked standards, QA files |
| 52 | Math Visual Standard | `NEEDS_REVALIDATION` | exact approved artifact not independently tracked |
| 53 | Fold/Unfold/Path | `DONE` implementation | fold/pattern/surface-path commits and tests |
| 60 | Assessment | `PASS` | QB-2A |
| 61 | Classroom Game | `PASS` | QB-2B |
| 62 | Solution/Video | `PASS` program; pilot item `BLOCKED` | QB-2C; selected real item lacks verified answer |
| 63 | Export/Delivery | `PASS` historical | QB-2D; current HEAD stabilization commit `d9eb6aa` |
| 70–75 | Data foundation | `UNKNOWN` exact current modules | no canonical tracked module registry recovered |
| 80 | PiMath orchestrator | `NEEDS_REVALIDATION` | image-animation orchestrator exists, but named PiMath artifact approval unproven |
| 81 | Automation submodule | `UNKNOWN` | exact canonical name/evidence absent |
| 82 | Automation/runtime | `PASS` historical | automation specs/tests/reports |
| 90–94 | Development | `UNKNOWN` exact names | range not independently mapped |
| 99 | Release | `BLOCKED` for v1.6 final | external field and UI approval reconciliation required |

### 13. RISKS / CONFLICTS

1. `docs/releases/v1.6.0/RELEASE_CANDIDATE_EVIDENCE.md` says RC readiness YES and Pilot-01 workflow PASS, while `field-validation/v1.6/FIELD_ACCEPTANCE_REPORT.md` says field evidence is absent and RC readiness NO. These appear to represent controlled self-pilot versus external field acceptance, but that distinction is an inference requiring human confirmation.
2. `package.json` reports `1.4.0` although v1.5.0 is tagged/reported released and v1.6 is under development.
3. Historical PASS is not current runtime PASS; this audit intentionally ran no tests/build because it is read-only and the required PowerShell runtime is unavailable in the host environment.

### 14. RECOVERY ITEMS

- Locate or formally establish tracked canonical governance artifacts and exact 00–99 module mappings.
- Reconcile controlled Pilot-01 evidence with external field-acceptance requirements.
- Obtain distinct HUMAN_UI_QA approval and field-result rows/KPIs.
- Revalidate QB-0A–0K exact mapping, named Document Converter, Digital & AI Matrix, Brand, Agent Web, and historical visual-standard approvals.

### 15. NEXT EXECUTABLE TASK

`V1_6_FIELD_ACCEPTANCE_RECONCILIATION`: without modifying product code, classify RC Pilot-01 versus external teacher/classroom field gates, collect or reference real field rows, obtain explicit HUMAN_UI_QA, and issue an authority-approved v1.6 release decision. If evidence cannot be produced, keep v1.6 blocked.

### 16. EVIDENCE / CONFIDENCE

High confidence: Git topology/tags/commits, tracked release reports, QB-3A matrix, current v1.6 RC document, and empty field-validation state. Medium confidence: historical QA status where tests were not rerun. Low/unknown confidence: canonical governance approvals, exact chat/module names for incomplete ranges, and artifacts appearing only in the pre-existing untracked reconstruction.

HEAD transition `fa742d2 → 7e10080` is linear and contains three commits: `d9eb6aa` (canonical PDF stabilization; modifies `src/modules/question-bank/export.ts` and `tests/test-question-bank-qb2d.ts`), `262b661` (macOS render bridge startup), and `7e10080` (v1.6 RC evidence). The changes match v1.6 stabilization/finalization scope. They make the old assumption that `fa742d2` was the current finalization head stale, and they close two previously pending human checks, but they do not prove final external field acceptance or a released v1.6 product.

---

## 0. STATUS LEGEND

| Status | Meaning |
|---|---|
| `LOCKED / APPROVED` | Human/canonical decision already fixed; do not change casually |
| `DONE / PASS` | Implementation or gate was reported PASS |
| `IN_PROGRESS` | Work started but not fully closed |
| `PENDING_HUMAN_GATE` | Code may be ready, but human QA/approval is still required |
| `PLANNED / NOT_STARTED` | Agreed scope, but no completion evidence |
| `DEFERRED` | Intentionally postponed |
| `NEEDS_REVALIDATION` | Prior evidence exists but current live state is not proven |
| `UNKNOWN` | Do not infer |

---

# 1. PROJECT IDENTITY — DO NOT RENAME

## 1.1 Canonical hierarchy

```text
PiMath / MATH AI                         ← UMBRELLA
│
├── Math AI Studio                       ← software / implementation studio
│
├── NA-MATH                              ← standards / publishing / visual / pedagogy layer
│
├── Knowledge & Curriculum
│   ├── GDPT 2018
│   ├── KNTT-MATH-KNOWLEDGE-BASE-V1.0
│   ├── PIMATH-MATH-ONTOLOGY-V1.0
│   └── PIMATH-DIGITAL-COMPETENCY-KNOWLEDGE-BASE-V1.0
│
└── Supporting programs / modules
    ├── Question Bank
    ├── Assessment
    ├── Worksheet / Learning Materials
    ├── Visual / GeoGebra / Geometry
    ├── Manim / Video / Image Animation
    ├── Exam QA
    ├── DOCX / Document Converter
    ├── Digital & AI Matrix
    ├── Real-World Mathematics
    ├── Brand System
    └── Agent Web
```

### LOCK
- `PiMath / MATH AI` is the umbrella name.
- `Math AI Studio` is not allowed to overwrite the umbrella identity.
- `NA-MATH` is the standards/system layer, not the umbrella project name.

---

# 2. MASTER GOVERNANCE — CHAT 00–99

## 2.1 Authority order — LOCKED

```text
Chat 00 — SYSTEM ARCHITECTURE
        ↓
Chat 02 — AI GOVERNANCE & CHANGE CONTROL
        ↓
Chat 03 — PROJECT DECISION LOG
        ↓
Chat 01 — PROJECT ROADMAP
        ↓
PIMATH-AHP-V1.0
        ↓
Approved domain artifacts
        ↓
Project State / Orchestrator
        ↓
Current module task
```

Canonical conflict rule:

```text
MASTER > APPROVED ARTIFACT > ORCHESTRATOR > MODULE TASK
```

Core principle:

> **Automate execution, not authority.**

Human retains final authority for architecture, governance, curriculum, breaking changes, security, and production release.

## 2.2 Master artifacts

| Chat | Artifact | Status |
|---|---|---|
| 00 | `SYSTEM-ARCHITECTURE-V1.0` | `APPROVED / DONE` |
| 01 | `PROJECT-ROADMAP-V1.0` | `DONE` |
| 02 | `AI-GOVERNANCE-AND-CHANGE-CONTROL-V1.0` | artifact exists; historical status has conflicting records → `NEEDS_REVALIDATION` |
| 03 | `PROJECT-DECISION-LOG-V1.0` | `DONE / EXISTS` |

## 2.3 Cross-chat protocol

**Artifact:** `PIMATH-AHP-V1.0`  
**Status:** `APPROVED`  
**Effective:** 2026-08-17

Role: startup, dependency recovery, validation, artifact versioning, handoff, and next-chat routing. It does **not** change authority of Chat 00–03.

## 2.4 Zero-Inference / Fail-Closed rules

Previously established principles include: no inferred approval; no inferred dependency/status/version/Definition of Done/evidence; preserve evidence states; fail closed; `RECOVER ≠ REPAIR`; no mock/fallback/hardcoded PASS; source verification before downstream use.

A V1.1 change request for stricter zero-inference was proposed. **Current canonical approval status:** `NEEDS_REVALIDATION` before treating V1.1 as approved.

---

# 3. CANONICAL ARCHITECTURE MAP

## 3.1 Knowledge Foundation — 10–13

| Chat | Name / Artifact | Status |
|---|---|---|
| 10 | `GDPT2018-MATH-KNOWLEDGE-BASE-V1.0` | canonical foundation |
| 11 | `KNTT-MATH-KNOWLEDGE-BASE-V1.0` | canonical foundation |
| 12 | `PIMATH-MATH-ONTOLOGY-V1.0` | built as ontology layer |
| 13 | `PIMATH-DIGITAL-COMPETENCY-KNOWLEDGE-BASE-V1.0` | canonical foundation |

Ownership rules: Chat 11 owns Grade → Chapter → Lesson → Topic; Chat 12 owns canonical mathematical entities, skills, problem types, strategies, misconceptions, and graph relationships; Chat 13 owns digital competency knowledge. Do not flatten everything into one free-text `topic`.

## 3.2 Core Apps — 20–24 baseline

| Chat | App | Status |
|---|---|---|
| 20 | Question Bank | baseline app |
| 21 | AI Test & Assessment Builder | baseline app; historic in-progress/final-gate work |
| 22 | `PIMATH-WORKSHEET-AND-LEARNING-MATERIAL-STUDIO-V1.0` | `REVIEW / VALIDATED_FOR_REVIEW`; final completion gate historically `NOT_RUN` |
| 23 | Math Visual & GeoGebra Studio | baseline app |
| 24 | Digital Competency & Analytics Studio | baseline app |

## 3.3 Shared Engines — 30–33

| Chat | Engine | Known artifact/status |
|---|---|---|
| 30 | Math QA Engine | canonical engine role |
| 31 | Classification Engine | `PIMATH-CLASSIFICATION-ENGINE-V1.0`; `REVIEW / READY_WITH_ASSUMPTIONS` historically |
| 32 | Validation Engine | canonical engine role |
| 33 | Anti-Hallucination & Source Control | canonical engine role |

Canonical pipeline:

```text
retrieval → generation → classification → Math QA → validation → source control → teacher review → output
```

## 3.4 Content / Assessment / Visual ranges

Prior architecture defines Content `40–44`, Visual `50–53`, Assessment `60–63`.

Known exact evidence: Chat 40 = Question Bank domain reference; Chat 52 produced `MATH-VISUAL-STANDARD-V1.0`. Exact canonical names for every chat in these ranges have not all been recovered. **Status:** `NEEDS_REVALIDATION`; do not invent missing chat names.

## 3.5 Data Foundation — 70–75

| Chat | Name | Artifact / role | Status |
|---|---|---|---|
| 70 | Database | `PIMATH-DATABASE-ARCHITECTURE-V1.0` | historical DONE |
| 71 | Metadata & Tagging | `PIMATH-METADATA-AND-TAGGING-ARCHITECTURE-V1.0` | historical DONE |
| 72 | Cloud & Supabase | physical/cloud implementation layer | needs current revalidation |
| 73 | Import / Export | data interchange pipeline | needs current revalidation |
| 74 | Backup, Versioning & Migration | resilience/version layer | needs current revalidation |
| 75 | Security / Access | security/access layer | needs current revalidation |

Data principles: data integrity → traceability → versioning → queryability → extensibility → performance; do not lock architecture to Supabase too early; canonical entity ≠ metadata ≠ tag ≠ label ≠ workflow status; controlled vocabulary first.

## 3.6 Automation — 80–82

### Chat 80
**Artifact:** `PIMATH-AUTONOMOUS-PROJECT-ORCHESTRATOR-V1.0`  
**Status:** `BASELINE CANDIDATE`  
**Scope:** Chat 00–99  
**Protocol dependency:** `PIMATH-AHP-V1.0`  
**Target autonomy:** Level 3 — Autonomous with Gates.

State files/contracts: `PIMATH-PROJECT-STATE.json`, Artifact Registry, Dependency Graph, Execution Queue, Blocker Register, Execution Log.

State machine:

```text
NOT_STARTED
READY
IN_PROGRESS
VALIDATING
REPAIRING
HUMAN_REVIEW
BLOCKED
DONE
DEPRECATED
```

Canonical commands: `BOOTSTRAP PIMATH ORCHESTRATOR`, `RUN PIMATH`, `RESUME PIMATH`, `STATUS PIMATH`, `NEXT PIMATH`, `PAUSE PIMATH`, `VALIDATE PIMATH`, `REPAIR PIMATH`, `RELEASE CHECK`.

Chat 82 has prior evidence as batch pipeline/automation scope, but exact complete canonical mapping of 81–82 must be revalidated.

## 3.7 Development / Release

DEV range: `90–94`. Release: `99 – RELEASE`.

Release gate must cover at least:

```text
architecture_pass
governance_pass
knowledge_pass
data_pass
engine_pass
app_pass
content_pass
assessment_pass
visual_pass
integration_pass
qa_pass
security_pass
deployment_pass
backup_pass
release_approval
```

Any critical FAIL ⇒ `RELEASE_STATUS = BLOCKED`.

---

# 4. FEATURE-FREEZE DECISION

**Decision date:** 2026-08-26  
**Status:** `LOCKED`

> Temporarily stop new feature development. Only complete, stabilize, test, integrate, package, and bring the existing product into real use.

Interpretation: new work should preferably be completion/integration/standardization. Do not casually open unrelated feature scope.

---

# 5. MATH AI STUDIO RELEASE / INTEGRATION HISTORY

## 5.1 Known release lineage

| Version / line | Evidence | Status |
|---|---|---|
| v1.1 | `main` historically at `9d6cda6`; image-animation LuaDraw integration present | released historical baseline |
| v1.2 | tag `v1.2` at `ceefd17`; `develop/v1.2` later received architecture guard work (`cc95fa1`) while tag stayed immutable | `LOCKED historical release` |
| v1.3 RC1 | tag `v1.3-rc.1` at `e6edcfd...` | `RC_VALIDATED` |
| v1.3.1 | tag `v1.3.1`; release head `57956cd3d55482e8252d7ece1b2d617831c492f0` | GitHub release reported verified |
| v1.4.0 | `develop/v1.4.0` existed; `E2E-TEACHER-01` targeted from deferred v1.3.1 roadmap | final release status `NEEDS_REVALIDATION` |
| v1.6.0 | branch `develop/v1.6.0`; finalization snapshot head `fa742d2a14c82e1eb7153e9d89cb7edfe849d51e` | code/worktree clean, but human/pilot hard gates pending |

## 5.2 Important integration branches / commits

| Branch / checkpoint | Commit / note |
|---|---|
| `chore/na-math-v2-6-standards-integration` | `7fe8fe5...` |
| `feature/docx-export-v1` | `1c4e289...` |
| `integration/mas-int-01-post-qb` | `c848cf5...` |
| `integration/mas-int-01-finalize` | `9ab864f...` |
| `integration/mas-final-convergence` | `ab7d978...` |
| `checkpoint/release-gate-v1-locked` | prior locked checkpoint |
| `checkpoint/production-ui-v1-locked` | prior locked checkpoint |
| `checkpoint/golden-path-v1-locked` | prior locked checkpoint |

## 5.3 Current v1.6 product-readiness gates

At the latest finalization snapshot:

```text
HUMAN_PAGINATION_QA=PENDING
HUMAN_Q37_VISUAL_QA=PENDING
HUMAN_UI_QA=PENDING

PILOT_IMPORT_QA=NOT_RUN_HARD_GATE
PILOT_EXAM_QA=NOT_RUN_HARD_GATE
PILOT_QUESTION_BANK_QA=NOT_RUN_HARD_GATE
PILOT_PAGINATION_QA=NOT_RUN_HARD_GATE
PILOT_SELECTION_QA=NOT_RUN_HARD_GATE
PILOT_ASSESSMENT_QA=NOT_RUN_HARD_GATE
PILOT_SOLUTION_QA=NOT_RUN_HARD_GATE
```

**Conclusion:** v1.6 is **not yet a final product release** until these human/pilot gates are closed.

---

# 6. QUESTION BANK — NA_MATH_QUESTION_BANK_V1

Historical dedicated repo: `D:\math-ai-video-studio\math-ai-studio-question-bank`  
Branch: `feature/question-bank-v1`  
Later integrated into Math AI Studio.

## 6.1 Completed phases

### QB-0A → QB-0K
Reported PASS, including Vietnamese UTF-8 fidelity, LaTeX preservation, real import UI, and `QB_0K_REAL_IMPORT_UI=PASS`.

### QB-1A → QB-1F
Reported PASS: document segmentation; DOCX/PDF extraction; OMML/LaTeX parsing; figure association; persistence; idempotent import; provenance; duplicate detection; search/filter; math search; safe reuse; Exam QA integration.

Historical real corpus: 10 files (6 DOCX + 4 PDF), 78 detected questions, 592 assets found, 590 mapped, 9 solutions found, 74 review, 4 quarantined.

### QB-2A
Assessment generation core was a required precondition for QB-2B. Later history reports QB-2A executed / PASS.

## 6.2 Not fully closed / needs proof

### QB-2B — Classroom Game Integration
Design/contract prepared: authoritative Question IDs; source immutability; deterministic rounds/scoring/timers/state machine. **Final completion:** `NEEDS_REVALIDATION`.

### QB-2C — Solution / Video Integration
Design/contract prepared: Question Bank → Math QA → visual routing → render/video; traceability; avoid cyclic Game/Video ownership. **Final completion:** `NEEDS_REVALIDATION`.

### QB-2D
A stash existed: `WIP QB-2D preserved before NA-MATH V2.6 integration`. Exact scope and completion must be recovered before any new work. **Status:** `IN_PROGRESS / RECOVERY_REQUIRED`.

---

# 7. EXAM QA

Branch history: `feature/exam-qa`.

Reported completed foundations: EXAM-QA-0 foundation PASS; EXAM-QA-1 Vietnamese language rules PASS; mathematical symbol protection PASS; source-text immutability PASS; EXAM-QA-2 mathematical logic rules PASS.

Covered checks include: double spaces, punctuation, sentence boundaries, math connectors, unit typography, decimal protection, delimiter/unicode normalization, symbol tables, undefined/conflicting references, self/target references, option/true-false scope, geometry construction, and primed identifiers.

User requirements also included spelling/Vietnamese logic QA, mathematical logic, realism checks for real-world problems, and TNMarker Pro answer-table export. **TNMarker Pro export completion:** `NEEDS_REVALIDATION`.

---

# 8. DOCX EXPORT / DOCUMENT PIPELINE

## 8.1 DOCX Export V1

Branch: `feature/docx-export-v1`  
Reported: `DOCX-1A → DOCX-1F completed / PASS`

Commit sequence includes:
- `53610ec` — Word export foundation;
- `22df130` — NA-MATH V2.6 Word styles;
- `890a5aa` — native OMML math export;
- `7d29507` — deterministic SVG geometry export;
- `99c08b6` — Word layout/pagination stabilization;
- `1c4e289` — Word export QA/regression.

Historical defect report: MathType content disappeared in a Word output. Because later native OMML work exists, current defect status must be tested rather than assumed fixed.

## 8.2 NA-MATH DOCUMENT CONVERTER V1.0

Scope was explicitly accepted **inside feature-freeze** as a completion/integration layer.

### Pipeline A
```text
DOCX / Word → parser → Document IR / Math IR → NA-MATH LaTeX → XeLaTeX → PDF
```

### Pipeline B
```text
DOCX / Word → parser / normalization → new DOCX → preserve content → MathType / legacy equations → native Equation / OMML where possible
```

**Implementation completion evidence:** not yet established.  
**Status:** `PLANNED / INTEGRATION_PENDING`.

---

# 9. NA-MATH SYSTEM / PUBLISHING / LAYOUT

## 9.1 Current system baseline

**`NA-MATH SYSTEM BASELINE V2.6`** — `INTEGRATED / LOCKED`. Prior V2.5 baseline existed and was superseded by V2.6.

## 9.2 Layout

**`NA-MATH-LAYOUT V1.3 CANONICAL — LOCKED`**

Core rules include A4, approximately 3/4 text – 1/4 illustration when appropriate, consistent educational icons, deterministic math/geometry, and no overlapping text/figures.

Locked content-type colors:
- Learning material: `#1E63B5`
- Worksheet: `#2F8F68`
- Exercise/Test: `#6B4FA3`
- Video: `#E57C38`

Locked typography:
- body: Libertinus Serif;
- math: Libertinus Math;
- labels: Source Sans 3;
- fallback: Noto Sans / Noto Serif.

## 9.3 Textbook / Student Workspace

- `NA-MATH-TEXTBOOK-STYLE V1.0` — `STYLE_LOCK=ON`
- `NA-MATH STUDENT WORKSPACE V1.2`
- `NA-MATH-LAYOUT V1.3`
- `NA-MATH SYSTEM V2.6`

Student Workspace rules include solutions OFF in student versions where required, handwriting workspace/grid optimization, answer key at end where required, compact pagination, and mathematical correctness over cosmetic assumption-adding.

## 9.4 Version warning

Do not confuse `NA-MATH SYSTEM V2.6` with `NA-MATH-TEXTBOOK-STYLE V1.0`, `NA-MATH-LAYOUT V1.3`, `NA-MATH STUDENT WORKSPACE V1.2`, or geometry/spatial subversions. These are different layers and should not share one version number automatically.

---

# 10. GEOMETRY / VISUAL STANDARDS

## 10.1 KNTT Geometry lock

**`KNTT_VISUAL_DEMO_V2 — LOCKED`**

Core principles:
- geometry semantics first;
- deterministic rendering;
- do not add assumptions/auxiliary points unless required;
- no freehand/image-generation geometry for canonical diagrams;
- visible/hidden edges depend on view;
- avoid overlapping edges and labels;
- preserve source mathematical meaning.

Specific locked examples include pyramid/parallelogram-base viewing conventions, no automatic altitude point `H`, `AH` hidden/dashed where the locked view requires it, front-to-back canonical viewpoint, and display conventions that must not be misread as claims about real lengths.

## 10.2 Hybrid TeX/TikZ policy

Preferred: good architecture, clarity, reuse, and maintainability. TikZ remains deterministic construction; `tikz4euclidevietnam` may be used for coordinate systems / Euclidean objects. Hybrid is preferred over forcing pure TikZ when the hybrid is more robust.

## 10.3 MATH VISUAL STANDARD

Chat 52 produced:
- `MATH-VISUAL-STANDARD-V1.0`
- conceptual `MFS-V1.0`
- `VISUAL-QA-GATES-V1.0`
- `VISUAL-ASSET-VERSIONING-RULES-V1.0`

Historical status: `REVIEW / PASS_WITH_ASSUMPTIONS`.

Principles: semantics/geometry first; renderer last; shared MFS for static / GeoGebra / Manim; canonical IDs + provenance; correctness before aesthetics; SVG canonical output with PNG/PDF alternatives; human approval.

**Needs final canonical approval/reconciliation with NA-MATH V2.6.**

---

# 11. MATH ENGINE / DYNAMIC GEOMETRY / FOLD

## 11.1 MV chain

Known lineage:
- `feature/mv-0-dynamic-semantics`
- MV2 constraint / renderer orchestration
- MV3 dynamic math workspace
- MV4 intelligent math runtime
- MV5 authoring verification
- `feature/math-production-engine-v1`
- architecture guard `mv-arch-00`
- stabilization checkpoint `mv-stab-01`

Historical chain: `MV0 → MV2 → MV3 → MV4/MV5`.

Prior convergence reported: `MV5_INTEGRATED=PASS`, `MV5_QA=PASS`, `BUILD=PASS`, `REGRESSION=PASS`, clean worktree.

## 11.2 Fold / Unfold / Shortest Path

Requirements previously defined:
- prism/pyramid `N=3..10`;
- cylinder, cone, frustum;
- start/end + waypoints;
- seam/route;
- shortest path;
- preserve face mapping;
- fold back;
- cuts for circle/square/triangle;
- Three.js viewer `/dev/fold-3d`.

Known remediation: `IA-4.9R2R_INTERACTIVE_FOLD_AUTHORING_REMEDIATION`.

**Product-level completion:** `NEEDS_REVALIDATION`.

---

# 12. MANIM / VIDEO / IMAGE ANIMATION

## 12.1 Teacher video pipeline

Canonical pedagogical flow:

```text
Mở đầu → Phân tích → Suy luận → Lời giải → Kết luận
```

Voice requirements: Vietnamese male Southern voice; pronounce Ox/Oy/Oz/Oxyz separately and clearly.

A teacher pipeline/style baseline was referred to as `V2.0 — Teacher Master Clean`.

Separately, a later handoff artifact records `Manim Math Video Studio V4.5 — Continuous Optimization Agency Edition`.

These are likely different version layers. **Action:** consolidate naming so V2.0 vs V4.5 cannot be mistaken as the same version axis.

V4.5 pending validation items included clean install, real Manim/MiKTeX rendering, TTS, Word/OMML/MathType regression, and documentation cleanup.

## 12.2 Video layout / animation style

Locked/learned rules include:
- two-frame educational layout for recent video rework;
- stable base geometry;
- progressive one-concept-at-a-time reveal;
- semantic colors;
- no unnecessary layer changes;
- vertical Reel style learned from references: 1080×1920, dark navy, purple rounded title bar, cyan/teal footer/author bar, layered math animation.

## 12.3 Image Animation Engine

Evidence exists for `feature/image-animation-foundation`, LuaDraw integration in v1.1, segmentation, depth estimation / 2.5D, and motion generation.

Studio Phase 4A.3 was reported PASS with real animated MP4 and regression gates PASS.

---

# 13. KNOWLEDGE SOURCE PROGRAM — NA_MATH_NLS

Program: `NA_MATH_NLS`  
Task: `NLS-SOURCE-01`  
Historical repo: `D:\math-ai-video-studio\math-ai-video-studio-github`  
Source root: `D:\NA-MATH-NLS-AI-SOURCES`

Expected corpus: **9 KNTT books**:
- Toán 10 Tập 1
- Toán 10 Tập 2
- Toán 10 Chuyên đề
- Toán 11 Tập 1
- Toán 11 Tập 2
- Toán 11 Chuyên đề
- Toán 12 Tập 1
- Toán 12 Tập 2
- Toán 12 Chuyên đề

Reported:

```text
EXPECTED_SOURCES=9
REGISTERED_SOURCES=9
UNKNOWN_ADDITIONAL_FILES=0
```

All 9 source registrations were reported PASS.

**Status:** `DONE / PASS`, while machine-readable linkage into every downstream module should still be checked during release audit.

---

# 14. DIGITAL & AI COMPETENCY

## 14.1 Knowledge artifact

`PIMATH-DIGITAL-COMPETENCY-KNOWLEDGE-BASE-V1.0`

## 14.2 Curriculum matrix

**`NA-MATH DIGITAL & AI MATRIX V1.0`**  
**Status:** `CANONICAL BASELINE — V1.0`

Scope: 79 numbered lessons, Toán 10–11–12 KNTT.

Counts:
- AI-0: 14
- AI-ASSIST: 47
- AI-INTEGRATED: 18
- AI-CREATION: 6 project/extension contexts

Locked principle: **Do not force AI into every lesson. AI-0 is a valid pedagogical choice.**

AI-CREATION is not default for core Mathematics lessons; use mainly for extended/interdisciplinary projects.

The matrix includes `DIG-*`, NLa/NLb/NLc/NLd, AI level, activity, evidence, rubric focus, mapping basis, and source notes.

## 14.3 Pending integration

The matrix should become a machine-readable standard in the repo.

**Repo machine-readable integration status:** `PLANNED / NEEDS_IMPLEMENTATION_EVIDENCE`.

---

# 15. BRAND / EDUCATIONAL IDENTITY

Goal: not only document styling, but a complete **NA-MATH educational brand identity**.

Proposed system: `NA-MATH EDUCATIONAL BRAND SYSTEM V1.0`.

Layers: pedagogical identity; visual identity; verbal identity; digital/video identity; governance/QA.

Current work: `BRAND-00` — read-only forensic audit.

BRAND-00 must preserve NA-MATH Layout V1.3, spatial illustration conventions, typography, colors, icons, components, exports, curriculum, digital/AI competency, video/QA, and V2.6 lineage.

**Status:** `IN_PROGRESS / NOT YET RELEASED AS FINAL BRAND SYSTEM`.

---

# 16. REAL-WORLD MATHEMATICS — NEWLY CONSOLIDATED DIRECTION

## 16.1 Principle

Real-world mathematics must remain mathematically rigorous while using realistic, traceable contexts and numbers.

Hard rule:
- do not invent “real” data;
- do not present simulated data as official;
- no unsupported real-world claims;
- if rounding/adapting, record the transformation;
- if data is simulated, label it explicitly.

## 16.2 International reference systems to study

Priority sources now include:
- Vietnam GDPT 2018 / KNTT / THPT exams;
- PISA;
- SAT / College Board;
- Japan — MEXT / Common Test / textbooks;
- Korea — MOE / KICE / CSAT / EBS;
- China — curriculum / Gaokao / PEP;
- India — NCERT / CBSE / JEE;
- Europe — Germany Abitur, France Baccalauréat, Finland Matriculation, Netherlands exams, UK A-level.

Rule: learn item architecture, reasoning patterns, modeling patterns, distractor logic, and assessment design. Do not build the corpus by copying copyrighted questions verbatim.

## 16.3 SAT-specific source layer

Priority:
- College Board SAT specifications;
- Educator Question Bank;
- Student Question Bank;
- Bluebook full-length adaptive practice tests;
- Khan Academy Official Digital SAT Prep;
- Desmos tool-use patterns.

High-value SAT domains: Algebra; Advanced Math; Problem-Solving and Data Analysis; Geometry and Trigonometry.

Especially learn: short but deep real-world contexts, data interpretation, rates/percent/units, probability and inference, coefficient interpretation, misconception-based distractors, and technology-permitted assessment design.

## 16.4 Proposed standards — NOT YET IMPLEMENTED

- `NA-MATH REAL-WORLD MATHEMATICS STANDARD V1.0`
- `NA-MATH REAL-WORLD SOURCE & DATA STANDARD V1.0`
- `NA-MATH REAL-WORLD MATRIX V1.0`

Suggested data assurance levels:
- `DATA-A — VERIFIED_REAL`
- `DATA-B — VERIFIED_ROUNDED`
- `DATA-C — VERIFIED_ADAPTED`
- `DATA-D — SIMULATED`

Suggested RW levels:
- `RW-1 Extract`
- `RW-2 Translate`
- `RW-3 Apply`
- `RW-4 Interpret`
- `RW-5 Evaluate`
- `RW-6 Decide/Create`

Required QA proposal:
- `REAL_WORLD_CONTEXT_QA`
- `DATA_SOURCE_QA`
- `DATA_DATE_QA`
- `UNIT_QA`
- `NUMERIC_PLAUSIBILITY_QA`
- `MODEL_REALISM_QA`
- `MATHEMATICAL_LOGIC_QA`
- `KNTT_ALIGNMENT_QA`
- `LANGUAGE_QA`
- `COPYRIGHT_ORIGINALITY_QA`

## 16.5 Recommended implementation phases

```text
REALWORLD-00 — FOUNDATION
REALWORLD-01 — KNTT 10–12 MATRIX
REALWORLD-02 — INTERNATIONAL PATTERN LIBRARY
REALWORLD-03 — VERIFIED DATASETS
REALWORLD-04 — PILOT 40 SCENARIOS
```

**Current status:** `PLANNED / NOT_STARTED`.

---

# 17. REAL-WORLD QUESTION DOMAINS ALREADY SELECTED

High priority:
1. optimization and decision-making;
2. data/statistics/information evaluation;
3. conditional probability/Bayes/risk;
4. personal finance;
5. growth/decay/models;
6. GPS/drone/Oxyz/vectors;
7. energy/environment/logistics;
8. AI/data/simulation.

Other useful domains: construction/architecture, measurement/maps, transportation, packaging/design, biomedical/population, cyclic/trigonometric phenomena, quality control, and communications/media claims.

Target philosophy:

```text
context
→ identify relevant data
→ formulate model
→ solve
→ interpret
→ evaluate assumptions / model limits
→ decide
```

---

# 18. WEB / AUTONOMOUS WEBSITE

Project/repository name discussed: `na-math-agent-web`.

Program prompt: `NA-MATH AGENT WEB / WEB-00 → WEB-10`.

Goal: cloud-hosted mathematics website where agents can select/update mathematical tools/content and continue operating on cloud after the local computer is off.

**Current evidence:** early setup / repo creation guidance / master-prompt planning.  
**Status:** `PLANNED / EARLY_STAGE / NEEDS_REVALIDATION`.

Do not confuse this with the core Math AI Studio release until an explicit integration decision exists.

---

# 19. TEACHER WORKFLOW / E2E PRODUCT EXPERIENCE

A complete teacher workflow has been a major target:

```text
import source
→ review / fail closed
→ question bank
→ search/reuse
→ selection
→ assessment
→ classroom game
→ solution/video
→ export
```

Regression evidence includes PASS for many UX gates: import UI service, supported format, review fail-closed, traceability, question review, search/reuse, selection ID, assessment E2E, game E2E, solution video UI, Studio orchestrator reuse, export E2E, answer isolation, source immutability, home workspace, UI/runtime/storage isolation, accessibility, responsive layout, and double-submit prevention.

Historical roadmap: `E2E-TEACHER-01` was deferred from v1.3.1 and targeted for v1.4.0.

Current v1.6 still requires human/pilot end-to-end validation before product-ready status.

---

# 20. FIELD VALIDATION / WMF

A real-world validation task found a WMF converter package, 27 Q37 WMF figure items, a browser/canvas conversion path blocked in that remediation step, and PNG derived format unavailable at that point.

This is a historical field-validation issue, not necessarily the current final state.

**Status:** `NEEDS_CURRENT_REVALIDATION`, especially because `HUMAN_Q37_VISUAL_QA=PENDING` in the latest v1.6 finalization snapshot.

---

# 21. ADJACENT TEACHING ECOSYSTEM — NOT CORE RELEASE

These influence product requirements but should be kept separate from core scope unless explicitly integrated.

Remote teaching: teacher MacBook; students Samsung TV + iPad; Classkick / Google Forms; 10 MCQ after 90-minute lesson; no K12Online.

Content production: GDPT 2018, KNTT, Toán 10–12, worksheet/test/rubric/video workflow, TNMarker Pro answer output requirement.

Development environment includes Windows + MacBook, VS Code, Continue, Codex CLI, Ollama/local models, Manim/XeLaTeX/FFmpeg, etc.

---

# 22. ITEMS COMPLETE / LOCKED ENOUGH TO PROTECT

| Item | Status |
|---|---|
| PiMath / MATH AI umbrella identity | LOCKED |
| 00–99 governance hierarchy | LOCKED |
| PIMATH-AHP-V1.0 | APPROVED |
| Human authority over release/architecture/curriculum/security | LOCKED |
| Feature freeze | LOCKED |
| GDPT 2018 + KNTT canonical knowledge direction | LOCKED |
| NA-MATH SYSTEM V2.6 | INTEGRATED / LOCKED |
| NA-MATH-LAYOUT V1.3 | LOCKED |
| NA-MATH-TEXTBOOK-STYLE V1.0 | STYLE LOCK |
| NA-MATH STUDENT WORKSPACE V1.2 | established |
| KNTT_VISUAL_DEMO_V2 | LOCKED |
| NLS 9 KNTT sources registration | PASS |
| NA-MATH DIGITAL & AI MATRIX V1.0 | CANONICAL BASELINE |
| QB-0A→0K | PASS |
| QB-1A→1F | PASS |
| DOCX-1A→1F | PASS |
| Exam QA language/math-logic foundations | PASS |
| v1.2 tag immutability | PROTECTED |
| v1.3.1 release | VERIFIED HISTORICALLY |

---

# 23. ITEMS STARTED BUT NOT SAFE TO CALL FINISHED

| Item | Current master status |
|---|---|
| PIMATH Autonomous Orchestrator V1.0 | BASELINE CANDIDATE |
| Chat 21 final completion | needs current state |
| Chat 22 final gate | historically NOT_RUN |
| Classification Engine V1.0 | REVIEW / assumptions |
| Math Visual Standard V1.0 | REVIEW |
| QB-2B Classroom Game | needs completion proof |
| QB-2C Solution/Video | needs completion proof |
| QB-2D | WIP recovery |
| Fold/Unfold authoring | needs product-level revalidation |
| Manim V4.5 P0 validation | pending in handoff |
| NA-MATH Educational Brand System | BRAND-00 in progress |
| Web Agent WEB-00→WEB-10 | early stage |
| Document Converter V1.0 | approved scope, implementation pending |
| Digital & AI Matrix machine-readable repo integration | pending |
| v1.4 final release | unverified |
| v1.6 final product | blocked by human/pilot gates |

---

# 24. AGREED BUT NOT YET BUILT / NOT YET PROVEN

This is the most important **do-not-forget backlog**:

```text
1. PROJECT MASTER file itself in the repo
2. Machine-readable project state synced with this master
3. Full canonical Chat 00–99 registry with exact names for every chat
4. Real-World Mathematics standards
5. International item-pattern registry
6. SAT pattern library
7. Verified real-data registry
8. KNTT 10–12 Real-World Matrix
9. Real-world 40-scenario pilot
10. Real-world plausibility/source/date/unit QA
11. Document Converter V1.0 final implementation/proof
12. Digital & AI Matrix machine-readable repo standard
13. BRAND-00 → final Educational Brand System
14. Agent Web completion/integration decision
15. QB-2B/2C/2D recovery and closure
16. Remaining v1.6 human QA
17. Remaining v1.6 pilot hard gates
18. Q37 visual/WMF human verification
19. Final real teacher workflow pilot
20. Production release approval
```

---

# 25. VERSION COLLISIONS / CONFUSION RISKS TO FIX

## Risk A — Umbrella vs implementation
Never rename PiMath/MATH AI to Math AI Studio.

## Risk B — NA-MATH version axes
Do not write just “NA-MATH V2.6” when the intended artifact is Layout V1.3, Textbook Style V1.0, Student Workspace V1.2, geometry/spatial version, or Digital & AI Matrix V1.0. Use full artifact IDs.

## Risk C — Manim versions
`Teacher Master Clean V2.0` and `Manim Math Video Studio V4.5` appear to be different version axes. Consolidate in a version registry.

## Risk D — Release versions vs standards versions
`Math AI Studio v1.6.0` is not the same thing as `NA-MATH SYSTEM V2.6`.

## Risk E — historical PASS vs current PASS
A previously passing branch can be stale. Every release must re-run the current release gate.

---

# 26. CURRENT MASTER PRIORITY ORDER

Because feature-freeze is active:

```text
P0 — Preserve / reconstruct the canonical project state
P1 — Close v1.6 human + pilot hard gates
P2 — Recover unfinished QB-2B/2C/2D and teacher workflow evidence
P3 — Revalidate document/math/visual/WMF real-world field issues
P4 — Freeze a production-ready Math AI Studio release
P5 — Integrate already-approved standards (Digital/AI Matrix, Document Converter)
P6 — Finish Brand governance
P7 — Only then start REALWORLD-00 foundation
P8 — Build international/SAT pattern + verified-data corpus
P9 — Build 40-scenario real-world pilot
P10 — Decide Web Agent integration separately
```

Do not let new international-research work delay the current v1.6 product hard gates.

---

# 27. NEXT REQUIRED PROJECT-MANAGEMENT ARTIFACTS

The repo should ultimately contain:

```text
docs/project/
├── PROJECT_MASTER_MAP.md
├── PROJECT_STATUS.md
├── PROJECT_DECISION_INDEX.md
├── VERSION_REGISTRY.md
├── MODULE_REGISTRY.md
├── DEFERRED_SCOPE.md
└── RECOVERY_REGISTER.md

project-state/
├── PIMATH-PROJECT-STATE.json
├── artifact-registry.json
├── dependency-graph.json
├── execution-queue.json
├── blocker-register.json
└── human-approval-queue.json
```

This file should be the human-readable top entry point. `PIMATH-PROJECT-STATE.json` should remain the machine-readable runtime state.

---

# 28. IMMEDIATE RECOVERY CHECKLIST

Before starting another large feature/program, perform one **read-only** audit and answer:

```text
CURRENT_REPO=
CURRENT_BRANCH=
CURRENT_HEAD=
WORKTREE=
LATEST_RELEASE_TAG=

PROJECT_MASTER_PRESENT=
PIMATH_PROJECT_STATE_PRESENT=
ARTIFACT_REGISTRY_PRESENT=
DECISION_LOG_PRESENT=
ROADMAP_PRESENT=

V1_6_HUMAN_GATES=
V1_6_PILOT_GATES=
QB_2B=
QB_2C=
QB_2D=
DOC_CONVERTER=
DIGITAL_AI_MACHINE_STANDARD=
BRAND_00=
REALWORLD_00=
WEB_00_10=

NEXT_EXECUTABLE_TASK=
```

Do not modify code during this audit.

---

# 29. MASTER DECISION FOR NOW

**Project status:** `ACTIVE DEVELOPMENT / FEATURE FREEZE / FINALIZATION`

**Most important unfinished objective:** turn Math AI Studio from a technically integrated codebase into a **human-validated, pilot-validated, release-approved product**.

**Most important preservation objective:** do not lose earlier PiMath governance, standards, curriculum, source, visual, assessment, and artifact decisions while finishing the product.

**Next recommended operational action:** run a read-only `PROJECT-MASTER-RECOVERY-01` audit in the canonical Math AI Studio repo, compare the live repository against this reconstructed master, then update this file only with evidence.

---

# 30. EVIDENCE / CONFIDENCE NOTE

This reconstruction uses current conversation project logs, retained PiMath/Math AI project history, and Library artifacts including PiMath Orchestrator, Database/Metadata architecture, Digital & AI Matrix, NA-MATH document artifacts, QB integration prompts, and repository logs.

A live GitHub connector check in this session authenticated the account but returned no accessible repositories, so the current remote repository could not be independently enumerated. Therefore any item marked `NEEDS_REVALIDATION` must be verified from the local canonical repo before mutation or release.

**No uncertain item should be silently converted to DONE.**
