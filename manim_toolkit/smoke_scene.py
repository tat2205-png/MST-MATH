from __future__ import annotations

from manim import Create, FadeOut, Scene, VGroup

from manim_toolkit.background_ui import create_scientific_background
from manim_toolkit.geometry_tools import make_axes_2d, make_point, make_segment
from manim_toolkit.latex_utils import safe_mathtex
from manim_toolkit.ui_containers import create_card, create_formula_box


class ManimToolkitSmokeScene(Scene):
    def construct(self):
        background = create_scientific_background()
        axes = make_axes_2d(x_range=(-2, 2), y_range=(-2, 2))
        point_a = make_point(-1, 0)
        point_b = make_point(1, 1)
        segment = make_segment(point_a, point_b)
        formula = create_formula_box("x^2 + y^2 = 1")
        card = create_card("Toolkit Ready")
        math = safe_mathtex(r"\int_0^1 x^2 \, dx = \frac{1}{3}")
        group = VGroup(background, axes, segment, formula, card, math)
        self.add(background)
        self.play(Create(axes), run_time=0.6)
        self.play(Create(segment), run_time=0.6)
        self.play(Create(formula), run_time=0.6)
        self.play(Create(card), run_time=0.6)
        self.play(Create(math), run_time=0.8)
        self.wait(0.4)
        self.play(FadeOut(group), run_time=0.6)
