---
name: mst-math-governed-execution
description: >
  Use this skill for any audit, repair, implementation, validation, release,
  Word/DOCX, input-ingestion, geometry, GeoGebra, question-bank, assessment,
  export, or production task inside MST-MATH. It keeps agent execution
  subordinate to MST-MATH authorities, fail-closed rules, evidence gates,
  and human acceptance where required.
---

# MST-MATH Governed Execution

## Purpose

This skill is an execution guard for agents working in MST-MATH.

It is NOT a mathematical authority, architecture authority, curriculum authority,
visual authority, release authority, or replacement for project contracts,
goldens, tests, or Human Authority.

When this skill conflicts with the repository's current approved instructions,
the repository authority wins.

## Mandatory authority order

Apply this order whenever instructions conflict:

1. Explicit current user instruction.
2. Locked/canonical MST-MATH architecture, contracts, specifications, and accepted visual/document standards.
3. Deterministic QA, regression, golden, provenance, and preservation gates.
4. Human Authority for mathematical, pedagogical, visual, source-interpretation, and native-application acceptance where required.
5. Repository operating rules, especially `AGENTS.md`.
6. Project-local Agent Skills.
7. External/general agent skills and generic best practices.

Never allow an external skill to rewrite or silently weaken a higher authority.

## Startup

Before substantial work:

1. Read the current task carefully.
2. Read `AGENTS.md`.
3. Identify the task's canonical contract/spec/golden before editing.
4. Inspect the current branch, HEAD, working-tree state, and relevant existing tests.
5. Classify the work as AUDIT, REPAIR, IMPLEMENTATION, ACCEPTANCE, or RELEASE.
6. Keep one active executor for one mutation surface whenever practical.

Do not assume a task is safe to modify merely because a generic skill recommends it.

## Scope discipline

Use the smallest affected surface.

Do not perform opportunistic refactors, architecture redesign, schema broadening,
dependency upgrades, provider changes, UI redesign, storage migration, or
unrelated cleanup unless the current user instruction explicitly authorizes that scope.

Do not create a new authority when an existing MST-MATH authority already covers the task.

## Repair protocol

For defects, follow this order:

1. Reproduce the failure.
2. Identify the earliest failing boundary.
3. Classify root cause.
4. Confirm root cause before patching.
5. Make the smallest boundary-local repair.
6. Preserve or add focused regression coverage.
7. Run focused validation.
8. Run relevant module/integration validation.
9. Run static/type/build checks where applicable.
10. Run real golden/runtime validation where applicable.
11. Run native application/human acceptance where required.
12. Report evidence without upgrading an uncertain result to PASS.

Never weaken an assertion, gate, provenance requirement, or fail-closed behavior to make a test pass.

## Geometry and visual construction

For geometry, folding, cutting, assembling, transformations, or visual mathematical figures:

`Parse Geometry -> Define Operation -> Validate Preconditions -> Apply Transform -> Validate State -> Render`

Rules:

- User-provided source figures are evidence and may be authoritative when the user has designated them so.
- Do not infer missing incidences, hinges, faces, edges, points, constraints, or transforms from appearance alone.
- Do not render a later state when the prior geometric state is invalid or ambiguous.
- An image-to-code or visual-reconstruction skill may help with presentation only; it cannot certify geometry.
- If the state cannot be established, return REVIEW_REQUIRED rather than inventing geometry.

## Word / DOCX work

For Word output or preservation tasks:

- Preserve canonical semantic content and relationships.
- Preserve required OMML, legacy MathType/OLE, figures, grouped shapes, and relationships according to the active preservation contract.
- Follow the active MST-MATH Word layout/output standard.
- Do not substitute visual similarity for native Word correctness.
- Native reopen/application checks remain authoritative when required.
- Do not silently drop unsupported content.

## Input and extraction

Maintain the locked input architecture and provenance chain.

Do not create an Input-to-Output semantic bypass.

Unsupported, ambiguous, or conflicting evidence must fail closed as the active contract requires.

Do not infer mathematical meaning solely from visual appearance.

## External skills

External skills may be used as bounded support only.

Examples:

- debugging / diagnosing
- TDD
- code review
- accessibility review
- UI/taste review
- image-to-code for UI reconstruction
- generic TypeScript or architecture guidance

They may propose techniques, but they cannot:

- override MST-MATH contracts,
- change accepted goldens,
- certify mathematical truth,
- certify release status,
- redefine geometry,
- bypass preservation,
- weaken fail-closed behavior.

## Validation and status

Use only the repository-approved status vocabulary.

A PASS requires evidence from the applicable gate.

Do not convert:

- NOT_TESTED -> PASS
- BLOCKED -> PASS
- REVIEW_REQUIRED -> PASS
- an external service failure -> product PASS
- structural similarity -> mathematical/visual acceptance

Keep diagnostic success separate from authoritative acceptance.

## Release discipline

Before release or certification, follow the active repository release sequence.

At minimum, preserve the distinction between:

- focused test evidence,
- contract/integration evidence,
- static/type/build evidence,
- regression evidence,
- real golden/runtime evidence,
- native application evidence,
- independent review where required,
- Human Authority where required.

Record the exact commit/SHA when release evidence depends on a specific tree.

## Stop conditions

Stop mutation and report BLOCKED or REVIEW_REQUIRED when:

- the required authority is missing,
- source evidence is ambiguous,
- a required golden cannot be located,
- a preservation boundary is unsupported,
- geometric state cannot be proven,
- a required external dependency/service prevents authoritative validation,
- the requested change would require broadening the agreed scope.

Do not improvise around a stop condition.

## Output contract

At completion, report:

- task scope,
- files changed,
- root cause or implementation rationale,
- validations actually run,
- evidence obtained,
- remaining blockers/review requirements,
- exact branch/commit when available,
- final status using approved vocabulary.

The goal is reliable execution of MST-MATH, not autonomous reinterpretation of MST-MATH.
