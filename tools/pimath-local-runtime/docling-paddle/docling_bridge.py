"""PiMath evidence-only bridge for the real Docling runtime."""
import hashlib, json, os, sys
from pathlib import Path

MAX_INPUT = 2_000_000

def fail(code, message, source=None, source_hash=None):
    return {"payload": {"sourceDocument": source, "sourceHash": source_hash}, "confidence": 0.0,
            "issues": [code, message], "provider": "docling", "providerVersion": version()}

def version():
    try:
        import importlib.metadata
        return importlib.metadata.version("docling")
    except Exception:
        return "unknown"

def main(req):
    source = req.get("sourceDocument")
    source_hash = req.get("sourceHash")
    if not isinstance(source, str) or not source or len(source) > 4096:
        return fail("INVALID_SOURCE_DOCUMENT", "sourceDocument must be a bounded non-empty path", source, source_hash)
    path = Path(source).resolve()
    if not path.is_file() or path.stat().st_size > 100 * 1024 * 1024:
        return fail("SOURCE_NOT_ALLOWED", "sourceDocument must resolve to an existing bounded file", source, source_hash)
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if not isinstance(source_hash, str) or source_hash.lower() != actual:
        return fail("SOURCE_HASH_MISMATCH", "sourceHash does not match sourceDocument", source, source_hash)
    try:
        from docling.document_converter import DocumentConverter
        result = DocumentConverter().convert(str(path))
        doc = result.document
        payload = {"sourceDocument": source, "sourceHash": source_hash,
                   "text": doc.export_to_markdown(), "status": "converted"}
        return {"payload": payload, "confidence": 1.0, "issues": [], "provider": "docling", "providerVersion": version()}
    except Exception as exc:
        print(f"docling bridge failure: {type(exc).__name__}: {exc}", file=sys.stderr)
        return fail("DOCLING_RUNTIME_ERROR", "provider conversion failed", source, source_hash)

if __name__ == "__main__":
    try:
        raw = sys.argv[1] if len(sys.argv) == 2 else ""
        if len(raw) > MAX_INPUT: raise ValueError("request too large")
        req = json.loads(raw)
        if not isinstance(req, dict): raise ValueError("request must be an object")
        print(json.dumps(main(req), ensure_ascii=False, separators=(",", ":")))
    except Exception as exc:
        print(f"bridge input failure: {type(exc).__name__}: {exc}", file=sys.stderr)
        print(json.dumps(fail("INVALID_REQUEST", "request rejected"), separators=(",", ":")))
