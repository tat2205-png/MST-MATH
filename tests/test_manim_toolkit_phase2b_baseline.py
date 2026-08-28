import unittest

from manim import RIGHT, Rectangle, config

from manim_toolkit.background_ui import create_clean_background, create_grid_background
from manim_toolkit.geometry_tools import line_intersection, make_point, make_segment, projection_point_to_line
from manim_toolkit.latex_utils import fit_math_to_width, normalize_latex, safe_mathtex
from manim_toolkit.ui_containers import check_overlap, clamp_to_frame, create_card, safe_arrange


class ManimToolkitPhase2BBaselineTests(unittest.TestCase):
    def test_latex_current_behavior(self):
        self.assertEqual(normalize_latex("  x^2 + 1  "), "x^2 + 1")
        expression = safe_mathtex("x^2 + 1")
        fitted = fit_math_to_width("x^2 + x + 1", 2.5)
        self.assertIsNotNone(expression)
        self.assertLessEqual(fitted.width, 2.5 + 1e-6)

    def test_background_construction_does_not_mutate_global_config(self):
        before = (config.frame_width, config.frame_height, config.pixel_width, config.pixel_height, config.frame_rate)
        self.assertIsNotNone(create_clean_background())
        self.assertIsNotNone(create_grid_background())
        after = (config.frame_width, config.frame_height, config.pixel_width, config.pixel_height, config.frame_rate)
        self.assertEqual(after, before)

    def test_container_current_layout_behavior(self):
        card = create_card("Baseline", width=3.2, height=1.0)
        clamped = clamp_to_frame(card, 4.0, 2.0)
        arranged = safe_arrange([card, clamped], direction="HORIZONTAL", gap=0.25)
        self.assertLessEqual(clamped.width, 3.6 + 1e-6)
        self.assertEqual(len(arranged), 2)
        self.assertTrue(check_overlap(Rectangle(), Rectangle().shift(0.5 * RIGHT)))

    def test_geometry_current_helper_behavior(self):
        start = make_point(0, 0)
        end = make_point(2, 0)
        self.assertIsNotNone(make_segment(start, end))
        projection = projection_point_to_line(make_point(1, 1), start, end)
        self.assertAlmostEqual(float(projection.get_center()[0]), 1.0)
        intersection = line_intersection((0, 0), (2, 2), (0, 2), (2, 0))
        self.assertIsNotNone(intersection)
        self.assertAlmostEqual(float(intersection[0]), 1.0)
        self.assertAlmostEqual(float(intersection[1]), 1.0)


if __name__ == "__main__":
    unittest.main()
