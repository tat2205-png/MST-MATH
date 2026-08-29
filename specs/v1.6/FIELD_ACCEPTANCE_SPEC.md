# v1.6 Field Acceptance Specification

Status: pilot preparation only. No field results are recorded here.

## Levels

- Level 0: architecture, contracts, and developer-only checks.
- Level 1: teacher self-pilot using representative local documents.
- Level 2: controlled external pilot with 2–3 teachers, then 5–10 teachers.
- Level 3: classroom validation of student-facing worksheets, exports, figures, and videos.

## Per-task evidence

Record only operational evidence; do not collect student names, answers, or other unnecessary personal data.

```json
{
  "taskId": "PILOT-01",
  "workflow": "import-docx",
  "start": "ISO-8601",
  "end": "ISO-8601",
  "result": "PASS|PASS_WITH_MINOR_CORRECTION|PASS_WITH_MAJOR_CORRECTION|FAIL|BLOCKED",
  "retries": 0,
  "manualCorrections": 0,
  "blockingFailure": "F0|F1|F2|F3|F4|null",
  "outputAccepted": true,
  "notes": "non-identifying observation"
}
```

## KPIs

Calculate task completion, first-pass success, teacher correction rate, math error rate, document fidelity, visual defects, export success, median task time, blocking failure rate, teacher acceptance, and human intervention count from recorded task rows. Empty datasets remain `PENDING_REAL_WORLD_USE`.

## Severity

- F0 observation only; F1 minor friction; F2 significant usability defect; F3 workflow/output blocker; F4 mathematical/source corruption, answer leakage, data loss, or security/privacy issue.
- F3/F4 must block RC. F2 requires explicit release review. F0/F1 may remain backlog items.

## Evidence rule

Automated QA and runtime evidence are separate from human field acceptance. No field score or classroom-readiness claim is valid until real participants provide evidence.
