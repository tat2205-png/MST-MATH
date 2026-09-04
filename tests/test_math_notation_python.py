from __future__ import annotations

import pytest

from manim_toolkit.math_notation import (
    DEFAULT_NOTATION_PROFILE,
    MathNotationError,
    canonicalize_math_expression,
    prepare_math_notation,
    semantic_signature,
)


def test_vn_gdpt2018_notation_canonicalization() -> None:
    source = r"A ⊂ B,\quad x≤2,\quad d\perp a"
    prepared = prepare_math_notation(
        source,
        profile_id=DEFAULT_NOTATION_PROFILE,
        output="VIDEO",
    )
    assert prepared["canonicalLatex"] == r"A \subset B,\quad x\leq2,\quad d\perp a"
    assert prepared["semanticSignature"] == [
        "set.subset:SUBSET_INCLUSIVE",
        "relation.less_equal:LESS_THAN_OR_EQUAL",
        "geometry.perpendicular:PERPENDICULAR",
    ]


def test_latex_control_word_prefix_is_not_misclassified() -> None:
    assert semantic_signature(r"x\to+\infty") == ["constant.infinity:INFINITY"]


def test_unicode_to_control_word_inserts_safe_boundary() -> None:
    prepared = prepare_math_notation("A⊂B, A∈B", output="VIDEO")
    assert prepared["canonicalLatex"] == r"A\subset B, A\in B"


def test_canonicalization_is_semantically_idempotent() -> None:
    source = r"x≥0,\quad A∈B"
    canonical = canonicalize_math_expression(source)
    assert semantic_signature(source) == semantic_signature(canonical)
    assert canonical == r"x\geq0,\quad A\in B"


def test_profile_dependent_notation_fails_closed() -> None:
    with pytest.raises(MathNotationError, match="MATH_NOTATION_AMBIGUITY"):
        prepare_math_notation("A ⊂ B", profile_id="UNKNOWN_PROFILE", output="VIDEO")
