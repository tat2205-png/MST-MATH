# MST-07 — G0.5 Corrective Full Learned Corpus Audit

REPOSITORY=`D:\MST-MATH-MODULES\MST-07-GEOGEBRA-FOLD-AUDIT`
BRANCH=`audit/mst07-fold-corpus-authority-v1`
BASELINE_SHA=`afbf7256a3f89e7320a1fab6251ef85d42dfcba0`
CORPUS_ROOT=`D:\GEOGEBRA CHO AI HỌC`
GOLDEN_USED=`NONE`

## Corpus coverage

`PHYSICAL_SOURCE_FILES=235` (30 physical `.ggb`, 205 `.zip`, 0 `.ggt`). All 235 ZIP/GeoGebraBook/native containers were opened read-only. The ZIP HTML applets contain `193` `ggbBase64` payloads; `192` decoded successfully to native `.ggb` payloads with `geogebra.xml`. Together with the 30 physical `.ggb`, this yields `APPLET_INSTANCES_DISCOVERED=223` and `NATIVE_GGB_DISCOVERED=222`.

Deduplication used container SHA-256, decoded/native `.ggb` SHA-256, and whitespace-normalized `geogebra.xml` SHA-256:

`UNIQUE_CONTAINER_HASHES=221`
`UNIQUE_CONSTRUCTION_XML_HASHES=191`
`GGBBASE64_DISCOVERED=193`
`ARCHIVES_OPENED=235`
`NESTED_ARCHIVES=none observed`

This is `FULL_CORPUS_COVERAGE=PASS` for static extraction. It is not native-runtime validation.

## 89.ggb correction

`89.ggb` SHA-256 is `076c3c8fddc562c222d4c0cb69ec4f480c5edce5ebc83959abf0a92bb7e62913`, matching the expected SHA. It is a `curved-panel folding construction`, not a rectangular prism. Its rectangular-prism net authority is `REJECT`. Only `Rotate`, visibility, slider, fill, and background techniques are retained as `REFERENCE_ONLY`/`ADOPT_PARTIALLY`.

## Candidate classification

Static classification counts: `RECTANGULAR_PRISM_CANDIDATES=8 partial candidates; 0 strict six-rectangle authorities`, `CUBE=2`, `PRISM=8`, `FOLD_UNFOLD=30`, `NET=12`, `HINGE_ROTATION=30`, `OTHER_FOLDING=22`. A `Rotate` or slider alone was never treated as proof of a rectangular-prism fold.

`BEST_CANDIDATE=135.ggb`
`BEST_CANDIDATE_SHA256=12b8ae406b74b7cc56c8ff0d567bfae8a6b5ede446df736065c26626c209dfbd`
`CLASSIFICATION=ADOPT_PARTIALLY`

Its XML has `Prism[E,A,D,B,C]` with six named face outputs and `Net[d,openclose]`. This is the strongest direct prism/net evidence, but static XML does not fully prove that all six faces are rectangles with valid adjacency, a hinge axis, or dynamic fold states.

## Top 10 candidates

| # | Source container | Internal path / material ID | SHA-256 | Geometry classification | Six-rectangle proof | Hinge evidence | Timeline | 2D/3D | Visual evidence | Adopted / rejected properties | Confidence | Classification |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `135.ggb` | `geogebra.xml` | `12b8ae406b74b7cc56c8ff0d567bfae8a6b5ede446df736065c26626c209dfbd` | Prism/polyhedron, six polygon3d outputs | `PARTIAL`; six faces named, rectangle/adjacency incomplete | No `Rotate` | `Net[d,openclose]`, numeric/boolean/button; continuous fold unproven | 3D view; sync unproven | XML styles/views; GUI not reopened | Adopt six-face Prism/Net structure; reject dynamic hinge authority | MEDIUM | `ADOPT_PARTIALLY` |
| 2 | `13.zip` | `bEPyjX7Ep-3D-Solids.html; ggbBase64` | `e94edaf19d3988c981ac6e255e33fdbec36dad6aeaa49488b1b02e37bf63a411` | 3D solids, Prism/Net | `PARTIAL` | No `Rotate` | numeric control; no native timeline | 3D; sync unproven | HTML/XML styles | Adopt prism/net reference; reject fold authority | MEDIUM | `REFERENCE_ONLY` |
| 3 | `mxrytx24x-Rectangular-Prism-Basic-Net-Demo.zip` | `...html; ggbBase64` | `e94edaf19d3988c981ac6e255e33fdbec36dad6aeaa49488b1b02e37bf63a411` | Same native construction as #2 | `PARTIAL` | No `Rotate` | numeric control; no native timeline | 3D; sync unproven | HTML/XML styles | Adopt duplicate provenance/net reference; reject independent authority | MEDIUM | `REFERENCE_ONLY` |
| 4 | `185.zip` | `bs7TznqSP-Surface-Area-amp-Volume.html; ggbBase64` | `464749f5db60c652224f1229d6c5aa048e895a2b7f9d06ebb68dcd730a32bf42` | Prism/polyhedron with Net | `PARTIAL` | No `Rotate` | `Sequence`/numeric; no fold timeline | 3D; sync unproven | XML styles/views | Adopt net reference; reject hinge authority | LOW | `REFERENCE_ONLY` |
| 5 | `27.zip` | `mtj7ybt8d-Cube-Exploration-Template.html; ggbBase64` | `1f2ea9aa6485f254ae45480ab35e3f4db634fc597d6ca683e896aa7067585b04` | Cube/polyhedron with Net | `PARTIAL`; Cube implies six square faces, native adjacency unverified | No `Rotate` | numeric; native behavior unverified | 3D; sync unproven | XML styles/views | Adopt cube/net reference; reject rectangular-prism fold authority | MEDIUM | `REFERENCE_ONLY` |
| 6 | `97.zip` | `bbkxqq87t-Open-Middle-Diagonal-of-a-Rectangular-Prism.html; ggbBase64` | `NOT_RE-LISTED` | Prism/3D candidate | `PARTIAL`; native geometry verification pending | Not proven in static summary | Native reopen required | 3D payload | HTML/XML only | None adopted; authority pending | LOW | `UNKNOWN` |
| 7 | `148.zip` | `mssvahxfg-4Q-Quiz-Creating-Distances-in-3-Space.html; ggbBase64` | `1572b46808ec302803c0bae0867bff7bb6db70a61f4393d54be012c14d618a61` | Prism/polyhedron | `PARTIAL`; Prism present, net not proven | No `Rotate` | button/boolean/numeric; no fold timeline | 3D; sync unproven | XML styles/views | None adopted; reject fold/net authority | LOW | `REFERENCE_ONLY` |
| 8 | `183.zip` | `bv56qg4sa-Creating-Distances-in-3-Space.html; ggbBase64` | `2340d8173ad36c20e94957cb684284a61e976d1fe396d99557acbec9ab1d5d4d` | Prism/polyhedron | `PARTIAL`; Prism present, net not proven | No `Rotate` | button/boolean/numeric; no fold timeline | 3D; sync unproven | XML styles/views | None adopted; reject fold/net authority | LOW | `REFERENCE_ONLY` |
| 9 | `89.ggb` | `geogebra.xml` | `076c3c8fddc562c222d4c0cb69ec4f480c5edce5ebc83959abf0a92bb7e62913` | Curved-panel SurfaceCartesian3D/polygon3d | `FAIL`; not rectangular prism | Multiple `Rotate` commands | `ANG`, `SLratio`; native timeline unverified | 3D; sync unproven | Retain fill/background/visibility/slider techniques | Adopt technique reference only; reject rectangular-prism authority | HIGH | `ADOPT_PARTIALLY` |
| 10 | `139.ggb` | `geogebra.xml` | `35267fb1ca06462732e1df08720afc5718140c2d8c9d3c264f3812c4c0d0ead1` | SurfaceCartesian3D/polygon3d; cuboid unproven | `FAIL/NOT_PROVEN` | `Rotate` controlled by `b` around `A'` | numeric `b`; native state unverified | 3D; sync unproven | XML styles/views | Adopt rotation technique reference; reject prism authority | MEDIUM | `REFERENCE_ONLY` |

## GEO-P1…P11 precheck

- `GEO-P1`: `PASS_STATIC` — 235 physical sources enumerated and opened.
- `GEO-P2`: `PASS_STATIC` — 193 `ggbBase64` payloads located.
- `GEO-P3`: `PASS_STATIC` — 192 decoded base64 payloads plus 30 physical `.ggb` yielded native XML.
- `GEO-P4`: `PARTIAL` — Prism/Net candidates found; no strict six-rectangle-plus-adjacency proof completed.
- `GEO-P5`: `PARTIAL` — Rotate and axis dependencies inventoried; hinge semantics not visually verified.
- `GEO-P6`: `NOT_RUN_NEEDS_NATIVE_RUNTIME` — fold/unfold controls and timeline.
- `GEO-P7`: `NOT_RUN_NEEDS_NATIVE_RUNTIME` — intermediate states.
- `GEO-P8`: `PASS_STATIC` — object style, fill, opacity, labels, view/background records inventoried.
- `GEO-P9`: `NOT_RUN_NEEDS_NATIVE_RUNTIME` — 2D/3D synchronization and reset.
- `GEO-P10`: `NOT_RUN_NEEDS_NATIVE_RUNTIME` — teacher visual acceptance.
- `GEO-P11`: `NOT_RUN_NEEDS_NATIVE_RUNTIME` — release authority.

## Final report

`PHYSICAL_SOURCE_FILES=235`
`ARCHIVES_OPENED=235`
`APPLET_INSTANCES_DISCOVERED=223`
`GGBBASE64_DISCOVERED=193`
`NATIVE_GGB_DISCOVERED=222`
`UNIQUE_CONTAINER_HASHES=221`
`UNIQUE_CONSTRUCTION_XML_HASHES=191`
`RECTANGULAR_PRISM_CANDIDATES=8 partial; 0 strict authority`
`TOP_10_CANDIDATES=10`
`89_GGB_CORRECTION_STATUS=curved-panel folding; rectangular-prism authority REJECT`
`FULL_CORPUS_COVERAGE=PASS`

`JSON_PARSE_STATUS=PASS` · `DIFF_CHECK=PASS` · `FORBIDDEN_CHANGE_CHECK=PASS`
`NATIVE_REOPEN_STATUS=NOT_RUN — NEEDS_NATIVE_RUNTIME` · `PASS_FAIL_BLOCKED=BLOCKED`
`COMMIT_STATUS=NOT_COMMITTED` · `PUSH_STATUS=NOT_PUSHED`

No `.ggb` was created, no G1 specification was written, and no implementation was performed. Only the two existing reports were updated.
