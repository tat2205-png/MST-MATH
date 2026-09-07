# MST-MATH INPUT V1 — Tooling Debt

Generated: 2026-09-07 08:57:33 +07:00

These items do not invalidate the final full 9/9 Machine Acceptance,
but they must remain visible for successor/tooling work.

## TD-INPUT-001 — uv.lock mutation during QA

Observed behavior:

`uv.lock` can become modified during INPUT QA/tool initialization.

Observed preserved change:

- 7 inserted lines
- preserved separately through a targeted Git stash
- not included in INPUT V1 closeout commit

Requirement for successor tooling:

QA should be hermetic with respect to dependency lockfiles.

Desired invariant:

Golden sources: READ ONLY

Application source: READ ONLY during QA

uv.lock: READ ONLY

package lockfiles: READ ONLY

Artifacts/logs/cache: WRITE ALLOWED

## TD-INPUT-002 — targeted PDF-only exit semantics

Earlier targeted PDF-only validation could return a blocked/global
status because an unrelated image-real-Golden flag remained active,
even when the selected PDF Golden itself had semantic PASS.

The authoritative INPUT V1 acceptance is therefore the complete
9/9 Golden run with exit code 0.

Successor QA should make filtered-run exit semantics local to the
selected test scope.

## TD-INPUT-003 — Windows stdout encoding

The scanned PDF completed 125/125 pages and initially failed only while
serializing Unicode JSON through a Windows CP1252 stdout stream.

INPUT V1 now configures UTF-8 stdout/stderr internally.

Regression requirement:

The complete 9/9 QA must pass with external PYTHONIOENCODING and
PYTHONUTF8 unset.
