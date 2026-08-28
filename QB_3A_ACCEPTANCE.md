# Question Bank QB-3A Acceptance Matrix

Feature freeze: **ENABLED**

Candidate branch: `feature/qb-document-pipeline`

Candidate base: `a5d3d1cf64fcc3e0a590dbacfa00e96816ece9c6`

This matrix maps final program gates to repository-owned, deterministic evidence. It does not introduce a second acceptance implementation; the authoritative phase suites remain the executable contracts.

| Area | Authoritative evidence | Acceptance |
|---|---|---|
| Document ingestion, segmentation, OMML, LaTeX | `test-question-bank-qb1a.ts`, `test-question-bank-pipeline.ts` | PASS |
| Normalization, schema, Exam QA | `test-question-bank-qb1b.ts` | PASS |
| Figure association and no-guess policy | `test-question-bank-qb1c.ts` | PASS |
| Persistence, assets, duplicate/status policy | `test-question-bank-qb1d.ts`, `test-question-bank-qb1e.ts` | PASS |
| Search, filtering, pagination, safe reuse | `test-question-bank-qb1f.ts` | PASS |
| Assessment selection and fail-closed behavior | `test-question-bank-qb2a.ts` | PASS |
| Game state, scoring, and answer isolation | `test-question-bank-qb2b.ts` | PASS |
| Solution, math gate, visual routing, traceability | `test-question-bank-qb2c.ts` | PASS |
| Real Question → MP4 → START/KEY/END flow | `npm run qa:question-video:runtime` | PASS |
| Student/teacher JSON, LaTeX, DOCX, PDF delivery | `test-question-bank-qb2d.ts` | PASS |
| Program regression and architecture | `npm run qa:regression`, `npm run arch:check`, `npm run qa:ci` | PASS |
| Server, bridge, repair, and runtime integration | `npm run qa:full` with bridge health `READY` | PASS |
| Clean committed-source reproducibility | temporary worktree + `npm ci` + final QA subset | REQUIRED BEFORE FREEZE |

## Acceptance corpus

The repository-owned DOCX fixture covers Vietnamese Unicode, inline/display OMML, LaTeX conversion, all four supported question types, tables, inline/anchored figures, orphan assets, answers, solutions, source locations, and deterministic identities. Phase-specific fixtures add multiple sources, APPROVED/REVIEW/QUARANTINED states, and duplicate/possible-duplicate behavior.

## Runtime prerequisites

Real video acceptance requires the canonical Local Render Bridge at `http://127.0.0.1:8765` to report `READY`. Gemini visual analysis remains optional; deterministic frame structure and math provenance stay mandatory and fail closed.

## Freeze rule

After the clean-checkout gate passes, the accepted Question Bank development baseline is the final QB-3A commit. The existing release tag `v1.3-rc.1` remains unchanged.
