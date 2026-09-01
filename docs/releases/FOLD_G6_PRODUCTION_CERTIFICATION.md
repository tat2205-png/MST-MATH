# Fold V1 G6 Production Certification

Status: PASS; external browser and localhost validation completed on the unchanged current worktree.

- SUPPORTED_SOLIDS: prism N=3..10; pyramid N=3..10; cylinder; cone; conical frustum
- SUPPORTED_PATH_SCOPE: polyhedral shortest paths and existing developable lateral-surface shortest paths; fold/unfold, correspondence, ordered waypoints, configurable/periodic seams, and fold-back validation
- DEFERRED_SCOPE: ARBITRARY_CURVED_SHORTEST_PATH=DEFERRED_FUTURE; GENERAL_DISK_ROUTING=DEFERRED_FUTURE; unsupported requests fail closed with `UNSUPPORTED` exactness or `FAIL`
- RUNTIME_ENTRY_POINT: `/fold` (same canonical viewer implementation as `/dev/fold-3d`; production route has no dev flag dependency)
- DGK: `PIMATH_DEVELOPABLE_GEOMETRY_KERNEL_V1.0`; canonical geometry computation and state kernel
- GEOGEBRA_PRODUCT_ROLE: primary visualization and authoring tool
- GEOGEBRA_AUTHORITY_ROLE: adapter boundary, non-authoritative
- THREEJS_PRODUCT_ROLE: secondary technical viewer; adapter boundary, non-authoritative
- MANIM_ROLE: optional video export adapter
- LAYOUT: dual synchronized GeoGebra 2D planar net and GeoGebra 3D spatial model over shared fold state
- PIMATH_DNA_BASELINE: `PIMATH_DNA_GLOBAL_BASELINE_V1.0`, baseline commit `486ffc02fce4bd4314af68cd5e3ace312ead5fb5`; semantic geometry authority `NA_MATH_GEOMETRY_RULES_V1_8_GEO8`
- GOLDEN_CASE: `SQUARE_SHEET_TO_REGULAR_SQUARE_FRUSTUM`
- CUT_MATERIAL_POLICY: visible in flat view, remains at original 2D position, `REMOVED_MATERIAL` role, no fold participation
- GEOGEBRA_LABEL_POLICY: automatic object labels OFF; pedagogical labels are intentional Text objects
- GEOGEBRA_TOOLBAR_POLICY: full authoring toolbar visible and editable interactive workspace retained
- START_END: PASS
- WAYPOINT: PASS
- SHARED_STATE: PASS
- TEST_RESULTS: focused standard, route, pattern-fold, GeoGebra, integration, lint, and build checks PASS
- FULL_REGRESSION: PASS; 70/70 suites PASS after external macOS localhost validation
- KNOWN_LIMITATIONS: Manim is optional export only; no arbitrary curved or unrestricted disk routing is claimed
- BROWSER_TARGET: Chrome/152.0.7977.65 via DevTools Protocol 1.3 at `127.0.0.1:9222`
- PRODUCTION_ROUTE_QA: PASS
- BROWSER_TEST: `tests/browser-fold-authoring-smoke.mjs` on `/fold`; existing developable visual smoke also run on `/fold`
- SUPPORTED_SOLIDS_BROWSER: prism; pyramid; cylinder; cone; conical frustum
- CUT_PATTERN_RESULT: PASS; existing debug details were opened deterministically before observing canonical `sheet.cuts.length` and `sheet.creases.length`
- SHARED_STATE_RESULT: PASS by existing Fold/GeoGebra adapter and integration contract tests
- EXTERNAL_BROWSER_VALIDATION: PASS; `tests/browser-fold-authoring-smoke.mjs`
- EXTERNAL_LOCALHOST_REGRESSION_VALIDATION: PASS; `studio-status-api.test.ts`, `studio-canary-api.test.ts`, `studio-execute-api-phase3.test.ts`, and `studio-real-render-contract-phase4a2.test.ts`
- BROWSER_CERTIFICATION: PASS
- BROWSER_QA: PASS
- RELEASE_DECISION: PASS; G6 production certification complete
