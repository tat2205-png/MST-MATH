from __future__ import annotations

import re

from manim import MathTex, Tex, Text

from manim_toolkit.math_notation import DEFAULT_NOTATION_PROFILE, canonicalize_math_expression


def normalize_latex(raw: str) -> str:
    if raw is None:
        raise ValueError("Latex input cannot be None.")
    text = str(raw).strip()
    if not text:
        raise ValueError("Latex input cannot be empty.")
    text = text.replace("\\r\\n", "\\n").replace("\r", "\n")
    return text


def validate_latex_string(raw: str) -> str:
    text = normalize_latex(raw)
    depth = 0
    for character in text:
        if character == "{":
            depth += 1
        elif character == "}":
            depth -= 1
            if depth < 0:
                raise ValueError("Unbalanced braces in latex input.")
    if depth != 0:
        raise ValueError("Unbalanced braces in latex input.")
    return text


def safe_text(value: str, *, font_size: int = 24, color=None):
    text = normalize_latex(value) if isinstance(value, str) else str(value)
    return Text(text, font_size=font_size, color=color)


def safe_tex(
    value: str,
    *,
    font_size: int = 24,
    color=None,
    notation_profile_id: str = DEFAULT_NOTATION_PROFILE,
):
    latex = validate_latex_string(value)
    math_like = bool(re.search(r"\\(?:frac|sqrt|sum|int|prod|lim)\b|[_^=]", latex))
    if math_like:
        latex = canonicalize_math_expression(
            latex,
            profile_id=notation_profile_id,
            output="VIDEO",
        )
    expression = f"${latex}$" if math_like else latex
    return Tex(expression, font_size=font_size, color=color)


def safe_mathtex(
    value: str,
    *,
    font_size: int = 28,
    color=None,
    notation_profile_id: str = DEFAULT_NOTATION_PROFILE,
):
    latex = validate_latex_string(value)
    latex = canonicalize_math_expression(
        latex,
        profile_id=notation_profile_id,
        output="VIDEO",
    )
    return MathTex(latex, font_size=font_size, color=color)


def fit_math_to_width(
    value: str,
    max_width: float,
    *,
    font_size: int = 28,
    color=None,
    notation_profile_id: str = DEFAULT_NOTATION_PROFILE,
):
    math = safe_mathtex(
        value,
        font_size=font_size,
        color=color,
        notation_profile_id=notation_profile_id,
    )
    if max_width <= 0:
        raise ValueError("max_width must be positive.")
    scale = max_width / max(math.get_width(), 1e-6)
    if scale < 1.0:
        math.scale(scale)
    return math


def fit_math_to_box(
    value: str,
    max_width: float,
    max_height: float | None = None,
    *,
    font_size: int = 28,
    color=None,
    notation_profile_id: str = DEFAULT_NOTATION_PROFILE,
):
    math = fit_math_to_width(
        value,
        max_width,
        font_size=font_size,
        color=color,
        notation_profile_id=notation_profile_id,
    )
    if max_height is not None and math.get_height() > max_height:
        math.scale(max_height / max(math.get_height(), 1e-6))
    return math


def split_long_equation(value: str, max_segments: int = 2):
    text = validate_latex_string(value)
    if not isinstance(max_segments, int) or max_segments < 1:
        raise ValueError("max_segments must be a positive integer.")
    pieces = re.split(r"(=|\\\\|\\+|\\-|\\/|\\{|\\}|\\(|\\))", text)
    final = [piece for piece in pieces if piece]
    if len(final) <= max_segments:
        return [text]
    groups = []
    current = ""
    for part in final:
        if current and len(current) + len(part) > 24 and len(groups) < max_segments - 1:
            groups.append(current)
            current = part
        else:
            current += part
    if current:
        groups.append(current)
    return groups if groups else [text]
