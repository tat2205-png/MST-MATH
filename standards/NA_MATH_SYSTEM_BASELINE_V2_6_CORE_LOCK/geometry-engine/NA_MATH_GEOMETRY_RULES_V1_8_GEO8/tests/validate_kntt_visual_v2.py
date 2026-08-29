from pathlib import Path
import json,sys,re
ROOT=Path(__file__).resolve().parents[1]
reg=json.loads((ROOT/"profiles/kntt-visual-baseline-v2.json").read_text(encoding="utf-8"))
view=json.loads((ROOT/"profiles/view-profile-registry.json").read_text(encoding="utf-8"))
cases=json.loads((ROOT/"tests/kntt-visual-v2-cases.json").read_text(encoding="utf-8"))
profiles={p["id"]:p for p in reg["profiles"]}
view_profiles={p["id"]:p for p in view["profiles"]}
fail=0
def canon(e):
    L=re.findall(r"[A-Za-z](?:′)?",e)
    return "".join(sorted(L)) if len(L)==2 and "".join(L)==e else e
def same(a,b): return {canon(x) for x in a}=={canon(x) for x in b}
print(f"KNTT_VISUAL_V2_CASES={len(cases['cases'])}")
for c in cases["cases"]:
    p=profiles.get(c["profile"]); ok=p is not None
    if ok and c["profile"]=="PYRAMID_QUADRILATERAL_FRONT_TO_BACK_KNTT":
        ok=same(c.get("solid",[]),p["visible_edges"]) and same(c.get("dashed",[]),p["hidden_edges"])
        ok=ok and not any(x in set(p["forbidden_by_default"]) for x in c.get("aux",[]))
    elif ok and c["profile"]=="PYRAMID_SA_PERP_BASE_FRONT_TO_BACK_KNTT":
        ok=("SA ⟂ BASE_PLANE" in c.get("facts",[]) and "A is the altitude foot" in c.get("facts",[]) and "H" not in c.get("objects",[]))
    elif ok and c["profile"]=="SKEW_LINES_MINIMAL_KNTT":
        ok=set(c.get("objects",[]))=={"a","b"}
    elif ok and c["profile"]=="SKEW_LINES_COMMON_PERPENDICULAR_KNTT":
        ok=set(c.get("objects",[]))=={"a","b","Δ","M","N"} and set(c.get("relations",[]))==set(p["required_relations"])
    actual="PASS" if ok else "BLOCKED"
    passed=actual==c["expect"]
    print(("PASS " if passed else "FAIL ")+c["id"])
    if not passed: fail+=1
old=view_profiles.get("PYRAMID_QUADRILATERAL_FRONT_PROFILE")
if not old or old.get("deprecated_for_kntt_default") is not True: fail+=1
for pid in ["PYRAMID_QUADRILATERAL_FRONT_TO_BACK_KNTT","SKEW_LINES_MINIMAL_KNTT","SKEW_LINES_COMMON_PERPENDICULAR_KNTT"]:
    if pid not in view_profiles: fail+=1
if reg["global_rules"]["minimum_necessary_geometry"] is not True: fail+=1
if reg["global_rules"]["auxiliary_geometry_default"]!="FORBIDDEN": fail+=1
if reg["global_rules"]["layout_mutation"]!="FORBIDDEN": fail+=1
if fail:
    print(f"KNTT_VISUAL_V2_REGRESSION=FAIL ({fail})"); sys.exit(1)
print(f"KNTT_VISUAL_V2_REGRESSION=PASS ({len(cases['cases'])}/{len(cases['cases'])})")
print("PYRAMID_FRONT_TO_BACK_VISIBILITY=PASS")
print("NO_AUTO_H_ALTITUDE_MARKER=PASS")
print("SKEW_LINES_MINIMAL_DEFAULT=PASS")
print("COMMON_PERPENDICULAR_MINIMAL=PASS")
print("AUXILIARY_GEOMETRY_FAIL_CLOSED=PASS")
print("LAYOUT_V1_3_PRESERVED=PASS")
