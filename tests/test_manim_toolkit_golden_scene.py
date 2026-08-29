import itertools
import unittest

from manim import config

from manim_toolkit.golden_scene import (
    ToolkitGoldenScene,
    build_toolkit_golden_scene,
    mobject_within_frame,
    regions_overlap,
)


class ManimToolkitGoldenSceneTests(unittest.TestCase):
    def test_golden_scene_builds_all_required_regions(self):
        composition = build_toolkit_golden_scene()
        self.assertTrue(hasattr(ToolkitGoldenScene, "construct"))
        self.assertEqual(set(composition.regions), {"title", "geometry", "formula", "result"})
        self.assertGreater(len(composition.root), 4)

    def test_frame_bounds(self):
        composition = build_toolkit_golden_scene()
        violations = [
            name
            for name, mobject in composition.regions.items()
            if not mobject_within_frame(mobject, config.frame_width, config.frame_height, margin=0.1)
        ]
        self.assertEqual(violations, [])

    def test_unrelated_regions_do_not_overlap(self):
        composition = build_toolkit_golden_scene()
        violations = [
            (left_name, right_name)
            for (left_name, left), (right_name, right) in itertools.combinations(composition.regions.items(), 2)
            if regions_overlap(left, right, tolerance=0.05)
        ]
        self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
