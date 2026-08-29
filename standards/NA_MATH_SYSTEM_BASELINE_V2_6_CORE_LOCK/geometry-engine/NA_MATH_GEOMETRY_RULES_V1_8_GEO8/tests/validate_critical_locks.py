from pathlib import Path
import json,re,sys

ROOT=Path(__file__).resolve().parents[1]
locks=json.loads((ROOT/"regression/critical-locks.json").read_text(encoding="utf-8"))
view=json.loads((ROOT/"profiles/view-profile-registry.json").read_text(encoding="utf-8"))
canon=json.loads((ROOT/"canonical/canonical-geometry-catalog.json").read_text(encoding="utf-8"))
inf=json.loads((ROOT/"inference/pyramid-altitude-inference-catalog.json").read_text(encoding="utf-8"))
spatial=json.loads((ROOT/"spatial/spatial-relation-catalog.json").read_text(encoding="utf-8"))
manifest=json.loads((ROOT/"geometry.manifest.json").read_text(encoding="utf-8"))

ABSTRACT={"all_boundary_edges","plane_outlines","a","b"}
def canon_edge(e):
    if e in ABSTRACT:return e
    L=re.findall(r"[A-Za-z](?:′)?",e)
    if len(L)==2 and "".join(L)==e:return "".join(sorted(L))
    return e

errors=[]

# Layout lock across all catalogs
for name,obj,key in [
    ("view",view,"layout_contract"),
    ("canonical",canon,"layout_contract"),
    ("inference",inf,"layout_contract"),
    ("spatial",spatial,"layout_contract")
]:
    lc=obj[key]
    lid=lc.get("layout_id")
    status=lc.get("status",lc.get("layout_status"))
    can_change=lc.get("geometry_may_change_layout")
    if lid!=locks["layout"]["id"]:errors.append(f"{name}:LAYOUT_ID")
    if status!="LOCKED":errors.append(f"{name}:LAYOUT_STATUS")
    if can_change is not False:errors.append(f"{name}:GEOMETRY_LAYOUT_ISOLATION")

profiles={p["id"]:p for p in view["profiles"]}
tri=profiles[locks["triangular_prism"]["profile_id"]]
if {canon_edge(e) for e in tri["edge_styles"]["dashed"]}!={canon_edge(e) for e in locks["triangular_prism"]["dashed_only"]}:
    errors.append("TRIANGULAR_PRISM_DASHED_LOCK")
if {canon_edge(e) for e in tri["edge_styles"]["solid"]}!={canon_edge(e) for e in locks["triangular_prism"]["solid"]}:
    errors.append("TRIANGULAR_PRISM_SOLID_LOCK")

cp={p["id"]:p for p in canon["profiles"]}
trap=cp[locks["trapezoid"]["profile_id"]]
tc=trap["construction"]
if tc["large_base_orientation"]!="horizontal":errors.append("TRAPEZOID_HORIZONTAL")
if tc["large_base_position"]!="top":errors.append("TRAPEZOID_TOP")
if tc["small_base_position"]!="below":errors.append("TRAPEZOID_BELOW")
if tc["preserve_numeric_ratio_if_given"] is not True:errors.append("TRAPEZOID_RATIO")
if not set(locks["trapezoid"]["forbidden"]).issubset(set(trap["forbidden"])):
    errors.append("TRAPEZOID_FORBIDDEN_RULES")

if view["rules"]["visibility_source"]!="VIEW_PROFILE_ONLY":errors.append("VISIBILITY_SOURCE")
if view["rules"]["unknown_profile_policy"]!="BLOCK_RENDER":errors.append("UNKNOWN_PROFILE_POLICY")

if inf["render_policy"]["altitude_vertical_only_if_verified"] is not True:errors.append("ALTITUDE_VERTICAL_POLICY")
if inf["render_policy"]["missing_premise_policy"]!="NO_INFERENCE":errors.append("ALTITUDE_MISSING_PREMISE")
if inf["render_policy"]["visual_inference_forbidden"] is not True:errors.append("ALTITUDE_VISUAL_INFERENCE")

if spatial["global_rules"]["projected_crossing_is_not_intersection"] is not True:errors.append("FALSE_INTERSECTION_LOCK")
if spatial["global_rules"]["decorative_depth_guides_forbidden"] is not True:errors.append("DECORATIVE_GUIDES_LOCK")
if spatial["global_rules"]["semantic_3d_is_source_of_truth"] is not True:errors.append("SEMANTIC_SOURCE_LOCK")

if manifest.get("version") not in {"1.7.0","1.8.0"}:
    errors.append("MANIFEST_VERSION_UNEXPECTED")

if errors:
    print("CRITICAL_LOCK_QA=FAIL")
    for e in errors:print(" -",e)
    sys.exit(1)

print("CRITICAL_LOCK_QA=PASS")
print("LAYOUT_V1_3_LOCK=PASS")
print("TRIANGULAR_PRISM_LOCK=PASS")
print("TRAPEZOID_LOCK=PASS")
print("VISIBILITY_LOCK=PASS")
print("ALTITUDE_LOCK=PASS")
print("SPATIAL_RELATION_LOCK=PASS")
