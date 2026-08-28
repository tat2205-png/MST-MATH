from pathlib import Path
import json,sys

ROOT=Path(__file__).resolve().parents[1]
cat=json.loads((ROOT/"inference/pyramid-altitude-inference-catalog.json").read_text(encoding="utf-8"))
cases=json.loads((ROOT/"tests/geo5-golden-negative-cases.json").read_text(encoding="utf-8"))
templates={t["id"]:t for t in cat["templates"]}

def fkey(t,objs): return t+":"+("|".join(objs))

def apply(template,facts):
    have={fkey(t,o) for t,o in facts}
    missing=[]
    for p in template["premises"]:
        k=fkey(p["type"],p["objects"])
        if k not in have:
            missing.append(k)
    if missing:
        return "NO_INFERENCE",[],missing
    out=[(d["type"],d["objects"]) for d in template["derive"]]
    return "PASS",out,[]

fail=0
print(f"GEO-5 templates: {len(templates)}")
print(f"GEO-5 cases: {len(cases['cases'])}")

for c in cases["cases"]:
    t=templates.get(c["template"])
    if not t:
        print("FAIL",c["id"],"missing template")
        fail+=1
        continue
    st,out,missing=apply(t,c["facts"])
    ok=st==c["expect"]
    if ok and st=="PASS":
        expected=[(x[0],x[1]) for x in c.get("expect_derived",[])]
        ok=out==expected
    print(("PASS " if ok else "FAIL ")+c["id"])
    if not ok:
        fail+=1
        print(" status=",st," out=",out," missing=",missing)

# Hard catalog invariants
rp=cat["render_policy"]
if rp["altitude_vertical_only_if_verified"] is not True:
    fail+=1;print("FAIL vertical altitude policy")
if rp["visual_inference_forbidden"] is not True:
    fail+=1;print("FAIL visual inference policy")
if rp["missing_premise_policy"]!="NO_INFERENCE":
    fail+=1;print("FAIL missing premise policy")
if cat["layout_contract"]["layout_id"]!="NA-MATH-LAYOUT-V1.3-CANONICAL":
    fail+=1;print("FAIL layout id")
if cat["layout_contract"]["layout_status"]!="LOCKED":
    fail+=1;print("FAIL layout lock")
if cat["layout_contract"]["geometry_may_change_layout"] is not False:
    fail+=1;print("FAIL geometry layout isolation")

# Ensure critical templates exist
required={
 "DIRECT_ALTITUDE_GIVEN",
 "TWO_INTERSECTING_BASE_LINES_TO_ALTITUDE",
 "PERP_SIDE_PLANE_TO_BASE_ALTITUDE",
 "EQUAL_SA_SB_SC_CIRCUMCENTER",
 "RIGHT_ANGLES_SBA_SCA_TO_CYCLIC_FOOT",
}
if set(templates)!=required:
    fail+=1
    print("FAIL template set",set(templates))

if fail:
    print(f"GEO_5_STATUS=FAIL ({fail} failures)")
    sys.exit(1)

print(f"GEO_5_STATUS=PASS ({len(cases['cases'])}/{len(cases['cases'])} cases passed)")
print("ALTITUDE_VERTICAL_ONLY_IF_VERIFIED=PASS")
print("MISSING_PREMISE_NO_INFERENCE=PASS")
print("VISUAL_INFERENCE_FORBIDDEN=PASS")
print("CIRCUMCENTER_RULE=PASS")
print("CYCLIC_HBAC_RULE=PASS")
print("SIDE_PLANE_ALTITUDE_RULE=PASS")
print("LAYOUT_V1_3_PRESERVED=PASS")
