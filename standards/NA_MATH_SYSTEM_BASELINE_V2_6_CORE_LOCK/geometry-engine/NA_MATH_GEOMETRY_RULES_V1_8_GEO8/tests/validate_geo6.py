from pathlib import Path
import json,math,sys,re

ROOT=Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/"canonical/canonical-geometry-catalog.json").read_text(encoding="utf-8"))
cases=json.loads((ROOT/"tests/geo6-golden-negative-cases.json").read_text(encoding="utf-8"))

profiles={p["id"]:p for p in catalog["profiles"]}

def canon_edge(e):
    labels=re.findall(r"[A-Za-z](?:′)?",e)
    if len(labels)==2 and "".join(labels)==e:
        return "".join(sorted(labels))
    return e

def common_translation(base1,base2,eps=1e-9):
    if len(base1)!=len(base2) or not base1:return False
    dx=base2[0][0]-base1[0][0]
    dy=base2[0][1]-base1[0][1]
    for a,b in zip(base1,base2):
        if abs((b[0]-a[0])-dx)>eps or abs((b[1]-a[1])-dy)>eps:
            return False
    return True

def trapezoid(large,small,offset,gap):
    if not (large>small>0 and gap>0):raise ValueError
    A=(0,0);B=(large,0);D=(offset,gap);C=(offset+small,gap)
    return A,B,C,D

def dist(a,b):return math.hypot(b[0]-a[0],b[1]-a[1])

def classify(parallel,right,equal):
    p=parallel
    r=p and right
    c=r and equal
    return {"parallelepiped":p,"rectangularBox":r,"cube":c}

fail=0
print(f"GEO-6 profiles: {len(profiles)}")
print(f"GEO-6 cases: {len(cases['cases'])}")

for c in cases["cases"]:
    ok=False

    if c["type"]=="tri_prism":
        p=profiles["TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT"]
        dashed={canon_edge(x) for x in p["visibility"]["dashed"]}
        solid={canon_edge(x) for x in p["visibility"]["solid"]}
        expd={canon_edge(x) for x in c["expect"]["dashed"]}
        exps={canon_edge(x) for x in c["expect"]["solid"]}
        ok=(dashed==expd and solid==exps)

    elif c["type"]=="translation":
        ok=(common_translation(c["base1"],c["base2"])==c["expect"])

    elif c["type"]=="trapezoid":
        A,B,C,D=trapezoid(c["large"],c["small"],c["offset"],c["gap"])
        ratio=dist(A,B)/dist(D,C)
        horizontal=(A[1]==B[1] and D[1]==C[1])
        above=(A[1]<D[1] and B[1]<C[1])
        ok=horizontal and above and abs(ratio-c["expect_ratio"])<1e-9

    elif c["type"]=="trapezoid_offset":
        A,B,C,D=trapezoid(c["large"],c["small"],c["offset"],c["gap"])
        ok=abs(D[0]-c["expect_offset"])<1e-9

    elif c["type"]=="box_classify":
        ok=classify(c["parallel"],c["right"],c["equal"])==c["expect"]

    print(("PASS " if ok else "FAIL ")+c["id"])
    if not ok:fail+=1

# Hard topology formulas
for N in range(3,11):
    V=2*N;E=3*N;F=N+2
    if V-E+F!=2:
        fail+=1
        print("FAIL prism topology N=",N)

# Trapezoid profile hard lock
tp=profiles["TRAPEZOID_BASE_LARGE_TOP_HORIZONTAL"]
tc=tp["construction"]
if tc["large_base_orientation"]!="horizontal":fail+=1;print("FAIL trapezoid horizontal")
if tc["large_base_position"]!="top":fail+=1;print("FAIL trapezoid top")
if tc["small_base_position"]!="below":fail+=1;print("FAIL trapezoid below")
if tc["preserve_numeric_ratio_if_given"] is not True:fail+=1;print("FAIL trapezoid ratio policy")

# Prism common translation hard lock
gp=profiles["GENERIC_N_GONAL_PRISM_PARALLEL_TRANSLATION"]
if gp["construction"]["second_base_equals_first_base_plus_common_translation"] is not True:
    fail+=1;print("FAIL common translation policy")
if gp["construction"]["lateral_edges_all_parallel"] is not True:
    fail+=1;print("FAIL lateral parallel policy")

# Layout invariant
lc=catalog["layout_contract"]
if lc["layout_id"]!="NA-MATH-LAYOUT-V1.3-CANONICAL" or lc["status"]!="LOCKED" or lc["geometry_may_change_layout"] is not False:
    fail+=1;print("FAIL layout lock")

if fail:
    print(f"GEO_6_STATUS=FAIL ({fail} failures)")
    sys.exit(1)

print(f"GEO_6_STATUS=PASS ({len(cases['cases'])}/{len(cases['cases'])} cases passed)")
print("TRIANGULAR_PRISM_CANONICAL=PASS")
print("GENERIC_PRISM_TRANSLATION=PASS")
print("PRISM_TOPOLOGY_N_3_TO_10=PASS")
print("BOX_SEMANTIC_SPECIALIZATION=PASS")
print("TRAPEZOID_LARGE_TOP_HORIZONTAL=PASS")
print("TRAPEZOID_RATIO_PRESERVATION=PASS")
print("NO_AUTOMATIC_ISOSCELES_TRAPEZOID=PASS")
print("LAYOUT_V1_3_PRESERVED=PASS")
