# PiMath Agency runtime adapter

STATUS=NEW_AUTHORIZED_V1_6_ADAPTER

This Agency-only harness uses the existing Codex CLI as an execution host. It does not modify or integrate with application runtime code.

- `canary-plan.json` preserves `MWS_AGENCY_ENVELOPE/1.1`, ordered tasks, explicit leads/reviewers, gate ownership, execution mode, outputs, and mandatory gates.
- `run-canary.mjs` starts one fresh, ephemeral, read-only Codex process per official role and stores each role output and event stream separately.
- Installed official role TOML files are resolved before invocation. A missing required role fails closed; it never silently invokes a generic substitute.
- Existing evidence artifacts are never overwritten.
- `--negative` exercises an isolated deliberately missing reviewer and produces BLOCK evidence without changing user-wide configuration.

Run positive and negative canaries only from a clean, approved task baseline:

```text
node agency/runtime/run-canary.mjs
node agency/runtime/run-canary.mjs --negative
node agency/runtime/run-canary.mjs --evidence-dir=runtime-canary-01r --invocation-suffix=01r
node agency/runtime/run-canary.mjs --negative --evidence-dir=runtime-canary-01r --invocation-suffix=01r
node agency/runtime/run-canary.mjs --evidence-dir=runtime-canary-01r --invocation-suffix=01r --only=reality-checker
```

`--evidence-dir` accepts a single safe directory name under `agency/evidence/`; `--invocation-suffix` creates distinct invocation identities for a remediation run. `--only=<role-slug>` retries a missing role artifact without rerunning or overwriting completed roles. Prior evidence is never overwritten.
