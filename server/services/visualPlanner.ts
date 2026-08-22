import { MathProblemIR, MathSolution, VisualSpecification } from "../../src/types/mathSchema.js";
import { getProvider } from "../providers/index.js";
import { buildSystemSkillInstruction } from "./skillContextBuilder.js";
import { resolveVideoTaskMode } from "./videoTaskResolver.js";

export class VisualPlannerService {
  async planVisuals(
    problemIR: MathProblemIR,
    solution: MathSolution,
    providerId?: string
  ): Promise<VisualSpecification> {
    const provider = getProvider(providerId);

    const systemPrompt = `You are a Computational Geometry and Mathematical Visualizer Architect.
Your task is STEP 4 — VISUAL PLANNER:
1. Automatically detect the exact required visualization type:
   - NONE (if purely abstract algebra with no useful spatial or graph representation)
   - GEOMETRY_2D (Plane geometry: triangles, circles, polygons, vectors in 2D)
   - GEOMETRY_3D (Solid geometry: pyramid S.ABCD, prism, cylinder, cone, sphere, angles/planes in space)
   - COORDINATE_GRAPH (Oxy or Oxyz coordinate geometry: circles $(C)$, lines, planes $(\\alpha)$, vectors)
   - FUNCTION_GRAPH (Calculus function plots: cubic, quartic, rational, tangent lines, inflection points, extreme points)
   - PROBABILITY (Venn diagrams, tree diagrams, distribution bars)
   - MIN_MAX (Geometric or algebraic optimization visualization)
   - STATISTICS (Histograms, box plots)

2. Create a structured, programmatic visual specification with exact coordinates (normalized to a reasonable canvas like [-5, 5] or [0, 8]).
3. NEVER use vague or arbitrary shapes. If it's a pyramid S.ABCD, provide coordinates for S, A, B, C, D, base edges, lateral edges with dashed lines for occluded/hidden edges (e.g. AB or AD).
4. If it's a function $f(x)$, provide the exact mathematical formula string in 'equation' (e.g., "x^3 - 3*x"), key points (roots, local extrema, y-intercept).
5. Generate fully valid TikZ LaTeX code (using tkz-euclide or standard tikz) and Asymptote code.`;

    const schemaDescription = `{
  "visual_type": "GEOMETRY_3D | GEOMETRY_2D | FUNCTION_GRAPH | COORDINATE_GRAPH | PROBABILITY | MIN_MAX | STATISTICS | NONE",
  "title": "Mô hình hình học trực quan cho bài toán...",
  "description": "Hình chóp S.ABCD đáy hình vuông có SA vuông góc đáy...",
  "view_mode": "3d | 2d | graph",
  "coordinate_system": {
    "x_min": -4,
    "x_max": 6,
    "y_min": -4,
    "y_max": 6,
    "z_min": -1,
    "z_max": 6,
    "axis_labels": {"x": "x", "y": "y", "z": "z"}
  },
  "elements": [
    {
      "id": "A",
      "type": "point",
      "label": "A",
      "coords": [0, 0, 0],
      "color": "#ef4444"
    },
    {
      "id": "B",
      "type": "point",
      "label": "B",
      "coords": [4, 0, 0],
      "color": "#ef4444"
    },
    {
      "id": "C",
      "type": "point",
      "label": "C",
      "coords": [5, 2, 0],
      "color": "#ef4444"
    },
    {
      "id": "D",
      "type": "point",
      "label": "D",
      "coords": [1, 2, 0],
      "color": "#ef4444"
    },
    {
      "id": "S",
      "type": "point",
      "label": "S",
      "coords": [0, 0, 5],
      "color": "#6366f1"
    },
    {
      "id": "seg_AB",
      "type": "segment",
      "from": [0, 0, 0],
      "to": [4, 0, 0],
      "style": "solid",
      "color": "#38bdf8"
    },
    {
      "id": "seg_AD",
      "type": "segment",
      "from": [0, 0, 0],
      "to": [1, 2, 0],
      "style": "dashed",
      "color": "#94a3b8"
    },
    {
      "id": "seg_SA",
      "type": "segment",
      "from": [0, 0, 5],
      "to": [0, 0, 0],
      "style": "dashed",
      "color": "#a855f7"
    }
  ],
  "camera_angles": {
    "azimuth": 45,
    "elevation": 25,
    "distance": 8
  },
  "tikz_code": "\\\\begin{tikzpicture}[scale=1.2]...\\\\end{tikzpicture}",
  "asymptote_code": "import three; size(6cm); ...",
  "geogebra_commands": ["A = (0, 0)", "B = (4, 0)", "Polygon(A, B, C, D)"]
}`;

    const prompt = `Design programmatic visual specification for this math problem:
PROBLEM: ${problemIR.problem}
DOMAIN: ${problemIR.domain}
TOPIC: ${problemIR.topic}
ENTITIES: ${JSON.stringify(problemIR.entities)}
FINAL ANSWER: ${solution.final_answer.value}`;

    let effectiveSystemPrompt = systemPrompt;
    const taskMode = resolveVideoTaskMode({
      pipelineStage: "VISUAL",
      domain: problemIR.domain,
      visualType: problemIR.domain,
    }) || "GEOMETRY_2D";

    try {
      const skillCtx = await buildSystemSkillInstruction({
        mode: taskMode,
        coreAppInstruction: systemPrompt,
        taskInstruction: "GRAPH & GEOMETRY LOCK: Use mathematically verified equations, coordinates, roots, asymptotes, and extrema. Never generate arbitrary visual approximations.",
      });
      effectiveSystemPrompt = skillCtx.systemInstruction;
    } catch (err: any) {
      console.warn(`[VisualPlannerService] SkillContext fallback: ${err.message}`);
    }

    try {
      return await provider.generateStructuredJSON<VisualSpecification>(prompt, schemaDescription, {
        systemPrompt: effectiveSystemPrompt,
        temperature: 0.1,
      });
    } catch (err: any) {
      console.error("VisualPlanner error:", err);
      // Fallback visual specification
      const is3D = problemIR.domain.includes("không gian") || problemIR.problem.toLowerCase().includes("chóp") || problemIR.problem.toLowerCase().includes("lăng trụ");
      const isFunction = problemIR.domain.includes("Giải tích") || problemIR.problem.toLowerCase().includes("hàm số") || problemIR.problem.includes("f(x)");

      if (is3D) {
        return {
          visual_type: "GEOMETRY_3D",
          title: "Hình học không gian trực quan",
          description: "Mô hình hình học 3D chuẩn mực sư phạm",
          view_mode: "3d",
          coordinate_system: { x_min: -3, x_max: 5, y_min: -3, y_max: 5, z_min: 0, z_max: 5 },
          elements: [
            { id: "A", type: "point", label: "A", coords: [0, 0, 0], color: "#f43f5e" },
            { id: "B", type: "point", label: "B", coords: [4, 0, 0], color: "#f43f5e" },
            { id: "C", type: "point", label: "C", coords: [5, 2.5, 0], color: "#f43f5e" },
            { id: "D", type: "point", label: "D", coords: [1, 2.5, 0], color: "#f43f5e" },
            { id: "S", type: "point", label: "S", coords: [0, 0, 4], color: "#6366f1" },
            { id: "e_AB", type: "segment", from: [0, 0, 0], to: [4, 0, 0], style: "solid", color: "#38bdf8" },
            { id: "e_BC", type: "segment", from: [4, 0, 0], to: [5, 2.5, 0], style: "solid", color: "#38bdf8" },
            { id: "e_CD", type: "segment", from: [5, 2.5, 0], to: [1, 2.5, 0], style: "solid", color: "#38bdf8" },
            { id: "e_DA", type: "segment", from: [1, 2.5, 0], to: [0, 0, 0], style: "dashed", color: "#94a3b8" },
            { id: "e_SA", type: "segment", from: [0, 0, 4], to: [0, 0, 0], style: "dashed", color: "#a855f7" },
            { id: "e_SB", type: "segment", from: [0, 0, 4], to: [4, 0, 0], style: "solid", color: "#a855f7" },
            { id: "e_SC", type: "segment", from: [0, 0, 4], to: [5, 2.5, 0], style: "solid", color: "#a855f7" },
            { id: "e_SD", type: "segment", from: [0, 0, 4], to: [1, 2.5, 0], style: "solid", color: "#a855f7" },
          ],
          camera_angles: { azimuth: 45, elevation: 25, distance: 7 },
          tikz_code: "\\begin{tikzpicture}[scale=1]\n\\draw[dashed] (0,0) -- (1,2) (0,0) -- (0,4);\n\\draw (0,0) -- (4,0) -- (5,2) -- (1,2);\n\\draw (0,4) -- (4,0) (0,4) -- (5,2) (0,4) -- (1,2);\n\\node[below left] at (0,0) {A};\n\\node[below right] at (4,0) {B};\n\\node[right] at (5,2) {C};\n\\node[above] at (1,2) {D};\n\\node[above] at (0,4) {S};\n\\end{tikzpicture}",
        };
      } else if (isFunction) {
        return {
          visual_type: "FUNCTION_GRAPH",
          title: "Đồ thị hàm số & Khảo sát",
          description: "Đồ thị hàm số và các điểm đặc biệt",
          view_mode: "graph",
          coordinate_system: { x_min: -4, x_max: 4, y_min: -5, y_max: 5, axis_labels: { x: "x", y: "y" } },
          elements: [
            { id: "curve1", type: "curve", equation: "x^3 - 3*x", color: "#3b82f6", width: 3 },
            { id: "p_max", type: "point", label: "CĐ (-1, 2)", coords: [-1, 2], color: "#10b981" },
            { id: "p_min", type: "point", label: "CT (1, -2)", coords: [1, -2], color: "#ef4444" },
            { id: "p_inf", type: "point", label: "Uốn (0, 0)", coords: [0, 0], color: "#8b5cf6" },
          ],
          tikz_code: "\\begin{tikzpicture}\n\\draw[->] (-4,0) -- (4,0) node[right] {$x$};\n\\draw[->] (0,-4) -- (0,4) node[above] {$y$};\n\\draw[thick, blue, smooth, domain=-2.2:2.2] plot (\\x, {\\x^3 - 3*\\x});\n\\end{tikzpicture}",
        };
      } else {
        return {
          visual_type: "COORDINATE_GRAPH",
          title: "Hình học minh họa chuẩn",
          description: "Mô hình biểu diễn toán học",
          view_mode: "2d",
          coordinate_system: { x_min: -4, x_max: 6, y_min: -3, y_max: 5 },
          elements: [
            { id: "p1", type: "point", label: "A", coords: [0, 0], color: "#ef4444" },
            { id: "p2", type: "point", label: "B", coords: [4, 0], color: "#ef4444" },
            { id: "p3", type: "point", label: "C", coords: [1, 3], color: "#ef4444" },
            { id: "poly", type: "polygon", points: [[0, 0], [4, 0], [1, 3]], color: "#38bdf8", fill: "#38bdf8", fill_opacity: 0.15 },
          ],
          tikz_code: "\\begin{tikzpicture}\n\\draw (0,0) -- (4,0) -- (1,3) -- cycle;\n\\end{tikzpicture}",
        };
      }
    }
  }
}
