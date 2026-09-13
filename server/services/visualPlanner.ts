import { MathProblemIR, MathSolution, VisualSpecification } from "../../src/types/mathSchema.js";
import { getProvider } from "../providers/index.js";
import { buildSystemSkillInstruction } from "./skillContextBuilder.js";
import { resolveVideoTaskMode } from "./videoTaskResolver.js";

export const VISUAL_PLANNING_FAILURE_CODE = "VISUAL_PLANNING_REVIEW_REQUIRED";

export class VisualPlannerService {
  async planVisuals(
    problemIR: MathProblemIR,
    solution: MathSolution,
    providerId?: string
  ): Promise<VisualSpecification> {
    const provider = getProvider(providerId);

    const systemPrompt = `You are a Computational Geometry and Mathematical Visualizer Architect.
Your task is STEP 4 — VISUAL PLANNER:
1. Detect only the visualization type actually supported by the source and verified mathematical result:
   - NONE
   - GEOMETRY_2D
   - GEOMETRY_3D
   - COORDINATE_GRAPH
   - FUNCTION_GRAPH
   - PROBABILITY
   - MIN_MAX
   - STATISTICS
2. Create a structured, programmatic visual specification using only source-derived or mathematically verified coordinates, equations, labels, relations, extrema, roots, asymptotes, and geometry.
3. ZERO-INFERENCE: never invent a point, polygon, solid, function, coordinate, hidden edge, or annotation merely to make a visual look complete.
4. If the source is insufficient for an authoritative visual, use visual_type NONE rather than fabricating mathematical content.
5. Renderer code must be derived from the same semantic visual specification; do not introduce new mathematics in TikZ, Asymptote, or GeoGebra output.`;

    const schemaDescription = `{
  "visual_type": "GEOMETRY_3D | GEOMETRY_2D | FUNCTION_GRAPH | COORDINATE_GRAPH | PROBABILITY | MIN_MAX | STATISTICS | NONE",
  "title": "Source-grounded visual title",
  "description": "Describe only the visual content justified by the source",
  "view_mode": "3d | 2d | graph",
  "coordinate_system": {
    "x_min": 0,
    "x_max": 0,
    "y_min": 0,
    "y_max": 0,
    "z_min": 0,
    "z_max": 0,
    "axis_labels": {"x": "x", "y": "y", "z": "z"}
  },
  "elements": [],
  "camera_angles": {
    "azimuth": 0,
    "elevation": 0,
    "distance": 0
  },
  "tikz_code": "",
  "asymptote_code": "",
  "geogebra_commands": []
}`;

    const prompt = `Design a source-grounded programmatic visual specification for this math problem.
Do not add any mathematical object that is absent from the source or not deterministically/explicitly supported by the verified solution.
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
        taskInstruction: "GRAPH & GEOMETRY LOCK: Use only mathematically verified equations, coordinates, roots, asymptotes, extrema, and source-supported geometry. Never generate arbitrary visual approximations.",
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
      const message = err instanceof Error ? err.message : String(err);
      console.error("VisualPlanner error:", err);
      throw new Error(
        `${VISUAL_PLANNING_FAILURE_CODE}: provider visual planning failed; no fabricated fallback was produced. ${message}`,
      );
    }
  }
}
