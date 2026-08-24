from __future__ import annotations

from manim import BLUE, GREY, WHITE, Line, Rectangle, VGroup


def create_clean_background(width: float = 14, height: float = 8, color: str = "#0B1120"):
    bg = Rectangle(width=width, height=height, stroke_width=0, fill_color=color, fill_opacity=1.0)
    return bg


def create_grid_background(width: float = 14, height: float = 8, step: float = 0.5):
    cells = []
    for x in range(int(-(width / 2) / step), int((width / 2) / step) + 1):
        cells.append(Line([x * step, -height / 2, 0], [x * step, height / 2, 0], stroke_color=GREY, stroke_width=0.5))
    for y in range(int(-(height / 2) / step), int((height / 2) / step) + 1):
        cells.append(Line([-width / 2, y * step, 0], [width / 2, y * step, 0], stroke_color=GREY, stroke_width=0.5))
    return VGroup(*cells)


def create_teacher_background(width: float = 14, height: float = 8):
    bg = create_clean_background(width, height, "#0F172A")
    grid = create_grid_background(width, height, step=0.5)
    return VGroup(bg, grid)


def create_scientific_background(width: float = 14, height: float = 8):
    bg = create_clean_background(width, height, "#020817")
    panel = Rectangle(width=width * 0.9, height=height * 0.9, stroke_width=0, fill_color=WHITE, fill_opacity=0.08)
    return VGroup(bg, panel)


def create_oxy_background(width: float = 14, height: float = 8):
    bg = create_clean_background(width, height, "#111827")
    accent = Rectangle(width=width * 0.9, height=height * 0.9, stroke_color=BLUE, stroke_width=1.0, fill_opacity=0)
    return VGroup(bg, accent)


def create_oxyz_background(width: float = 14, height: float = 8):
    bg = create_clean_background(width, height, "#0B1220")
    overlay = create_grid_background(width, height, step=0.75)
    return VGroup(bg, overlay)
