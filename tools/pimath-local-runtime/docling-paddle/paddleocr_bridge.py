"""PiMath evidence-only bridge for real PaddleOCR."""
import hashlib, json, sys
from pathlib import Path

def version():
    try:
        import importlib.metadata
        return importlib.metadata.version("paddleocr")
    except Exception: return "unknown"

def main(req):
    source, source_hash = req.get("sourceDocument"), req.get("sourceHash")
    if not isinstance(source, str) or not source or len(source) > 4096: raise ValueError("invalid sourceDocument")
    path = Path(source).resolve()
    if not path.is_file() or path.stat().st_size > 50 * 1024 * 1024: raise ValueError("source file not allowed")
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if not isinstance(source_hash, str) or source_hash.lower() != actual: raise ValueError("sourceHash mismatch")
    from paddleocr import PaddleOCR
    # Keep the deterministic CPU path lean and avoid optional orientation/
    # unwarping graphs that are incompatible with some Windows oneDNN builds.
    ocr = PaddleOCR(lang=req.get("lang", "en"), device="cpu",
                    use_doc_orientation_classify=False,
                    use_doc_unwarping=False,
                    use_textline_orientation=False)
    result = ocr.predict(str(path))
    items = []
    for page_index, page in enumerate(result):
        data = page if isinstance(page, dict) else getattr(page, "json", lambda: {})()
        if isinstance(data, dict) and "res" in data: data = data["res"]
        texts = data.get("rec_texts", []) if isinstance(data, dict) else []
        scores = data.get("rec_scores", []) if isinstance(data, dict) else []
        boxes = data.get("rec_polys", data.get("dt_polys", [])) if isinstance(data, dict) else []
        for i, text in enumerate(texts):
            items.append({"text": str(text), "confidence": float(scores[i]) if i < len(scores) else None,
                          "boundingBox": (boxes[i].tolist() if hasattr(boxes[i], "tolist") else boxes[i]) if i < len(boxes) else None,
                          "page": page_index, "image": path.name})
    return {"payload": {"sourceDocument": source, "sourceHash": source_hash, "items": items},
            "confidence": min((x["confidence"] for x in items if x["confidence"] is not None), default=0.0),
            "issues": ["REVIEW_REQUIRED_LOW_CONFIDENCE"] if any((x["confidence"] or 0) < .8 for x in items) else [],
            "provider": "paddleocr", "providerVersion": version()}

if __name__ == "__main__":
    try:
        if len(sys.argv) != 2: raise ValueError("one JSON request argument required")
        req = json.loads(sys.argv[1]); print(json.dumps(main(req), ensure_ascii=False, separators=(",", ":")))
    except Exception as exc:
        print(f"paddleocr bridge failure: {type(exc).__name__}: {exc}", file=sys.stderr)
        print(json.dumps({"payload": {}, "confidence": 0.0, "issues": ["RUNTIME_FAILURE", str(exc)[:200]], "provider": "paddleocr", "providerVersion": version()}, separators=(",", ":")))
