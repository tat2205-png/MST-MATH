from __future__ import annotations

import os
from pathlib import Path

from manim import Create, FadeOut, Scene, SVGMobject, Text, UP, VGroup


class LuaDrawAssetSmoke(Scene):
    def construct(self):
        project_root = Path(__file__).resolve().parent.parent
        runtime_root = (project_root / "local_bridge" / "runs").resolve()
        source = Path(os.environ.get("LUADRAW_SMOKE_SVG", "")).resolve()
        if source.suffix.lower() != ".svg" or not source.is_file() or runtime_root not in source.parents:
            raise ValueError("LUADRAW_SMOKE_SVG must be an existing SVG inside local_bridge/runs.")
        asset = SVGMobject(str(source)).scale_to_fit_height(5.5)
        title = Text("Verified LuaDraw cube net", font_size=30).to_edge(UP)
        group = VGroup(title, asset)
        self.play(Create(asset), run_time=0.8)
        self.play(Create(title), run_time=0.4)
        self.wait(0.8)
        self.play(FadeOut(group), run_time=0.4)
