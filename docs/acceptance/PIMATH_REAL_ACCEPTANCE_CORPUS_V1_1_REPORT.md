# PIMATH Real Acceptance Corpus V1.1

Status: `PASS_RUNTIME_WITH_HUMAN_REFERENCE_PENDING`

Selected corpus count: 3. Source PDFs and SHA-256 identities are unchanged from immutable V1.

Native PDF execution: PASS for all three sources (bounded native extraction; fidelity not claimed).

Docling: PASS for real PDF bounded page-range execution using the installed `page_range=(1,1)` API. Full-book processing is supported by repeating bounded page chunks; no full-book fidelity claim is made.

PaddleOCR: PASS for real Vietnamese OCR on a temporary rasterized representative page. Application locale `vi-VN` is normalized at the provider boundary to PaddleOCR `vi`; output included text, confidence, and bounding boxes. Raster provenance and original source identity are retained in the run evidence.

Canvas: native `canvas.node` restored by locked-graph `npm ci` followed by `npm rebuild canvas --foreground-scripts`; no package metadata changed.

Qwen3-VL `qwen3-vl:2b` remains optional semantic assistance only and was not required for runtime acceptance.

Benchmark dimensions requiring ground truth remain `READY_PENDING_HUMAN_REFERENCE` or `NOT_MEASURABLE_WITHOUT_REFERENCE`; no percentages are fabricated.
