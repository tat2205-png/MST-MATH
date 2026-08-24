from __future__ import annotations

from manim import DOWN, LEFT, RIGHT, Scene, UP, UR, VGroup

from .background_ui import create_scientific_background
from .geometry_tools import make_axes_2d, make_point, make_segment, make_triangle
from .latex_utils import safe_mathtex, safe_text
from .ui_containers import create_formula_box, create_title_box


def build_golden_right_triangle_scene():
    """Build a deterministic 3-4-5 right triangle scene using the toolkit modules.

    This is intentionally additive and isolated from the production geometry and
    LuaDraw pipeline. It is a golden example scene that proves the toolkit can be
    composed safely with the existing Manim stack.
    """
    background = create_scientific_background()
    axes = make_axes_2d(x_range=(0, 5), y_range=(0, 5), x_length=7, y_length=5, axis_config={"include_tip": False})

    a = make_point(0, 0)
    b = make_point(3, 0)
    c = make_point(0, 4)
    triangle = make_triangle(a, b, c)
    ab = make_segment(a, b)
    bc = make_segment(b, c)
    ca = make_segment(c, a)

    title = create_title_box("3-4-5 Triangle", width=3.8, height=0.7)
    title.to_edge(UP, buff=0.35)

    formula = create_formula_box(r"3^2 + 4^2 = 5^2", width=3.8, height=1.0)
    formula.to_corner(UR, buff=0.35)

    label_a = safe_text("A", font_size=26)
    label_b = safe_text("B", font_size=26)
    label_c = safe_text("C", font_size=26)
    label_a.next_to(a, LEFT, buff=0.18)
    label_b.next_to(b, DOWN, buff=0.12)
    label_c.next_to(c, UP, buff=0.12)

    side_ab = safe_mathtex(r"AB = 3", font_size=22)
    side_ab.next_to(ab, DOWN, buff=0.24)
    side_bc = safe_mathtex(r"BC = 4", font_size=22)
    side_bc.next_to(bc, RIGHT, buff=0.24)
    side_ca = safe_mathtex(r"AC = 5", font_size=22)
    side_ca.next_to(ca, LEFT, buff=0.22)

    scene = VGroup(
        background,
        axes,
        triangle,
        ab,
        bc,
        ca,
        title,
        formula,
        label_a,
        label_b,
        label_c,
        side_ab,
        side_bc,
        side_ca,
    )
    scene.move_to([0, 0, 0])
    return scene


class GoldenRightTriangleScene(Scene):
    def construct(self):
        scene = build_golden_right_triangle_scene()
        self.add(scene)


__all__ = ["GoldenRightTriangleScene", "build_golden_right_triangle_scene"]
