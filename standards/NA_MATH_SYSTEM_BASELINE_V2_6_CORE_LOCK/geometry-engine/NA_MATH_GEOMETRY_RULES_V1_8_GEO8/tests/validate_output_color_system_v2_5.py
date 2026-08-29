from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
cases=json.loads((ROOT/"tests/output-color-system-v2_5-cases.json").read_text(encoding="utf-8"))
expected={
 "learning_material":"#0C2D57",
 "worksheet":"#2F8F68",
 "exercise_sheet":"#6B4FA3",
 "video":"#D9911B"
}
fails=0
for c in cases["cases"]:
    actual="PASS" if c["color"].upper()==expected[c["output"]].upper() else "BLOCKED"
    ok=actual==c["expect"]
    print(("PASS " if ok else "FAIL ")+c["id"]+" -> "+actual)
    if not ok: fails+=1
if fails:
    print(f"COLOR_SYSTEM_QA=FAIL ({fails})")
    sys.exit(1)
print(f"COLOR_SYSTEM_QA=PASS ({len(cases['cases'])}/{len(cases['cases'])})")
print("LEARNING_MATERIAL=#0C2D57")
print("WORKSHEET=#2F8F68")
print("EXERCISE_SHEET=#6B4FA3")
print("VIDEO=#D9911B")
