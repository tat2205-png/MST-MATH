import unittest

from manim import Circle, RIGHT, Rectangle

from manim_toolkit import GoldenRightTriangleScene, build_golden_right_triangle_scene
from manim_toolkit.background_ui import create_clean_background, create_grid_background
from manim_toolkit.geometry_tools import make_point, make_segment, projection_point_to_line
from manim_toolkit.latex_utils import fit_math_to_box, safe_mathtex, safe_tex, safe_text
from manim_toolkit.ui_containers import check_overlap, clamp_to_frame, create_card, create_formula_box, safe_arrange


class ManimToolkitTests(unittest.TestCase):
    def test_ui_containers_frame_and_overlap(self):
        card = create_card("Test", width=3.2, height=1.0)
        self.assertIsNotNone(card)
        self.assertGreater(card.get_width(), 0)

        clamped = clamp_to_frame(card, 4.0, 2.0)
        self.assertIsNotNone(clamped)

        a = Rectangle(width=1.0, height=1.0)
        b = Rectangle(width=1.0, height=1.0).shift(0.5 * RIGHT)
        self.assertTrue(check_overlap(a, b))

    def test_latex_helpers_and_fit(self):
        text = safe_text("  x^2 + 1  ")
        self.assertIsNotNone(text)
        self.assertIn("x^2 + 1", str(text))

        expr = safe_mathtex("x^2 + 1")
        self.assertIsNotNone(expr)

        equation = safe_tex("\\frac{a}{b}")
        self.assertIsNotNone(equation)

        boxed = fit_math_to_box("x^2 + x + 1", max_width=2.5)
        self.assertIsNotNone(boxed)

        with self.assertRaises(ValueError):
            safe_mathtex("")

    def test_geometry_tools(self):
        p = make_point(0, 0)
        q = make_point(2, 0)
        segment = make_segment(p, q)
        self.assertIsNotNone(segment)

        projected = projection_point_to_line(make_point(1, 1), p, q)
        self.assertIsNotNone(projected)

    def test_background_ui(self):
        clean = create_clean_background()
        grid = create_grid_background()
        self.assertIsNotNone(clean)
        self.assertIsNotNone(grid)

    def test_safe_arrange(self):
        left = create_formula_box("x+y=1")
        right = create_formula_box("x-y=2")
        arranged = safe_arrange([left, right], direction="HORIZONTAL", gap=0.5)
        self.assertIsNotNone(arranged)

    def test_golden_right_triangle_scene_integration(self):
        scene = build_golden_right_triangle_scene()
        self.assertIsNotNone(scene)
        self.assertTrue(hasattr(GoldenRightTriangleScene, "construct"))
        self.assertGreater(len(scene), 0)


if __name__ == "__main__":
    unittest.main()
