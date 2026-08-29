from __future__ import annotations

import math
from typing import Sequence

import numpy as np
from manim import UP, Axes, Circle, DashedLine, Dot, Line, Polygon, Text, VGroup


def _as_point(value):
    if hasattr(value, "get_center"):
        return np.asarray(value.get_center())
    if isinstance(value, (list, tuple)) and len(value) >= 2:
        return np.asarray([float(value[0]), float(value[1]), float(value[2]) if len(value) > 2 else 0.0], dtype=float)
    if isinstance(value, np.ndarray):
        arr = np.asarray(value, dtype=float)
        if arr.shape[0] >= 2:
            return np.asarray([float(arr[0]), float(arr[1]), float(arr[2]) if arr.shape[0] > 2 else 0.0], dtype=float)
    raise ValueError("Unsupported point input.")


def make_point(x: float, y: float, z: float = 0.0):
    return Dot([x, y, z])


def make_segment(start, end):
    a, b = _as_point(start), _as_point(end)
    if np.allclose(a, b):
        raise ValueError("A segment requires two distinct points.")
    return Line(a, b)


def make_line(start, end):
    a, b = _as_point(start), _as_point(end)
    if np.allclose(a, b):
        raise ValueError("A line requires two distinct points.")
    return Line(a, b)


def make_ray(start, end):
    a, b = _as_point(start), _as_point(end)
    if np.allclose(a, b):
        raise ValueError("A ray requires two distinct points.")
    return Line(a, b, buff=0)


def make_triangle(a, b, c):
    return Polygon(_as_point(a), _as_point(b), _as_point(c))


def make_polygon(points):
    pts = [_as_point(p) for p in points]
    return Polygon(*pts)


def make_circle(center, radius: float = 1.0):
    return Circle(radius=radius).move_to(_as_point(center))


def projection_point_to_line(point, start, end):
    p = _as_point(point)
    a = _as_point(start)
    b = _as_point(end)
    ab = b - a
    if np.allclose(ab, 0):
        raise ValueError("Projection requires a non-degenerate line.")
    t = np.dot(p - a, ab) / np.dot(ab, ab)
    proj = a + t * ab
    return Dot(proj)


def line_intersection(line1_start, line1_end, line2_start, line2_end):
    a1 = _as_point(line1_start)
    a2 = _as_point(line1_end)
    b1 = _as_point(line2_start)
    b2 = _as_point(line2_end)
    x1, y1 = a1[:2]
    x2, y2 = a2[:2]
    x3, y3 = b1[:2]
    x4, y4 = b2[:2]
    denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(denom) < 1e-9:
        raise ValueError("Parallel or coincident lines do not have one unique intersection.")
    px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom
    py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom
    return np.array([px, py, 0.0], dtype=float)


def make_parallel_marker(start, end, offset: float = 0.2):
    line = make_line(start, end)
    offset_vec = np.asarray([0.0, offset, 0.0])
    parallel = make_line(np.asarray(_as_point(start)) + offset_vec, np.asarray(_as_point(end)) + offset_vec)
    return VGroup(line, parallel)


def make_perpendicular_marker(start, end, length: float = 0.5):
    a = _as_point(start)
    b = _as_point(end)
    mid = (a + b) / 2.0
    v = b - a
    norm = np.linalg.norm(v)
    if norm < 1e-9:
        return Line(a, a)
    perp = np.array([-v[1], v[0], 0.0]) / norm
    p1 = mid - perp * length / 2.0
    p2 = mid + perp * length / 2.0
    return DashedLine(p1, p2)


def make_angle_marker(center, start, end, radius: float = 0.8):
    c = _as_point(center)
    a = _as_point(start)
    b = _as_point(end)
    return ArcBetweenPoints(start=a - c, end=b - c, radius=radius).move_to(c)


def make_dimension_line(start, end, label: str = "L"):
    a, b = _as_point(start), _as_point(end)
    if np.allclose(a, b):
        raise ValueError("A dimension line requires two distinct points.")
    line = DashedLine(a, b)
    annotation = Text(str(label), font_size=18).next_to(line, UP, buff=0.1)
    return VGroup(line, annotation)


def make_axes_2d(x_range=(-5, 5), y_range=(-5, 5), **kwargs):
    return Axes(x_range=x_range, y_range=y_range, **kwargs)


def make_axes_3d(x_range=(-5, 5), y_range=(-5, 5), z_range=(-5, 5), **kwargs):
    from manim import ThreeDAxes

    return ThreeDAxes(x_range=x_range, y_range=y_range, z_range=z_range, **kwargs)


# Ensure angle helper is available even if not imported directly in all Manim versions.
try:
    from manim import ArcBetweenPoints  # type: ignore
except Exception:  # pragma: no cover
    class ArcBetweenPoints(Line):
        def __init__(self, start, end, radius=1.0, **kwargs):
            super().__init__(start, end, **kwargs)
            self.radius = radius
