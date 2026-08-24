# Manim Toolkit v1.2

This package is intentionally additive and isolated from the production LuaDraw and geometry pipeline.

## Purpose

The toolkit provides reusable Manim building blocks for future scene composition without replacing the existing geometry engine, scene graph, or renderer routing system.

## Modules

- `ui_containers.py` — reusable layout containers, safe arrangement, overlap checks, and frame-aware panels
- `latex_utils.py` — safe LaTeX normalization, validation, and fitting helpers
- `geometry_tools.py` — lightweight 2D/3D geometry helpers for scene composition only
- `background_ui.py` — reusable backgrounds for clean, scientific, and classroom visual styles

## Rules

- No production migration
- No architecture rewrite
- No renderer or geometry router replacement
- No global camera mutation
- No automatic `scene.add()` or `scene.play()` calls from utility functions

## Example

```python
from manim_toolkit.background_ui import create_clean_background
from manim_toolkit.latex_utils import safe_mathtex
from manim_toolkit.ui_containers import create_card

background = create_clean_background()
formula = safe_mathtex(r"x^2 + 1")
card = create_card("Ready")
```

## Relationship to LuaDraw

This toolkit is intentionally separate from the verified LuaDraw path. The geometry engine and LuaDraw router remain authoritative for production geometry generation, while this toolkit only helps compose Manim-ready visual layers.
