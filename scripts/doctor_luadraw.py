from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path


def available(command: str) -> bool:
    return shutil.which(command) is not None


def main() -> int:
    luatex = available("luatex")
    lualatex = available("lualatex")
    package = subprocess.run(["kpsewhich", "luadraw.sty"], capture_output=True, text=True, shell=False).stdout.strip() if available("kpsewhich") else ""
    tikz = subprocess.run(["kpsewhich", "tikz.sty"], capture_output=True, text=True, shell=False).stdout.strip() if available("kpsewhich") else ""
    smoke = False
    smoke_error = ""
    if lualatex and package and tikz:
        with tempfile.TemporaryDirectory(prefix="luadraw_doctor_") as folder:
            root = Path(folder)
            source = root / "smoke.tex"
            source.write_text(r"""\documentclass{article}
\pagestyle{empty}
\usepackage{luadraw}
\begin{document}
\begin{luadraw*}{name=smoke}
tex.print([[\begin{tikzpicture}
\draw[line width=0.7pt,blue] (0,0) -- (2,0) -- (1,2) -- cycle;
\end{tikzpicture}]])
\end{luadraw*}
\end{document}
""", encoding="utf-8")
            try:
                result = subprocess.run(["lualatex", "--disable-installer", "--interaction=nonstopmode", "--halt-on-error", source.name], cwd=root, capture_output=True, text=True, shell=False, timeout=60)
                smoke = result.returncode == 0 and (root / "smoke.pdf").is_file() and (root / "smoke.pdf").stat().st_size > 0
                if not smoke:
                    smoke_error = (result.stdout + "\n" + result.stderr)[-2000:].replace("\n", " | ")
            except subprocess.TimeoutExpired:
                smoke = False
                smoke_error = "LuaLaTeX timed out after 60 seconds."
    values = {
        "LUATEX_CHECK": luatex, "LUALATEX_CHECK": lualatex,
        "LUADRAW_PACKAGE_CHECK": bool(package), "TIKZ_CHECK": bool(tikz),
        "LUADRAW_SMOKE_RENDER": smoke,
    }
    for key, value in values.items(): print(f"{key}={'PASS' if value else 'FAIL'}")
    ready = all(values.values())
    if smoke_error: print(f"LUADRAW_SMOKE_ERROR={smoke_error}")
    print(f"LUADRAW_READY={'true' if ready else 'false'}")
    return 0 if ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
