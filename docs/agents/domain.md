# Domain docs

This repository uses a single-context layout.

- Read `CONTEXT.md` at the repository root before domain exploration.
- Read relevant decisions under `docs/adr/` when present.
- Keep `CONTEXT.md` limited to stable terminology, boundaries, authority, and invariants. Put changing work status in `.scratch/` issues instead.
- Use the glossary vocabulary from `CONTEXT.md` in issue titles, proposals, and tests.
- Surface conflicts with an ADR explicitly; do not silently override it.

## Validation ownership

- QuestionObject record identity is distinct from duplicate/content identity.
- Module closure gates follow causal capability ownership. An unrelated optional AI-provider golden must not block closure of a deterministic module.
- MST-03 QUESTION FILTER closure is owned by its Question Bank identity, provenance, duplicate-relation, contract, integration, build, typecheck, lint, and review gates.
- The Gemini-dependent Studio `math.solve` real golden is reported as a separate capability gate. `BLOCKED_ENVIRONMENT` or `FAIL` remains visible and is not converted to `PASS`, but does not block MST-03 when no causal dependency exists.
