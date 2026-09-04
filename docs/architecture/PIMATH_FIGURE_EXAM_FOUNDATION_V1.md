# PiMath Figure + Exam Foundation V1

Status: approved additive foundation; DNA consumer only.

The figure/exam workstreams reuse `MathScene`/`GeometrySpec`, the existing Figure Slot authority when present, `DocumentIR`, question contracts, asset/provenance records, output profiles, existing renderers, and existing QA gates. `FigureCompatibilityContract` is only a versioned bridge for identity, placement, provenance, and QA; it does not define geometry primitives or a renderer.

Local document intelligence is registered as an implementation decision: native PiMath extraction is authoritative; Docling is the primary structured parser adapter, PaddleOCR is used only when OCR is required, and Qwen3-VL through Ollama is optional semantic assistance. AI output is reviewable evidence and must pass deterministic PiMath QA. Mathpix is forbidden, and no paid runtime dependency is required.

Golden fixtures are manifest-only until the seven real figure sources and Exam 308 are available; no evidence is fabricated.
