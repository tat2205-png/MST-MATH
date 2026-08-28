from pathlib import Path
import json, sys, re

ROOT = Path(__file__).resolve().parents[1]
registry = json.loads((ROOT/"profiles/view-profile-registry.json").read_text(encoding="utf-8"))
cases = json.loads((ROOT/"tests/geo2-golden-cases.json").read_text(encoding="utf-8"))

profiles = {p["id"]: p for p in registry["profiles"]}
errors = []

ABSTRACT = {"all_boundary_edges", "plane_outlines", "a", "b"}

def canon(e):
    if e in ABSTRACT:
        return e
    labels = re.findall(r"[A-Za-z](?:′)?", e)
    if len(labels) == 2 and "".join(labels) == e:
        return "".join(sorted(labels))
    return e

if registry["layout_contract"]["layout_id"] != "NA-MATH-LAYOUT-V1.3-CANONICAL":
    errors.append("LAYOUT_ID_CHANGED")
if registry["layout_contract"]["status"] != "LOCKED":
    errors.append("LAYOUT_NOT_LOCKED")
if registry["layout_contract"]["geometry_may_change_layout"] is not False:
    errors.append("GEOMETRY_MAY_CHANGE_LAYOUT")
if registry["rules"]["visibility_source"] != "VIEW_PROFILE_ONLY":
    errors.append("VISIBILITY_NOT_PROFILE_ONLY")
if registry["rules"]["unknown_profile_policy"] != "BLOCK_RENDER":
    errors.append("UNKNOWN_PROFILE_NOT_BLOCKED")

print(f"GEO-2 profiles: {len(profiles)}")

for case in cases["cases"]:
    pid = case["profile"]
    p = profiles.get(pid)
    if not p:
        errors.append(f"{case['id']}:MISSING_PROFILE")
        print(f"FAIL {case['id']}: missing profile")
        continue

    edge_styles = p.get("edge_styles", {})
    solid = {canon(e) for e in edge_styles.get("solid", [])}
    dashed = {canon(e) for e in edge_styles.get("dashed", [])}

    strict_profile = pid in {
        "TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT",
        "BOX_FRONT_LEFT_ABOVE_KNTT"
    }

    if strict_profile:
        exp_solid = {canon(e) for e in case["expected_solid"]}
        exp_dashed = {canon(e) for e in case["expected_dashed"]}
        if solid != exp_solid:
            errors.append(f"{case['id']}:SOLID_MISMATCH")
        if dashed != exp_dashed:
            errors.append(f"{case['id']}:DASHED_MISMATCH")

    if pid == "PARALLEL_PLANES_SKEW_LINES_CANONICAL":
        forbidden = set(p.get("forbidden", []))
        required_forbidden = {
            "decorative_connectors_between_planes",
            "fake_prism_guides",
            "false_intersection_marker"
        }
        if not required_forbidden.issubset(forbidden):
            errors.append(f"{case['id']}:FALSE_GUIDE_POLICY_MISSING")

    if pid == "TRAPEZOID_BASE_LARGE_TOP_HORIZONTAL":
        proj = p["projection"]
        if proj["large_base_orientation"] != "horizontal":
            errors.append(f"{case['id']}:LARGE_BASE_NOT_HORIZONTAL")
        if proj["large_base_position"] != "top":
            errors.append(f"{case['id']}:LARGE_BASE_NOT_TOP")
        if proj["small_base_position"] != "below":
            errors.append(f"{case['id']}:SMALL_BASE_NOT_BELOW")

    if any(e.startswith(case["id"]+":") for e in errors):
        print(f"FAIL {case['id']}")
    else:
        print(f"PASS {case['id']}")

tri = profiles["TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT"]
if {canon(e) for e in tri["edge_styles"]["dashed"]} != {canon("AB")}:
    errors.append("TRIANGULAR_PRISM_DASHED_NOT_ONLY_AB")

if errors:
    print("GEO_2_STATUS=FAIL")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print(f"GEO_2_STATUS=PASS ({len(cases['cases'])}/{len(cases['cases'])} golden cases passed)")
print("EDGE_ID_NORMALIZATION=PASS")
print("LAYOUT_V1_3_PRESERVED=PASS")
print("UNKNOWN_VIEW_PROFILE_POLICY=BLOCK_RENDER")
print("VISIBILITY_SOURCE=VIEW_PROFILE_ONLY")
