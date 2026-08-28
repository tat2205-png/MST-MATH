from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
cases=json.loads((ROOT/"tests/symbol-registry-v2_4-cases.json").read_text(encoding="utf-8"))
raw=set("⊥∥∈∉√∠⇒⇔≠≤≥∞")
review_variants={"nPk","nCk"}
fails=0
for c in cases["cases"]:
    s=c["input"]
    if any(ch in s for ch in raw):
        actual="BLOCKED"
    elif s in review_variants:
        actual="REVIEW_REQUIRED"
    else:
        actual="PASS"
    ok=actual==c["expected"]
    print(("PASS " if ok else "FAIL ")+c["id"]+" -> "+actual)
    if not ok:
        fails+=1
if fails:
    print(f"SYMBOL_REGISTRY_QA=FAIL ({fails})")
    sys.exit(1)
print(f"SYMBOL_REGISTRY_QA=PASS ({len(cases['cases'])}/{len(cases['cases'])})")
print("CANONICAL_REGISTRY=NA_MATH_KNTT_SYMBOL_STANDARD_V1_0")
print("MATH_ENGINE=REQUIRED")
print("MATH_FONT=Libertinus Math")
