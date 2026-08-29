from __future__ import annotations

import importlib.metadata
import shutil
import sys


def main() -> int:
    python_compatible = sys.version_info[:2] == (3, 14)
    try:
        manim_version = importlib.metadata.version("manim")
    except importlib.metadata.PackageNotFoundError:
        manim_version = "NOT_INSTALLED"
    manim_compatible = manim_version.startswith("0.21.")

    checks = {
        "PYTHON_314_CHECK": python_compatible,
        "MANIM_021_CHECK": manim_compatible,
        "FFMPEG_CHECK": shutil.which("ffmpeg") is not None,
        "XELATEX_CHECK": shutil.which("xelatex") is not None,
        "DVISVGM_CHECK": shutil.which("dvisvgm") is not None,
    }

    print(f"PYTHON_VERSION={sys.version.split()[0]}")
    print(f"MANIM_VERSION={manim_version}")
    for name, passed in checks.items():
        print(f"{name}={'PASS' if passed else 'FAIL'}")

    ready = all(checks.values())
    print(f"PYTHON_RUNTIME_READY={'true' if ready else 'false'}")
    return 0 if ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
