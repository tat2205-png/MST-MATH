# PiMath v1.6 Agency Development Pipeline

STATUS=NEW_AUTHORIZED_V1_6_ADAPTER

## Provenance

This is a new project-local integration contract derived only from `AGENTS.md`, `AGENCY_TEAM.md`, `AGENCY_RUNTIME_CONTRACT.md`, `WORKFLOW_BACKEND_PROMPT.md`, and `agency/manifest.json`. It is not a recovered historical artifact.

## Authority

`MASTER > APPROVED ARTIFACT > ORCHESTRATOR > MODULE TASK`

AUTOMATE EXECUTION, NOT AUTHORITY. Human Product Owner, Architecture Approver, Curriculum Approver, Security Approver, and Release Approver remain authoritative.

## Required flow

1. Task intake → Agents Orchestrator.
2. Scope lock → Product Manager.
3. Architecture → Multi-Agent Systems Architect.
4. Execution → assigned domain or engineering lead.
5. Review → one or more independent reviewers; lead and reviewer identities must differ.
6. Test Automation → Test Automation Engineer.
7. Evidence Collection → Evidence Collector, using actual artifacts only.
8. Reality Check → Reality Checker as final independent certifier, never implementation lead.
9. Human approval → required for mandatory gate REVIEW/BLOCK and all reserved human authorities.
10. State update → update authoritative Project Master/State only from evidence.
11. Next task → select from gate and blocker evidence.

## Gate ownership

- G0 Requirements — Product Manager.
- G1 Architecture — Multi-Agent Systems Architect.
- G2 Curriculum & Mathematics — appropriate Math/Curriculum specialist plus an independent mathematical reviewer.
- G3 Assessment & Learning — Assessment & Psychometrics Specialist and UX role where relevant.
- G4 UX & Build — engineering/UI lead plus Test Automation Engineer.
- G5 Security & Data — Security Architect.
- G6 Evidence & Release — Evidence Collector plus Reality Checker.

G2, G5, and G6 are mandatory production gates. Mandatory REVIEW/BLOCK requires human review.

## Execution invariants

- Use `MWS_AGENCY_ENVELOPE/1.1` with ordered tasks, explicit lead/reviewers, gate ownership, and execution mode.
- Persist lead, reviewer, test, evidence, and Reality Checker outputs separately.
- No self-certification. Evidence Collector and Reality Checker are distinct roles.
- No silent specialist-to-generic fallback. Missing required capability yields REVIEW or BLOCK.
- Local simulation must be labeled and cannot certify real Agency execution.
- Handoffs contain `task_id`, `owner`, `inputs`, `assumptions`, `output_artifact`, `checks_performed`, `unresolved_risks`, `next_owner`, and `gate_status`.
- Store structured decisions and evidence only; never request hidden chain-of-thought.
