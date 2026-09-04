from __future__ import annotations

import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "manim_toolkit" / "math_notation.py"
spec = importlib.util.spec_from_file_location("mst_math_notation_standalone", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load MST-MATH Python notation adapter")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

prepared = module.prepare_math_notation("A⊂B, x≤2, d⊥a", output="VIDEO")
assert prepared["canonicalLatex"] == r"A\subset B, x\leq2, d\perp a"
assert prepared["semanticSignature"] == [
    "set.subset:SUBSET_INCLUSIVE",
    "relation.less_equal:LESS_THAN_OR_EQUAL",
    "geometry.perpendicular:PERPENDICULAR",
]

assert module.semantic_signature(r"x\to+\infty") == ["constant.infinity:INFINITY"]

try:
    module.prepare_math_notation("A⊂B", profile_id="UNKNOWN_PROFILE", output="VIDEO")
except module.MathNotationError as exc:
    assert "MATH_NOTATION_AMBIGUITY" in str(exc)
else:
    raise AssertionError("Unknown notation profile must fail closed")

try:
    module.prepare_math_notation(r"a\equiv b", output="TTS")
except module.MathNotationError as exc:
    assert "MATH_NOTATION_RENDER_FAILURE" in str(exc) or "MATH_NOTATION_NARRATION_MISMATCH" in str(exc)
else:
    raise AssertionError("Context-dependent equivalence must not be narrated generically")

print("MST-MATH Python notation registry parity PASS (dependency-free adapter gate).")
