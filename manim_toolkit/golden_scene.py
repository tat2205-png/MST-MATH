from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from manim import DOWN, Scene, VGroup, config

from manim_toolkit.background_ui import create_scientific_background
from manim_toolkit.geometry_tools import make_dimension_line, make_triangle
from manim_toolkit.ui_containers import create_formula_box, create_geometry_panel, create_result_box, create_title_box


@dataclass(frozen=True)
class ToolkitGoldenComposition:
    root: VGroup
    regions: Mapping[str, object]


def mobject_within_frame(mobject, frame_width: float, frame_height: float, margin: float = 0.0) -> bool:
    if frame_width <= 0 or frame_height <= 0 or margin < 0:
        raise ValueError("Frame dimensions must be positive and margin cannot be negative.")
    return (
        mobject.get_left()[0] >= -frame_width / 2 + margin
        and mobject.get_right()[0] <= frame_width / 2 - margin
        and mobject.get_bottom()[1] >= -frame_height / 2 + margin
        and mobject.get_top()[1] <= frame_height / 2 - margin
    )


def regions_overlap(left, right, tolerance: float = 0.0) -> bool:
    if tolerance < 0:
        raise ValueError("Overlap tolerance cannot be negative.")
    return not (
        left.get_right()[0] <= right.get_left()[0] + tolerance
        or right.get_right()[0] <= left.get_left()[0] + tolerance
        or left.get_top()[1] <= right.get_bottom()[1] + tolerance
        or right.get_top()[1] <= left.get_bottom()[1] + tolerance
    )


def build_toolkit_golden_scene() -> ToolkitGoldenComposition:
    background = create_scientific_background(config.frame_width, config.frame_height)
    title = create_title_box("Deterministic 3-4-5 Triangle", width=5.4, height=0.65)
    title.to_edge([0, 1, 0], buff=0.25)

    triangle = make_triangle((0, 0), (3, 0), (0, 4))
    dimension = make_dimension_line((0, 0), (3, 0), "3 units")
    geometry_art = VGroup(triangle, dimension)
    geometry_art.scale_to_fit_height(3.2)
    geometry = create_geometry_panel("Verified Geometry", geometry_art, width=5.8, height=4.6)
    geometry.move_to([-3.55, -0.45, 0])

    formula = create_formula_box(
        r"\frac{3^2 + 4^2}{5^2} = \frac{9 + 16}{25} = 1",
        width=5.2,
        height=1.35,
    )
    result = create_result_box("Result: right triangle", width=5.2, height=0.9)
    right_column = VGroup(formula, result).arrange(DOWN, buff=0.55)
    right_column.move_to([3.55, -0.35, 0])

    root = VGroup(background, title, geometry, formula, result)
    return ToolkitGoldenComposition(
        root=root,
        regions={"title": title, "geometry": geometry, "formula": formula, "result": result},
    )


class ToolkitGoldenScene(Scene):
    def construct(self):
        self.add(build_toolkit_golden_scene().root)
        self.wait(0.1)


__all__ = [
    "ToolkitGoldenComposition",
    "ToolkitGoldenScene",
    "build_toolkit_golden_scene",
    "mobject_within_frame",
    "regions_overlap",
]
