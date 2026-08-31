# Agency Runtime Contract — V3.1

## Purpose
V3.1 turns the V3.0 ownership map into an executable orchestration contract. The browser creates the plan; a real multi-agent backend is responsible for invoking AI agents. Local Demo never claims that remote agents ran.

## Request envelope
Every workflow payload includes `agency_runtime` with:
- `schema = MWS_AGENCY_ENVELOPE/1.1`
- `run_id`
- ordered tasks
- one lead + independent reviewers per task
- gate ownership
- mandatory release gates `G2`, `G5`, `G6`
- `execution_mode`

## Backend execution rules
1. Agents Orchestrator accepts the envelope and creates task executions.
2. Lead output must be persisted separately from reviewer output.
3. A lead cannot self-certify its own task.
4. Mathematical/curriculum changes must pass G2.
5. Student/cloud/privacy changes must pass G5.
6. Production release must pass G6 using test/evidence artifacts.
7. No silent fallback from a failed specialist to a generic model.
8. Human review is required when a mandatory gate is REVIEW or BLOCK.

## Suggested backend response
```json
{
  "agency_run_id": "AGENCY_...",
  "execution_mode": "REMOTE_MULTI_AGENT",
  "tasks": [{"task_id":"...","status":"DONE","lead_output":{},"reviews":[]}],
  "gates": [{"id":"G2","status":"PASS","evidence_refs":[]}],
  "release": {"status":"READY","reason":"..."},
  "result": {}
}
```

## Local Demo semantics
`LOCAL_ORCHESTRATION_SIMULATION` validates the task graph and shows deterministic gate previews. It does **not** represent execution of Agency Agents or a substitute for independent AI review.
