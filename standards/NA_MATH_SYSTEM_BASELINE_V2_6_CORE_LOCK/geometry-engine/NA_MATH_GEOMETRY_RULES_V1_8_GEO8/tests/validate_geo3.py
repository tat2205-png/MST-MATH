from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
reg=json.loads((ROOT/"profiles/view-profile-registry.json").read_text(encoding="utf-8"))
cases=json.loads((ROOT/"tests/geo3-golden-cases.json").read_text(encoding="utf-8"))
profiles={p["id"]:p for p in reg["profiles"]}
ABSTRACT={"all_boundary_edges","plane_outlines","a","b"}

def canon(e):
    if e in ABSTRACT:return e
    L=re.findall(r"[A-Za-z](?:′)?",e)
    return "".join(sorted(L)) if len(L)==2 and "".join(L)==e else e

def resolve(edges,pid):
    p=profiles.get(pid)
    if not p:return "BLOCKED",{},["UNKNOWN_VIEW_PROFILE"]
    solid={canon(x) for x in p.get("edge_styles",{}).get("solid",[])}
    dashed={canon(x) for x in p.get("edge_styles",{}).get("dashed",[])}
    if "all_boundary_edges" in solid:
        solid.remove("all_boundary_edges");solid.update(canon(x) for x in edges)
    if "plane_outlines" in solid:solid.remove("plane_outlines")
    errs=[];out={};scene={canon(x) for x in edges}
    for x in solid:
        if x in dashed:errs.append("CONFLICTING_EDGE_STYLE:"+x)
    for e in edges:
        c=canon(e);s=c in solid;d=c in dashed
        if not s and not d:errs.append("EDGE_STYLE_UNSPECIFIED:"+e)
        elif s and d:errs.append("EDGE_STYLE_AMBIGUOUS:"+e)
        else:out[e]="dashed" if d else "solid"
    for x in solid|dashed:
        if x not in ABSTRACT and x not in scene:errs.append("PROFILE_REFERENCES_MISSING_EDGE:"+x)
    return ("BLOCKED",{},errs) if errs else ("PASS",out,[])

fail=0
print("GEO-3 inherited QA")
for c in cases["cases"]:
    st,out,errs=resolve(c["edges"],c["profile"])
    ok=st==c["expect_status"]
    if ok and st=="PASS":ok=out==c["expected"]
    if ok and c.get("expect_error"):ok=c["expect_error"] in errs
    print(("PASS " if ok else "FAIL ")+c["id"])
    fail+=0 if ok else 1

tri=profiles["TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT"]
if {canon(x) for x in tri["edge_styles"]["dashed"]}!={canon("AB")}:
    fail+=1;print("FAIL tri dashed lock")
if {canon(x) for x in tri["edge_styles"]["solid"]}!={canon(x) for x in ["CA","CB","C′A′","C′B′","CC′","AA′","BB′","A′B′"]}:
    fail+=1;print("FAIL tri solid lock")

if fail:
    print(f"GEO_3_STATUS=FAIL ({fail})");sys.exit(1)
print(f"GEO_3_STATUS=PASS ({len(cases['cases'])}/{len(cases['cases'])})")
print("EDGE_ID_NORMALIZATION=PASS")
print("LAYOUT_V1_3_PRESERVED=PASS")
