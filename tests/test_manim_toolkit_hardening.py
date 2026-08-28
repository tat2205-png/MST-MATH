import unittest

from manim import Rectangle, Tex

from manim_toolkit.background_ui import create_grid_background
from manim_toolkit.geometry_tools import (
    line_intersection,
    make_dimension_line,
    make_segment,
    projection_point_to_line,
)
from manim_toolkit.latex_utils import safe_tex, split_long_equation, validate_latex_string
from manim_toolkit.ui_containers import clamp_to_frame, fit_inside


class ManimToolkitProvenGapTests(unittest.TestCase):
    def test_split_long_equation_respects_segment_limit_and_preserves_meaning(self):
        formula = "x^{10}+x^9+x^8+x^7+x^6+x^5+x^4+x^3+x^2+x+1=0"
        segments = split_long_equation(formula, max_segments=2)
        self.assertLessEqual(len(segments), 2)
        self.assertEqual("".join(segments), formula)
        with self.assertRaises(ValueError):
            split_long_equation(formula, max_segments=0)

    def test_tex_and_malformed_brace_order_are_validated(self):
        self.assertIsInstance(safe_tex(r"\frac{a}{b}"), Tex)
        with self.assertRaises(ValueError):
            validate_latex_string("}{")

    def test_fit_inside_padding_never_exceeds_requested_box(self):
        fitted = fit_inside(Rectangle(width=4, height=2), max_width=4, max_height=2, padding=0.2)
        self.assertLessEqual(fitted.width, 3.6 + 1e-6)
        self.assertLessEqual(fitted.height, 1.6 + 1e-6)

    def test_clamp_to_frame_repositions_shifted_object_inside_frame(self):
        shifted = Rectangle(width=2, height=1).move_to([20, 10, 0])
        clamped = clamp_to_frame(shifted, frame_width=14, frame_height=8, padding=0.25)
        self.assertGreaterEqual(clamped.get_left()[0], -6.75)
        self.assertLessEqual(clamped.get_right()[0], 6.75)
        self.assertGreaterEqual(clamped.get_bottom()[1], -3.75)
        self.assertLessEqual(clamped.get_top()[1], 3.75)

    def test_grid_rejects_non_positive_step_explicitly(self):
        for step in (0, -0.5):
            with self.subTest(step=step), self.assertRaises(ValueError):
                create_grid_background(step=step)

    def test_degenerate_geometry_fails_explicitly(self):
        with self.assertRaises(ValueError):
            make_segment((1, 1), (1, 1))
        with self.assertRaises(ValueError):
            projection_point_to_line((1, 1), (0, 0), (0, 0))
        with self.assertRaises(ValueError):
            line_intersection((0, 0), (1, 0), (0, 1), (1, 1))

    def test_dimension_line_keeps_requested_annotation(self):
        dimension = make_dimension_line((0, 0), (3, 0), label="3 units")
        self.assertEqual(len(dimension), 2)
        self.assertIn("3 units", str(dimension[1]))


if __name__ == "__main__":
    unittest.main()
