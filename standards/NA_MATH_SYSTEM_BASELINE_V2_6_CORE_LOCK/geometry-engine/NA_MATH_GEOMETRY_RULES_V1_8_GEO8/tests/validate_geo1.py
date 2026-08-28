from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"

REQUIRED_LAYOUT = "NA-MATH-LAYOUT-V1.3-CANONICAL"

def validate(scene):
    issues = []

    lc = scene.get("layoutContract", {})
    if lc.get("layoutId") != REQUIRED_LAYOUT:
        issues.append("LAYOUT_BASELINE_CHANGED")
    if lc.get("layoutStatus") != "LOCKED":
        issues.append("LAYOUT_NOT_LOCKED")
    if lc.get("geometryMayChangeLayout") is not False:
        issues.append("GEOMETRY_MAY_CHANGE_LAYOUT")

    objects = scene.get("objects", [])
    ids = [o.get("id") for o in objects]
    if len(ids) != len(set(ids)):
        issues.append("DUPLICATE_OBJECT_ID")
    object_ids = set(ids)

    rels = scene.get("relations", [])
    rids = [r.get("id") for r in rels]
    if len(rids) != len(set(rids)):
        issues.append("DUPLICATE_RELATION_ID")
    rel_by_id = {r["id"]: r for r in rels}

    for r in rels:
        for ref in r.get("objects", []):
            if ref not in object_ids:
                issues.append(f"UNDEFINED_OBJECT:{r['id']}:{ref}")
        if r.get("provenance") == "DERIVED" and not r.get("evidence"):
            issues.append(f"DERIVED_WITHOUT_EVIDENCE:{r['id']}")

    profiles = {v["id"]: v for v in scene.get("availableViewProfiles", [])}
    active = scene.get("activeViewProfileId")
    if active not in profiles:
        issues.append("ACTIVE_VIEW_PROFILE_MISSING")
    else:
        for e in profiles[active].get("edgeStyles", []):
            if e.get("edgeId") not in object_ids:
                issues.append(f"VIEW_EDGE_MISSING:{e.get('edgeId')}")
            if e.get("source") != "VIEW_PROFILE":
                issues.append(f"EDGE_STYLE_SOURCE:{e.get('edgeId')}")

    for claim in scene.get("claims", []):
        rel = rel_by_id.get(claim.get("relationId"))
        if rel is None:
            issues.append(f"CLAIM_RELATION_MISSING:{claim.get('relationId')}")
        elif claim.get("requiredForRender") and rel.get("status") != "VERIFIED":
            issues.append(f"RENDER_CLAIM_UNVERIFIED:{rel['id']}")

    rp = scene.get("renderPolicy", {})
    if rp.get("noVisualInference") is not True:
        issues.append("NO_VISUAL_INFERENCE_DISABLED")
    if rp.get("failClosed") is not True:
        issues.append("FAIL_CLOSED_DISABLED")
    if rp.get("allowUnverifiedDecorativeGeometry") is not False:
        issues.append("UNVERIFIED_DECORATIVE_GEOMETRY_ALLOWED")

    return issues

files = sorted(EXAMPLES.glob("golden-*.json"))
failed = 0
print(f"GEO-1 corpus: {len(files)} scenes")
for f in files:
    scene = json.loads(f.read_text(encoding="utf-8"))
    issues = validate(scene)
    if issues:
        failed += 1
        print(f"FAIL {f.name}: {issues}")
    else:
        print(f"PASS {f.name}")

if failed:
    print(f"GEO_1_STATUS=FAIL ({failed}/{len(files)} failed)")
    sys.exit(1)

print(f"GEO_1_STATUS=PASS ({len(files)}/{len(files)} passed)")
