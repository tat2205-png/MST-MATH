# Math AI Studio v1.5.0 Release Candidate 1

## Identity

- Source release: v1.4.0 (`85d6ad2eb004d4e889f578c542df8b64cb08b02b`)
- Candidate branch: `develop/v1.5.0`
- Candidate base: `516fcea2515c4bf016716fb58ed0441ef37be85a`
- Proposed tag: `v1.5.0-rc.1`
- V1_5_SOURCE_IMPLEMENTATION_COMMITS=0

## Scope matrix

| Requirement | Priority | Status | Evidence | Disposition |
|---|---:|---|---|---|
| V15-DOC-01 canonical document pipeline | P1 | PASS | `npm run qa:docx`, ingest and QB regressions | Included |
| V15-NLS-01 / NLS-SOURCE-02H | P1 | PASS | NLS registry, structure, review, and regression suites | Included; review queue preserved |
| V15-ARCH-01 | P2 | Deferred | Roadmap does not require v1.5 inclusion | Deferred |
| V15-QA-01 | P2 | Deferred | Roadmap does not require v1.5 inclusion | Deferred |
| V15-VIS-01 | P3 | Not implemented | Optional visual AI remains non-blocking | Planned only |

## QA evidence

- Canonical document contract, fidelity, source traceability, asset preservation, and fail-closed behavior: PASS.
- NLS registered sources: 9; registry, immutability, structure discovery, stable IDs, traceability, review queue, Vietnamese/math fidelity, downstream contract, and fail-closed checks: PASS.
- Teacher Golden Workflow and real Local Render Bridge runtime: PASS.
- Student answer/solution isolation and source immutability: PASS.
- TypeScript: PASS.
- Architecture: PASS; 0 errors and 3 pre-existing non-blocking warnings.
- Build: PASS.
- Accessibility and responsive UI: PASS.
- Global regression: PASS, 70/70 suites.
- Optional Gemini visual analysis: SKIPPED_OPTIONAL; not release-blocking.

## Release guards

- v1.4.0 tag remains immutable.
- v1.3.1 history remains immutable.
- `main` is unmodified by this candidate task.
- No P2/P3 implementation, speculative feature, dependency upgrade, or parallel pipeline was added.
- NLS-02H source content remains unchanged; ambiguous structure remains in the canonical review queue.

## Recommendation

READY_FOR_V1_5_RC=YES
READY_FOR_V1_5_STABLE_RELEASE=YES_PENDING_RC_VERIFICATION
