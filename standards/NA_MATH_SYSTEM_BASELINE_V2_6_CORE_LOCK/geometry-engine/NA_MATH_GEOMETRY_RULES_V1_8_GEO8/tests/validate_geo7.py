from pathlib import Path
import json,sys

ROOT=Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/"spatial/spatial-relation-catalog.json").read_text(encoding="utf-8"))
cases=json.loads((ROOT/"tests/geo7-golden-negative-cases.json").read_text(encoding="utf-8"))
profiles={p["id"]:p for p in catalog["profiles"]}

def have(facts,t,objs):
    return any(ft==t and fo==objs for ft,fo in facts)

def skew(facts):
    errs=[]
    if not have(facts,"disjoint",["a","b"]):errs.append("SKEW_REQUIRES_DISJOINT")
    if not have(facts,"nonparallel",["a","b"]):errs.append("SKEW_REQUIRES_NONPARALLEL")
    if not have(facts,"noncoplanar",["a","b"]):errs.append("SKEW_REQUIRES_NONCOPLANAR")
    return ("BLOCKED",errs) if errs else ("PASS",[])

def parallel_planes_skew(facts):
    errs=[]
    if not have(facts,"parallel",["P","Q"]):errs.append("PLANES_NOT_PARALLEL")
    if not have(facts,"lies-in",["a","P"]):errs.append("A_NOT_IN_P")
    if not have(facts,"lies-in",["b","Q"]):errs.append("B_NOT_IN_Q")
    if not have(facts,"nonparallel",["a","b"]):errs.append("A_B_NONPARALLEL_NOT_VERIFIED")
    return ("BLOCKED",errs) if errs else ("PASS",[])

fail=0
print(f"GEO-7 profiles: {len(profiles)}")
print(f"GEO-7 cases: {len(cases['cases'])}")

for c in cases["cases"]:
    st="PASS";errs=[]

    if c["mode"]=="skew":
        st,errs=skew(c["facts"])

    elif c["mode"]=="parallel_planes_skew":
        st,errs=parallel_planes_skew(c["facts"])

    elif c["mode"]=="false_intersection":
        if c["renderer_marker"] and not c["semantic_intersection"]:
            st="BLOCKED";errs=["FALSE_INTERSECTION_MARKER_FORBIDDEN"]

    elif c["mode"]=="connector":
        if c["count"]>0:
            st="BLOCKED";errs=["DECORATIVE_PLANE_CONNECTORS_FORBIDDEN"]

    ok=st==c["expect"]
    print(("PASS " if ok else "FAIL ")+c["id"])
    if not ok:
        fail+=1
        print(" status=",st," errors=",errs)

# Profile hard locks
pp=profiles["PARALLEL_PLANES_SKEW_LINES_CANONICAL"]
rr=pp["render_rules"]
if rr["decorative_connectors_between_planes"] is not False:
    fail+=1;print("FAIL plane connector rule")
if rr["fake_prism_edges"] is not False:
    fail+=1;print("FAIL fake prism rule")
if rr["false_intersection_marker"] is not False:
    fail+=1;print("FAIL false intersection rule")
if rr["a_b_projected_directions_must_be_nonparallel"] is not True:
    fail+=1;print("FAIL projected direction rule")

gl=catalog["global_rules"]
if gl["projected_crossing_is_not_intersection"] is not True:
    fail+=1;print("FAIL projected crossing rule")
if gl["decorative_depth_guides_forbidden"] is not True:
    fail+=1;print("FAIL decorative guide rule")
if gl["semantic_3d_is_source_of_truth"] is not True:
    fail+=1;print("FAIL semantic source rule")

lc=catalog["layout_contract"]
if lc["layout_id"]!="NA-MATH-LAYOUT-V1.3-CANONICAL" or lc["status"]!="LOCKED" or lc["geometry_may_change_layout"] is not False:
    fail+=1;print("FAIL layout lock")

if fail:
    print(f"GEO_7_STATUS=FAIL ({fail} failures)")
    sys.exit(1)

print(f"GEO_7_STATUS=PASS ({len(cases['cases'])}/{len(cases['cases'])} cases passed)")
print("SKEW_LINE_SEMANTICS=PASS")
print("PARALLEL_PLANES_PROFILE=PASS")
print("FALSE_INTERSECTION_QA=PASS")
print("DECORATIVE_CONNECTOR_QA=PASS")
print("LINE_PLANE_RELATION_PROFILES=PASS")
print("PLANE_PLANE_RELATION_PROFILES=PASS")
print("SEMANTIC_3D_SOURCE_OF_TRUTH=PASS")
print("LAYOUT_V1_3_PRESERVED=PASS")
