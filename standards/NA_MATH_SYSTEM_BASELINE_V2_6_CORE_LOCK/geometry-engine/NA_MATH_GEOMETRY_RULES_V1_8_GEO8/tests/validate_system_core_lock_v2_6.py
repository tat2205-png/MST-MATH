from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
cases=json.loads((ROOT/"tests/system-core-lock-v2_6-cases.json").read_text(encoding="utf-8"))
policy={
 "NEW_FEATURE":"BLOCKED",
 "NEW_GEOMETRY_PROFILE":"REVIEW_REQUIRED",
 "BUG_FIX":"ALLOWED",
 "QA":"ALLOWED",
 "CANONICALIZATION":"ALLOWED"
}
locked={"layout","color_system","typography","math_notation","approved_geometry_profiles"}
fails=0
for c in cases["cases"]:
    if "action" in c:
        actual=policy[c["action"]]
    else:
        actual="BLOCKED" if c["layer"] in locked else "ALLOWED"
    ok=actual==c["expect"]
    print(("PASS " if ok else "FAIL ")+c["id"]+" -> "+actual)
    if not ok: fails+=1
if fails:
    print(f"SYSTEM_CORE_LOCK_QA=FAIL ({fails})")
    sys.exit(1)
print(f"SYSTEM_CORE_LOCK_QA=PASS ({len(cases['cases'])}/{len(cases['cases'])})")
print("NEW_FEATURE=BLOCKED")
print("NEW_GEOMETRY_PROFILE=REVIEW_REQUIRED")
print("LOCKED_LAYER_MUTATION=BLOCKED")
