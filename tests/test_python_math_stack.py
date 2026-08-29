from __future__ import annotations

import importlib.metadata
import math


def test_numpy_vector_dot_product() -> None:
    import numpy as np

    assert np.dot(np.array([1, 2, 3]), np.array([4, 5, 6])) == 32


def test_sympy_symbolic_operations() -> None:
    import sympy as sp

    x = sp.symbols("x")
    assert sp.diff(x**3 + 2 * x, x) == 3 * x**2 + 2
    assert sp.solve(sp.Eq(x**2 - 4, 0), x) == [-2, 2]


def test_scipy_deterministic_linear_program() -> None:
    from scipy.optimize import linprog

    result = linprog(c=[-1, -1], A_ub=[[1, 2]], b_ub=[4], bounds=[(0, None), (0, None)], method="highs")
    assert result.success
    assert math.isclose(-result.fun, 4.0)
    assert math.isclose(result.x[0], 4.0)
    assert math.isclose(result.x[1], 0.0)


def test_mpmath_high_precision_calculation() -> None:
    import mpmath

    with mpmath.workdps(60):
        assert str(mpmath.sqrt(2)).startswith("1.4142135623730950488016887242096980785696718753769")


def test_shapely_polygon_area_and_intersection() -> None:
    from shapely.geometry import Polygon

    left = Polygon([(0, 0), (2, 0), (2, 2), (0, 2)])
    right = Polygon([(1, 0), (3, 0), (3, 2), (1, 2)])
    assert left.area == 4.0
    assert left.intersection(right).area == 2.0


def test_matplotlib_non_interactive_initialization() -> None:
    import matplotlib

    matplotlib.use("Agg", force=True)
    import matplotlib.pyplot as plt

    figure = plt.figure()
    assert matplotlib.get_backend().lower() == "agg"
    plt.close(figure)


def test_z3_sat_and_unsat() -> None:
    import z3

    x = z3.Int("x")
    sat_solver = z3.Solver()
    sat_solver.add(x > 3, x < 5)
    assert sat_solver.check() == z3.sat

    unsat_solver = z3.Solver()
    unsat_solver.add(x > 3, x < 3)
    assert unsat_solver.check() == z3.unsat


def test_manim_import_and_version() -> None:
    import manim

    assert manim.__version__.split(".")[:2] == ["0", "21"]
    assert importlib.metadata.version("manim") == "0.21.0"
