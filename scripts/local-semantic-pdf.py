import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from paddleocr import PPStructureV3

if len(sys.argv) != 2:
    raise SystemExit("PDF_REQUIRED")
source = Path(sys.argv[1]).resolve()
start_page = int(os.environ.get("MST_MATH_INPUT_PDF_START", "1"))
end_page = int(os.environ.get("MST_MATH_INPUT_PDF_END", "0"))
checkpoint_path = Path(os.environ["MST_MATH_INPUT_PDF_CHECKPOINT"]) if os.environ.get("MST_MATH_INPUT_PDF_CHECKPOINT") else None
info = subprocess.check_output(["pdfinfo", str(source)], text=True, encoding="utf-8", errors="replace")
pages = int(next((line.split(":", 1)[1].strip() for line in info.splitlines() if line.startswith("Pages:")), "0"))
if pages <= 0:
    raise SystemExit("PDF_PAGE_COUNT_INVALID")
start_page = max(1, start_page)
end_page = min(pages, end_page or pages)
checkpoint = {}
if checkpoint_path and checkpoint_path.exists():
    try:
        checkpoint = json.loads(checkpoint_path.read_text(encoding="utf-8"))
    except Exception:
        checkpoint = {}

pipeline = PPStructureV3(lang="vi", ocr_version="PP-OCRv3", device="cpu",
    use_doc_orientation_classify=False, use_doc_unwarping=False,
    use_textline_orientation=False, use_table_recognition=False,
    use_formula_recognition=True, use_chart_recognition=False)
result = []
with tempfile.TemporaryDirectory(prefix="mst-pdf-raster-") as temp:
    pending = []
    for page_number in range(start_page, end_page + 1):
        cached = checkpoint.get(str(page_number))
        valid_cached = isinstance(cached, dict) and cached.get("page") == page_number and all(region.get("page") == page_number for region in cached.get("regions", []))
        if valid_cached:
            result.append(cached)
            print(f"CACHE_HIT page={page_number}", file=sys.stderr, flush=True)
            continue
        prefix = str(Path(temp) / f"page-{page_number:04d}")
        subprocess.check_call(["pdftoppm", "-f", str(page_number), "-l", str(page_number), "-singlefile", "-png", "-r", "160", str(source), prefix], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        raster = Path(prefix + ".png")
        pending.append((page_number, raster))
    for page_number, raster in pending:
        prediction = list(pipeline.predict(input=str(raster)))[0]
        page = prediction.json["res"]
        regions = []
        for index, item in enumerate(page.get("parsing_res_list", [])):
            label = str(item.get("block_label", "other"))
            content = str(item.get("block_content", ""))
            kind = "MATH" if label == "formula" else "FIGURE" if label in {"image", "chart", "figure"} else "TEXT" if label in {"text", "title", "doc_title", "paragraph_title", "number", "header"} else "OTHER"
            if kind == "TEXT" and ("\\" in content or "$" in content) and any(token in content for token in ("\\frac", "\\overline", "\\cup", "\\cdot", "P(", "=", "≤", "≥")):
                kind = "MATH"
            regions.append({"type": kind, "bbox": item.get("block_bbox"), "text": content, "order": item.get("block_order", index), "confidence": item.get("score"), "source": "PADDLE_PPSTRUCTUREV3", "page": page_number})
        page_result = {"page": page_number, "width": page.get("width"), "height": page.get("height"), "dpi": 160, "regions": regions}
        result.append(page_result)
        checkpoint[str(page_number)] = page_result
        if checkpoint_path:
            checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
            checkpoint_path.write_text(json.dumps(checkpoint, ensure_ascii=False), encoding="utf-8")
        print(f"SCANNED_PAGE={page_number}/{pages}", file=sys.stderr, flush=True)
result.sort(key=lambda item: item["page"])
print(json.dumps({"file": str(source), "pages": result, "provider": "PaddleOCR-PPStructureV3/Paddle-3.2.2", "model_reuse": True, "range": [start_page, end_page]}, ensure_ascii=False))
