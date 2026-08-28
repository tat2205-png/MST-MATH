from pathlib import Path
import json, hashlib, re, sys, subprocess

ROOT = Path(__file__).resolve().parents[1]
V13 = ROOT/"design-system/na_math_design_system_v1_3"
GEO = ROOT/"geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8"

def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

errors=[]

# A. Verify every original V1.3 file is byte-identical to frozen hashes.
frozen=json.loads((ROOT/"integration/v13-frozen-file-hashes.json").read_text(encoding="utf-8"))
for rel, expected in frozen["hashes"].items():
    p=V13/rel
    if not p.exists():
        errors.append("V13_FILE_MISSING:"+rel)
    elif sha256(p)!=expected:
        errors.append("V13_FILE_CHANGED:"+rel)

current_files={str(p.relative_to(V13)) for p in V13.rglob("*") if p.is_file()}
if current_files != set(frozen["hashes"]):
    errors.append("V13_FILE_SET_CHANGED")

# B. Verify the slot ratios reproduce V1.3 layout-specs.ts exactly.
layout_text=(V13/"src/modules/design-system/layouts/layout-specs.ts").read_text(encoding="utf-8")
slots=json.loads((ROOT/"integration/figure-slot-contracts.json").read_text(encoding="utf-8"))
expected={
    "document":{"mainVisualRatio":0.30,"safeMargin":18},
    "worksheet":{"mainVisualRatio":0.28,"safeMargin":18},
    "assessment":{"mainVisualRatio":0.24,"safeMargin":16},
    "video":{"mainVisualRatio":0.42,"safeMargin":72,"problemBarRatio":0.20},
}
for slot in slots["slots"]:
    exp=expected[slot["layout_kind"]]
    for k,v in exp.items():
        if abs(slot[k]-v)>1e-12:
            errors.append(f"SLOT_CONTRACT_CHANGED:{slot['layout_kind']}:{k}")

required_literals=[
    "mainVisualRatio: 0.30",
    "mainVisualRatio: 0.28",
    "mainVisualRatio: 0.24",
    "mainVisualRatio: 0.42",
    "problemBarRatio: 0.20",
]
for lit in required_literals:
    if lit not in layout_text:
        errors.append("LAYOUT_SPEC_BASELINE_LITERAL_MISSING:"+lit)

# C. Component integration must use geometry-figure-card, which already exists in V1.3.
component_text=(V13/"src/modules/design-system/components/component-registry.ts").read_text(encoding="utf-8")
if "'geometry-figure-card'" not in component_text:
    errors.append("GEOMETRY_FIGURE_CARD_MISSING")
for slot in slots["slots"]:
    if slot["component"]!="geometry-figure-card":
        errors.append("WRONG_GEOMETRY_COMPONENT:"+slot["layout_kind"])

# D. Geometry adapter hard rules.
contract=slots["geometry_slot_policy"]
if contract["slot_bounds_are_read_only"] is not True:
    errors.append("SLOT_NOT_READONLY")
if contract["geometry_must_clip_to_slot"] is not True:
    errors.append("GEOMETRY_NOT_CLIPPED")
if contract["geometry_may_request_layout_resize"] is not False:
    errors.append("GEOMETRY_CAN_RESIZE_LAYOUT")
if contract["geometry_may_move_slot"] is not False:
    errors.append("GEOMETRY_CAN_MOVE_SLOT")
if contract["geometry_may_change_header_footer"] is not False:
    errors.append("GEOMETRY_CAN_CHANGE_HEADER_FOOTER")
if contract["geometry_may_change_card_structure"] is not False:
    errors.append("GEOMETRY_CAN_CHANGE_CARD_STRUCTURE")

# E. Four layout integration examples.
examples=list((ROOT/"examples").glob("geo9-*.json"))
kinds=set()
for p in examples:
    ex=json.loads(p.read_text(encoding="utf-8"))
    kinds.add(ex["layoutKind"])
    if ex.get("layoutMutation") is not None:
        errors.append("EXAMPLE_LAYOUT_MUTATION:"+ex["id"])
    b=ex["outerSlot"]
    if not (b["width"]>0 and b["height"]>0):
        errors.append("INVALID_EXAMPLE_SLOT:"+ex["id"])
if kinds!={"document","worksheet","assessment","video"}:
    errors.append("FOUR_LAYOUT_COVERAGE_MISSING")

# F. Run geometry V1.8 regression — must remain green.
proc=subprocess.run(
    [sys.executable,str(GEO/"tests/run_geometry_regression.py")],
    cwd=str(GEO),
    capture_output=True,
    text=True,
    timeout=20,
)
if proc.returncode!=0:
    errors.append("GEOMETRY_V1_8_REGRESSION_FAIL")
    print(proc.stdout)
    print(proc.stderr)

if errors:
    print("GEO_9_STATUS=FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("GEO_9_STATUS=PASS")
print("V1_3_BYTE_IDENTITY_QA=PASS")
print(f"V1_3_FROZEN_FILES=PASS ({len(frozen['hashes'])}/{len(frozen['hashes'])})")
print("FOUR_LAYOUT_SLOT_CONTRACTS=PASS (4/4)")
print("GEOMETRY_FIGURE_CARD_REUSE=PASS")
print("OUTER_SLOT_READ_ONLY=PASS")
print("GEOMETRY_CLIP_TO_SLOT=PASS")
print("LAYOUT_RESIZE_REQUEST=FORBIDDEN")
print("LAYOUT_MOVE_REQUEST=FORBIDDEN")
print("HEADER_FOOTER_MUTATION=FORBIDDEN")
print("CARD_STRUCTURE_MUTATION=FORBIDDEN")
print("GEO_1_TO_GEO_8_REGRESSION=PASS")
print("LAYOUT_V1_3_PRESERVED=PASS")
