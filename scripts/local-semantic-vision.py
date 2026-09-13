import json
import sys
import os
from pathlib import Path
from paddleocr import PPStructureV3

inputs = [Path(item) for item in sys.argv[1:]]
if not inputs:
    raise SystemExit("INPUT_REQUIRED")
pipeline = PPStructureV3(lang="vi", ocr_version="PP-OCRv3", device=os.environ.get("MST_MATH_OCR_DEVICE", "cpu"), use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False, use_table_recognition=False, use_formula_recognition=True, use_chart_recognition=False)
output = []
for source in inputs:
    page = list(pipeline.predict(input=str(source)))[0].json["res"]
    regions = []
    for item in page.get("parsing_res_list", []):
        label = str(item.get("block_label", "other")); content = str(item.get("block_content", ""))
        kind = "MATH" if label == "formula" else "FIGURE" if label in {"image", "chart", "figure"} else "TEXT" if label in {"text", "title", "doc_title", "paragraph_title", "number", "header"} else "OTHER"
        if kind == "TEXT" and ("\\" in content or "$" in content) and any(token in content for token in ("\\frac", "\\overline", "\\cup", "\\cdot", "P(", "=", "≤", "≥")): kind = "MATH"
        regions.append({"type": kind, "bbox": item.get("block_bbox"), "text": content, "order": item.get("block_order"), "confidence": item.get("score"), "source": "PADDLE_PPSTRUCTUREV3"})
    output.append({"file": str(source), "width": page.get("width"), "height": page.get("height"), "regions": regions, "provider": "PaddleOCR-PPStructureV3/Paddle-3.2.2"})
print(json.dumps(output, ensure_ascii=False))
