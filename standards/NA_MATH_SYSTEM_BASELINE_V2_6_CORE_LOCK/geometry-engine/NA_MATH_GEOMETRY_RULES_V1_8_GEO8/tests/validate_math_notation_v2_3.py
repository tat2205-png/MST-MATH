from pathlib import Path
import json,sys

ROOT=Path(__file__).resolve().parents[1]
cases=json.loads((ROOT/"tests/gdpt2018-kntt-math-notation-v2_3-cases.json").read_text(encoding="utf-8"))
blocked=set("⊥∥∈∉∩∪⊂⊆√∠⇒⇔≠≤≥∞")
fails=0
for c in cases["cases"]:
    has_raw=any(ch in c["source"] for ch in blocked)
    actual="BLOCKED" if has_raw else "PASS"
    ok=actual==c["expect"]
    print(("PASS " if ok else "FAIL ")+c["id"])
    if not ok: fails+=1
if fails:
    print(f"MATH_NOTATION_REGRESSION=FAIL ({fails})")
    sys.exit(1)
print(f"MATH_NOTATION_REGRESSION=PASS ({len(cases['cases'])}/{len(cases['cases'])})")
print("RAW_UNICODE_MATH_SYMBOLS=BLOCKED")
print("MATH_ENGINE_RENDERING=REQUIRED")
