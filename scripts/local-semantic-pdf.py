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
info = subprocess.check_output(["pdfinfo", str(source)], text=True, encoding="utf-8", errors="replace")
pages = int(next((line.split(":", 1)[1].strip() for line in info.splitlines() if line.startswith("Pages:")), "0"))
if pages <= 0:
    raise SystemExit("PDF_PAGE_COUNT_INVALID")

pipeline = PPStructureV3(lang="vi", ocr_version="PP-OCRv3", device="cpu",
    use_doc_orientation_classify=False, use_doc_unwarping=False,
    use_textline_orientation=False, use_table_recognition=False,
    use_formula_recognition=True, use_chart_recognition=False)
result = []
with tempfile.TemporaryDirectory(prefix="mst-pdf-raster-") as temp:
    rasters = []
    for page_number in range(1, pages + 1):
        prefix = str(Path(temp) / f"page-{page_number:04d}")
        subprocess.check_call(["pdftoppm", "-f", str(page_number), "-l", str(page_number), "-singlefile", "-png", "-r", "220", str(source), prefix], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        raster = Path(prefix + ".png")
        rasters.append((page_number, raster))
    for offset in range(0, len(rasters), 8):
        batch = rasters[offset:offset + 8]
        predictions = list(pipeline.predict(input=[str(item[1]) for item in batch]))
        for (page_number, raster), prediction in zip(batch, predictions):
            page = prediction.json["res"]
            regions = []
            for index, item in enumerate(page.get("parsing_res_list", [])):
                label = str(item.get("block_label", "other"))
                content = str(item.get("block_content", ""))
                kind = "MATH" if label == "formula" else "FIGURE" if label in {"image", "chart", "figure"} else "TEXT" if label in {"text", "title", "doc_title", "paragraph_title", "number", "header"} else "OTHER"
                if kind == "TEXT" and ("\\" in content or "$" in content) and any(token in content for token in ("\\frac", "\\overline", "\\cup", "\\cdot", "P(", "=", "≤", "≥")):
                    kind = "MATH"
                regions.append({"type": kind, "bbox": item.get("block_bbox"), "text": content, "order": item.get("block_order", index), "confidence": item.get("score"), "source": "PADDLE_PPSTRUCTUREV3", "page": page_number})
            result.append({"page": page_number, "width": page.get("width"), "height": page.get("height"), "dpi": 220, "regions": regions})
print(json.dumps({"file": str(source), "pages": result, "provider": "PaddleOCR-PPStructureV3/Paddle-3.2.2", "model_reuse": True}, ensure_ascii=False))
