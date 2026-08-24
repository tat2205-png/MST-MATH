import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { GeometryArtifactResult, GeometrySpec } from "../../src/types/geometrySpec.js";
import type { GeometryEngine } from "./geometryEngine.js";
import { validateGeometrySpec } from "./geometryValidator.js";

const run = promisify(execFile);
const safeText = (value: string) => value.replace(/[^A-Za-z0-9 .,:;()+\-=]/g, "").slice(0, 80);
const luaNumber = (value: number) => Number(value.toFixed(8)).toString();

export class LuaDrawEngine implements GeometryEngine {
  readonly name = "LUADRAW";

  async render(spec: GeometrySpec, outputDir: string): Promise<GeometryArtifactResult> {
    const qa = validateGeometrySpec(spec);
    if (qa.status !== "PASS") return { engine: "LUADRAW", status: "FAIL", sourceFingerprint: spec.sourceFingerprint, error: qa.errors.join(" ") };
    const resolved = path.resolve(outputDir);
    const workspaceRoot = path.resolve(process.cwd(), "local_bridge", "runs");
    if (resolved !== workspaceRoot && !resolved.startsWith(`${workspaceRoot}${path.sep}`)) return { engine: "LUADRAW", status: "FAIL", sourceFingerprint: spec.sourceFingerprint, error: "Unsafe LuaDraw output path." };
    await fs.mkdir(resolved, { recursive: true });
    const projected = new Map(spec.vertices.map((v) => [v.id, [v.x + 0.5 * (v.z || 0), v.y + 0.35 * (v.z || 0)] as [number, number]]));
    const polygons = spec.net ? Object.entries(spec.net.faceCoordinates).map(([id, points]) => ({ id, points })) : spec.faces.map((face) => ({ id: face.id, points: face.vertices.map((id) => projected.get(id)!) }));
    const polyTikz = polygons.map(({ points }) => `\\draw[line width=0.7pt,${safeText(spec.renderOptions.strokeColor || "blue")}] ${points.map(([x, y]) => `(${luaNumber(x)},${luaNumber(y)})`).join(" -- ")} -- cycle;`).join("\n");
    const labelTikz = spec.labels.map((label) => { const p = label.position || (label.vertex ? projected.get(label.vertex) : undefined); return p ? `\\node[above] at (${luaNumber(p[0])},${luaNumber(p[1])}) {${safeText(label.text)}};` : ""; }).join("\n");
    const tex = `\\documentclass{article}\n\\pagestyle{empty}\n\\usepackage{luadraw}\n\\begin{document}\n\\begin{luadraw*}{name=geometry}\ntex.print([[\\begin{tikzpicture}\n${polyTikz}\n${labelTikz}\n\\end{tikzpicture}]])\n\\end{luadraw*}\n\\end{document}\n`;
    const texPath = path.join(resolved, "geometry.tex"), pdfPath = path.join(resolved, "geometry.pdf"), svgPath = path.join(resolved, "geometry.svg");
    const metadataPath = path.join(resolved, "geometry.metadata.json"), qaPath = path.join(resolved, "geometry.qa.json");
    await fs.writeFile(texPath, tex, "utf8");
    await fs.writeFile(metadataPath, JSON.stringify(spec, null, 2), "utf8");
    await fs.writeFile(qaPath, JSON.stringify(qa, null, 2), "utf8");
    try {
      await run("lualatex", ["--disable-installer", "--interaction=nonstopmode", "--halt-on-error", `--output-directory=${resolved}`, texPath], { cwd: resolved, timeout: 60_000, windowsHide: true });
      await run("dvisvgm", ["--pdf", pdfPath, `--output=${svgPath}`], { cwd: resolved, timeout: 60_000, windowsHide: true });
      const [pdf, svg] = await Promise.all([fs.stat(pdfPath), fs.stat(svgPath)]);
      if (!pdf.size || !svg.size) throw new Error("LuaDraw produced an empty artifact.");
      return { engine: "LUADRAW", status: "PASS", pdfPath, svgPath, metadataPath, qaPath, sourceFingerprint: spec.sourceFingerprint };
    } catch (error: any) {
      return { engine: "LUADRAW", status: "FAIL", sourceFingerprint: spec.sourceFingerprint, error: error.message };
    }
  }
}
