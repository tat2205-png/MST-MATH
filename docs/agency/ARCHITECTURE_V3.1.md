# Architecture V3.1 — Agency Runtime

```text
Teacher UI
  ↓
Input Parser / Curriculum / Assessment / Learning Engines
  ↓
Agency Runtime Envelope
  ↓
Workflow/AI Backend
  ↓
Agents Orchestrator
  ├─ Lead specialist
  ├─ Independent reviewer(s)
  └─ Quality gate evidence
  ↓
Release decision
  ↓
Result + audit trail
```

## Browser responsibilities
- collect/normalize input;
- run deterministic local engines;
- create task ownership plan;
- cache data locally;
- sync data to Supabase when configured;
- display orchestration/audit status.

## Backend responsibilities
- authenticate/authorize user/project;
- keep model/API secrets server-side;
- actually invoke agents;
- isolate lead/reviewer outputs;
- evaluate gates from evidence;
- persist audit artifacts;
- return final execution result.

## Failure semantics
- specialist unavailable → REVIEW/BLOCK, not silent fallback;
- mandatory gate not PASS → release cannot be READY;
- offline browser → local data remains queued; remote agent execution waits;
- local demo → simulation label remains visible.
