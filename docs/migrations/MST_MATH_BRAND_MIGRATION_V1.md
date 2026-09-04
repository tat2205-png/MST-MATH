# MST-MATH Brand Migration V1

Status: IMPLEMENTATION PLAN / NON-DESTRUCTIVE / COMPATIBILITY-FIRST

## Decision

`MST-MATH` is the successor product/umbrella identity for the active project. New active code, UI copy, generated outputs, runtime identifiers, branch names, filenames, scripts, documentation, and future standards must not introduce new `PiMath`/`PIMATH`/`pimath` branding.

`Math AI Studio` remains the implementation/application name unless changed by a separate explicit product decision. `NA-MATH` remains the educational standards/publishing layer unless changed by a separate explicit standards decision.

## Safety rule

Historical release evidence, signed/certified snapshots, commit history, and previously locked PiMath V1 artifacts are immutable evidence. They must not be rewritten merely to erase the old name. They are classified as `LEGACY_PIMATH_HISTORY` and may retain the old identifier only where historical truth or backward compatibility requires it.

The migration is therefore a successor migration, not a destructive search-and-replace over certified history.

## Canonical successor naming

| Layer | Legacy | Successor |
| --- | --- | --- |
| Product display | `PiMath` | `MST-MATH` |
| Product upper token | `PIMATH` | `MST-MATH` when human-readable |
| Code namespace | `PIMATH_*` | `MST_MATH_*` |
| Standard IDs | `PIMATH-*` | `MST-MATH-*` |
| Lowercase slug | `pimath-*` | `mst-math-*` |
| TS type prefix | `PiMath*` | `MstMath*` |
| TS camel member | `*PiMath*` | `*MstMath*` |
| DNA display | `PiDNA` / `PiMath DNA` | `MST-MATH DNA` |
| DNA code root | `PIMATH_DNA` | `MST_MATH_DNA` |
| Root standard ID | `PIMATH-DNA-V1.0` | `MST-MATH-DNA-V1.0` |

## Compatibility policy

1. New canonical root: `MST-MATH-DNA-V1.0`.
2. Legacy `PIMATH-DNA-V1.0` becomes a compatibility alias only after all active consumers resolve the successor root.
3. Existing locked child standards may remain addressable under their legacy IDs until successor aliases are registered and runtime/tests are migrated.
4. Legacy aliases must never become an alternate authority.
5. Generated user-facing output must render `MST-MATH`, not `PiMath`.
6. Runtime errors, telemetry labels, filenames, scripts, test names, and new branch names must migrate to the successor naming.

## Migration phases

### M0 — Inventory and freeze
- Create dedicated migration branch.
- Record exact base SHA.
- Inventory content and path occurrences of `PiMath`, `PIMATH`, `pimath`, and `PiDNA`.
- No changes to certified/release history.

### M1 — Root identity compatibility
- Introduce `MST-MATH-DNA-V1.0` as active root.
- Add explicit legacy alias for `PIMATH-DNA-V1.0`.
- Update output-profile parent identity.
- Update root resolver and fail-closed error codes.
- Keep temporary compatibility exports where needed.

### M2 — Runtime/code rename
- Rename TS types/constants/functions/member names.
- Rename active runtime modules and imports.
- Rename generated-output brand strings.
- Rename active scripts and npm script targets.

### M3 — Standards/registry successor aliases
- Introduce MST-MATH successor IDs/paths for PiMath-branded child standards.
- Preserve old IDs as compatibility aliases only.
- Update registry references atomically.

### M4 — Active documentation and paths
- Rename active architecture, migration, project-state, and development docs.
- Do not rewrite immutable acceptance/release evidence; mark it as legacy evidence.

### M5 — Branch/repository/local workspace
- New branches use `mst-math-*` naming.
- Rename repository from `math-ai-video-studio` only after code migration is green and remote redirects are verified.
- Rename local canonical folder only after remote rename and clean synchronization.

### M6 — Gates
Required before promotion:
- TypeScript/lint PASS
- build PASS
- architecture QA PASS
- full regression PASS
- generated DOCX/PDF/LaTeX/video/app-visible brand scan PASS
- `git grep` active-tree scan shows no unauthorized PiMath branding
- compatibility alias tests PASS
- clean worktree PASS

## Forbidden shortcuts

- Blind global replacement of `PIMATH` with `MST-MATH` inside code identifiers.
- Rewriting certified historical evidence.
- Deleting legacy aliases before all consumers migrate.
- Renaming the remote repository before branch/build/regression gates pass.
- Mutating QuestionIR, DocumentIR, Question Bank semantics, geometry semantics, exam semantics, or GDPT/KNTT rules as part of a brand-only migration.

## Completion condition

The rename is complete when all active surfaces and new artifacts use MST-MATH, legacy PiMath identifiers exist only in explicitly classified compatibility/history locations, and all existing semantic/technical QA remains green.
