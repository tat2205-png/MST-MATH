from __future__ import annotations

import base64
import json
import sys
from typing import Any


def normalize_error(error: object) -> str:
    if error is None:
        return ""
    return str(error)


def main() -> int:
    try:
        payload: dict[str, Any] = json.load(sys.stdin)
    except Exception as exc:  # pragma: no cover - defensive CLI boundary
        print(json.dumps({"items": [], "fatal": f"INVALID_INPUT_JSON: {exc}"}, ensure_ascii=False))
        return 2

    try:
        from mtef_py.mtef import MTEF
    except Exception as exc:
        items = [
            {"id": str(item.get("id", "")), "ok": False, "error": f"MTEF_PARSER_NOT_AVAILABLE: {exc}"}
            for item in payload.get("items", [])
        ]
        print(json.dumps({"items": items}, ensure_ascii=False))
        return 0

    output: list[dict[str, Any]] = []
    for item in payload.get("items", []):
        item_id = str(item.get("id", ""))
        encoded = item.get("base64")
        if not item_id or not isinstance(encoded, str):
            output.append({"id": item_id, "ok": False, "error": "MTEF_ITEM_INVALID"})
            continue
        try:
            ole_bytes = base64.b64decode(encoded, validate=True)
            mtef, error = MTEF.OpenBytes(ole_bytes)
            if error is not None or mtef is None:
                output.append({"id": item_id, "ok": False, "error": f"MTEF_OPEN_FAILED: {normalize_error(error)}"})
                continue
            latex = mtef.Translate()
            if not isinstance(latex, str) or not latex.strip():
                output.append({"id": item_id, "ok": False, "error": "MTEF_EMPTY_LATEX"})
                continue
            output.append({"id": item_id, "ok": True, "latex": latex.strip()})
        except Exception as exc:  # one broken equation must not crash the document batch
            output.append({"id": item_id, "ok": False, "error": f"MTEF_DECODE_EXCEPTION: {exc}"})

    print(json.dumps({"items": output}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
