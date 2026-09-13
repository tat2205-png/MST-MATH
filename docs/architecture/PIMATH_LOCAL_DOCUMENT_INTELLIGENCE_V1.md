# PiMath Local Document Intelligence V1

Native PiMath OOXML/OMML DOCX ingestion remains the canonical authority and DocumentIR is unchanged. This module adds evidence-only local providers: LibreOffice converts legacy DOC to DOCX; Docling provides structured layout; PaddleOCR provides OCR only when needed; Ollama/Qwen3-VL provides optional semantic assistance. Provider absence is structured and non-fatal.

All providers preserve source identity, SHA-256, provenance, confidence, issues, and review status. Low-confidence or ambiguous evidence is marked for teacher review. AI output cannot mutate canonical math or geometry and carries `AI_SEMANTIC_AUTHORITY=NO`. Execution uses argument-array subprocesses, bounded timeouts, output limits, shell=false, and JSON validation. No provider is an authority, no cloud dependency is introduced, and package manifests are unchanged.

Runtime prerequisites are optional local installations of Docling, PaddleOCR, LibreOffice, and Ollama with Qwen3-VL provisioned separately. Deterministic native extraction is always selected before optional evidence or AI assistance.
