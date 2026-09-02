# PiMath Docling/PaddleOCR runtime

These bridges invoke the locally installed providers and return evidence-only
PiMath envelopes. They do not create or promote `DocumentIR`; callers must
retain teacher review and provenance. Invoke each bridge with exactly one JSON
request argument containing an existing `sourceDocument` and its SHA-256
`sourceHash`.
