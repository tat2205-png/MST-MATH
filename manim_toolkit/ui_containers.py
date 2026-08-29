from __future__ import annotations

from typing import Iterable, List, Sequence

from manim import DOWN, LEFT, RIGHT, UP, Mobject, Rectangle, RoundedRectangle, Text, VGroup, WHITE


def fit_inside(mobj: Mobject, max_width: float | None = None, max_height: float | None = None, padding: float = 0.15):
    """Scale an mobject to fit within a target box without mutating scene state."""
    if mobj is None:
        raise ValueError("Mobject cannot be None.")
    clone = mobj.copy()
    if padding < 0:
        raise ValueError("padding cannot be negative.")
    target_width = None if max_width is None else max_width - padding * 2
    target_height = None if max_height is None else max_height - padding * 2
    if target_width is not None and target_width <= 0:
        raise ValueError("max_width must exceed twice the padding.")
    if target_height is not None and target_height <= 0:
        raise ValueError("max_height must exceed twice the padding.")
    if target_width is not None and clone.width > target_width:
        clone.scale(target_width / clone.width)
    if target_height is not None and clone.height > target_height:
        clone.scale(target_height / clone.height)
    return clone


def clamp_to_frame(mobj: Mobject, frame_width: float, frame_height: float, padding: float = 0.2):
    """Return a copy of an mobject clamped to a rectangular frame."""
    clone = mobj.copy()
    if frame_width <= 0 or frame_height <= 0 or padding < 0:
        raise ValueError("Frame dimensions must be positive and padding cannot be negative.")
    w = clone.width
    target_w = max(0.1, frame_width - padding * 2)
    target_h = max(0.1, frame_height - padding * 2)
    if w > target_w:
        clone.scale(target_w / w)
    if clone.height > target_h:
        clone.scale(target_h / clone.height)
    left_limit, right_limit = -frame_width / 2 + padding, frame_width / 2 - padding
    bottom_limit, top_limit = -frame_height / 2 + padding, frame_height / 2 - padding
    shift_x = max(left_limit - clone.get_left()[0], min(0.0, right_limit - clone.get_right()[0]))
    shift_y = max(bottom_limit - clone.get_bottom()[1], min(0.0, top_limit - clone.get_top()[1]))
    clone.shift([shift_x, shift_y, 0])
    return clone


def safe_next_to(mobj: Mobject, anchor: Mobject, direction: str = RIGHT, buff: float = 0.2):
    """Place an mobject next to another mobject in a frame-safe way."""
    clone = mobj.copy()
    if isinstance(direction, str):
        value = direction.upper()
        if value == "LEFT":
            direction = LEFT
        elif value == "RIGHT":
            direction = RIGHT
        elif value == "UP":
            direction = UP
        elif value == "DOWN":
            direction = DOWN
        else:
            direction = RIGHT
    clone.next_to(anchor, direction, buff=buff)
    return clone


def safe_arrange(items: Sequence[Mobject], direction: str = RIGHT, gap: float = 0.2, align: str = "CENTER"):
    """Arrange a sequence of mobjects deterministically without mutating the scene."""
    if not items:
        return VGroup()
    group = VGroup(*[item.copy() for item in items])
    normalized = str(direction).upper() if isinstance(direction, str) else "RIGHT"
    if normalized in {"HORIZONTAL", "RIGHT", "LEFT"}:
        group.arrange(direction=RIGHT, buff=gap)
    elif normalized in {"VERTICAL", "UP", "DOWN"}:
        group.arrange(direction=DOWN, buff=gap)
    else:
        group.arrange(buff=gap)
    return group


def check_overlap(a: Mobject, b: Mobject) -> bool:
    """Return True when two mobjects overlap using AABB bounds."""
    if a is None or b is None:
        return False
    a_left, a_right = a.get_left()[0], a.get_right()[0]
    b_left, b_right = b.get_left()[0], b.get_right()[0]
    a_bottom, a_top = a.get_bottom()[1], a.get_top()[1]
    b_bottom, b_top = b.get_bottom()[1], b.get_top()[1]
    overlap_x = not (a_right < b_left or b_right < a_left)
    overlap_y = not (a_top < b_bottom or b_top < a_bottom)
    return overlap_x and overlap_y


def create_card(label: str, width: float = 2.8, height: float = 1.0, stroke: str = "#D9E7FF") -> RoundedRectangle:
    card = RoundedRectangle(width=width, height=height, corner_radius=0.18, stroke_color=stroke, stroke_width=1.2, fill_color="#111827", fill_opacity=0.18)
    text = Text(label, font_size=max(18, int(height * 18)), color=WHITE)
    card.add(text)
    text.move_to(card.get_center())
    return card


def create_pill(label: str, width: float = 2.2, height: float = 0.6):
    pill = RoundedRectangle(width=width, height=height, corner_radius=0.3, fill_color="#1F2937", fill_opacity=0.8)
    text = Text(label, font_size=18, color=WHITE)
    text.move_to(pill.get_center())
    pill.add(text)
    return pill


def create_title_box(title: str, width: float = 4.0, height: float = 0.8):
    box = Rectangle(width=width, height=height, stroke_width=1.0, fill_color="#0F172A", fill_opacity=0.2)
    text = Text(title, font_size=26, color=WHITE)
    text.move_to(box.get_center())
    box.add(text)
    return box


def create_formula_box(formula: str, width: float = 2.8, height: float = 1.1):
    from .latex_utils import safe_mathtex

    box = RoundedRectangle(width=width, height=height, corner_radius=0.12, stroke_width=1.2, fill_color="#111827", fill_opacity=0.15)
    expr = safe_mathtex(formula)
    expr.scale_to_fit_width(width * 0.82)
    expr.move_to(box.get_center())
    box.add(expr)
    return box


def create_solution_box(solution: str, width: float = 3.6, height: float = 1.2):
    box = RoundedRectangle(width=width, height=height, corner_radius=0.16, stroke_width=1.2, fill_color="#0B1220", fill_opacity=0.22)
    text = Text(solution, font_size=18, color=WHITE)
    text.move_to(box.get_center())
    box.add(text)
    return box


def create_result_box(label: str, width: float = 3.0, height: float = 0.9):
    box = RoundedRectangle(width=width, height=height, corner_radius=0.15, stroke_width=1.0, fill_color="#0F766E", fill_opacity=0.25)
    text = Text(label, font_size=20, color=WHITE)
    text.move_to(box.get_center())
    box.add(text)
    return box


def create_geometry_panel(title: str, geometry_mobject: Mobject | None = None, width: float = 4.2, height: float = 2.4):
    panel = RoundedRectangle(width=width, height=height, corner_radius=0.2, stroke_width=1.0, fill_color="#111827", fill_opacity=0.3)
    header = create_title_box(title, width=width * 0.75, height=0.45)
    header.next_to(panel, UP, buff=0.18)
    panel.add(header)
    if geometry_mobject is not None:
        art = geometry_mobject.copy()
        art.scale_to_fit_width(width * 0.8)
        art.move_to(panel.get_center())
        panel.add(art)
    return panel
