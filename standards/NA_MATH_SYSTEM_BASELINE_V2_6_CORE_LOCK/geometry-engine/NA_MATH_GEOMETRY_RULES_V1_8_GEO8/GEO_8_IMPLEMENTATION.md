# GEO-8 — Golden Geometry QA Corpus & Regression Pack

Status: COMPLETE / PASS

## Purpose
GEO-8 freezes the current approved geometry behavior as a regression baseline.

Every future geometry change must run:

    python -S tests/run_geometry_regression.py

before integration into the locked V1.3 layouts.

## Corpus
- GEO-1: 4 semantic geometry scenes
- GEO-2: 4 view-profile cases
- GEO-3: 5 edge-visibility cases
- GEO-4: 4 label/collision cases
- GEO-5: 9 altitude inference positive/negative cases
- GEO-6: 8 prism/box/trapezoid cases
- GEO-7: 9 spatial-relation positive/negative cases

Total: 43 golden + negative cases.

## Additional critical-lock suite
Checks:
- V1.3 layout lock,
- triangular-prism visibility lock,
- trapezoid orientation/ratio lock,
- view-profile-only visibility,
- verified-altitude-only vertical rendering,
- projected crossing != 3D intersection,
- no decorative connectors between parallel planes.

Regression FAIL => geometry integration BLOCKED.
