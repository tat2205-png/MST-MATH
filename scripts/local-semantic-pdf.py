import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from paddleocr import PPStructureV3

if len(sys.argv) != 2:
    raise SystemExit("PDF_REQUIRED")
source = Path(sys.argv[1]).resolve()
start_page = int(os.environ.get("MST_MATH_INPUT_PDF_START", "1"))
end_page = int(os.environ.get("MST_MATH_INPUT_PDF_END", "0"))
dpi = int(os.environ.get("MST_MATH_OCR_DPI", "160"))
device = os.environ.get("MST_MATH_OCR_DEVICE", "cpu")
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

result = []
def save_checkpoint(value):
    if not checkpoint_path:
        return
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = checkpoint_path.with_suffix(checkpoint_path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
    temporary.replace(checkpoint_path)

with tempfile.TemporaryDirectory(prefix="mst-pdf-raster-") as temp:
    pending_pages = []
    for page_number in range(start_page, end_page + 1):
        cached = checkpoint.get(str(page_number))
        valid_cached = isinstance(cached, dict) and cached.get("page") == page_number and all(region.get("page") == page_number for region in cached.get("regions", []))
        if valid_cached:
            result.append(cached)
            print(f"CACHE_HIT page={page_number}", file=sys.stderr, flush=True)
            continue
        pending_pages.append(page_number)
    pipeline = None
    if pending_pages:
        pipeline = PPStructureV3(lang="vi", ocr_version="PP-OCRv3", device=device,
            use_doc_orientation_classify=False, use_doc_unwarping=False,
            use_textline_orientation=False, use_table_recognition=False,
            use_formula_recognition=True, use_chart_recognition=False)
    for page_number in pending_pages:
        started = time.perf_counter()
        prefix = str(Path(temp) / f"page-{page_number:04d}")
        subprocess.check_call(["pdftoppm", "-f", str(page_number), "-l", str(page_number), "-singlefile", "-png", "-r", str(dpi), str(source), prefix], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        raster = Path(prefix + ".png")
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
        page_result = {"page": page_number, "width": page.get("width"), "height": page.get("height"), "dpi": dpi, "device": device, "regions": regions, "elapsed_ms": round((time.perf_counter() - started) * 1000)}
        result.append(page_result)
        checkpoint[str(page_number)] = page_result
        save_checkpoint(checkpoint)
        print(f"SCANNED_PAGE={page_number}/{pages}", file=sys.stderr, flush=True)
result.sort(key=lambda item: item["page"])
# MST_MATH_UTF8_STDIO_GUARD_V1
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="strict")
    sys.stderr.reconfigure(encoding="utf-8", errors="backslashreplace")
except (AttributeError, ValueError):
    pass
print(json.dumps({"file": str(source), "pages": result, "provider": "PaddleOCR-PPStructureV3/Paddle-3.2.2", "model_reuse": True, "range": [start_page, end_page], "device": device, "dpi": dpi}, ensure_ascii=False))
