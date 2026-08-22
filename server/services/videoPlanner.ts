import {
  MathProblemIR,
  MathSolution,
  VideoSpecification,
  VisualSpecification,
  VideoStyleType,
  SkillModeType,
  SafetyLocks,
} from "../../src/types/mathSchema.js";
import { getProvider } from "../providers/index.js";
import { buildSystemSkillInstruction } from "./skillContextBuilder.js";
import { resolveVideoTaskMode } from "./videoTaskResolver.js";
import { VideoTaskMode } from "./skillRouter.js";

export interface VideoPlannerOptions {
  providerId?: string;
  videoStyle?: VideoStyleType;
  skillMode?: SkillModeType;
  manualModules?: Record<string, boolean>;
  safetyLocks?: SafetyLocks;
}

export class VideoPlannerService {
  async planVideo(
    problemIR: MathProblemIR,
    solution: MathSolution,
    visualSpec: VisualSpecification,
    optionsOrProviderId?: string | VideoPlannerOptions
  ): Promise<VideoSpecification> {
    const options: VideoPlannerOptions =
      typeof optionsOrProviderId === "string"
        ? { providerId: optionsOrProviderId }
        : optionsOrProviderId || {};

    const provider = getProvider(options.providerId);

    const systemPrompt = `You are an expert Educational Math Video Producer and 3Blue1Brown/Manim Animation Director.
Your task is STEP 5 — VIDEO PLANNER:
1. Convert the verified mathematical solution into a structured sequence of pedagogically sound Manim scenes.
2. Structure rules:
   - Each scene must focus on exactly ONE main teaching idea.
   - Each scene must contain:
     * scene_id (e.g. "scene_01_intro", "scene_02_analysis", "scene_03_proof", "scene_04_conclusion")
     * scene_index: number
     * title: string
     * learning_goal: clear educational takeaway for the student
     * math_content: { latex: string, explanation: string }
     * visual_objects: list of Manim objects (e.g., ["title", "pyramid_3d", "formula_tex", "highlight_box"])
     * animations: list of animation instructions (Create, Write, Transform, Indicate, FadeIn, FadeOut, MoveTo)
     * narration: teacher voiceover script in natural Vietnamese with duration_hint_seconds
   - Do NOT duplicate mathematical objects unnecessarily across consecutive scenes.
3. Write clean, complete, executable Python Manim Community Edition code (using 'from manim import *').
   The Python code must define a Scene class that animates the entire lesson step by step with Text, MathTex, VGroup, and transforms.`;

    const schemaDescription = `{
  "video_title": "Video bài giảng: Thể tích khối chóp S.ABCD",
  "total_duration_seconds": 65,
  "target_aspect_ratio": "16:9",
  "resolution": "1080p",
  "scenes": [
    {
      "scene_id": "scene_01_intro",
      "scene_index": 1,
      "title": "Giới thiệu đề bài & Nhận dạng hình",
      "learning_goal": "Học sinh hiểu rõ cấu trúc khối đa diện và giả thiết SA vuông góc đáy",
      "math_content": {
        "latex": "S.ABCD, \\quad SA \\perp (ABCD), \\quad SA = a\\sqrt{3}",
        "explanation": "Khối chóp có chiều cao hạ từ đỉnh S chính là đoạn SA."
      },
      "visual_objects": ["title_text", "pyramid_wireframe", "given_box"],
      "animations": [
        {"type": "Write", "target": "title_text", "duration": 2},
        {"type": "Create", "target": "pyramid_wireframe", "duration": 3},
        {"type": "Indicate", "target": "sa_edge", "duration": 1.5}
      ],
      "narration": {
        "text_vi": "Chào các em, hôm nay chúng ta cùng phân tích bài toán tính thể tích khối chóp S.ABCD có đường cao SA vuông góc với đáy.",
        "voice_tone": "formal_teacher",
        "duration_hint_seconds": 15
      }
    },
    {
      "scene_id": "scene_02_step1",
      "scene_index": 2,
      "title": "Tính diện tích đáy ABCD",
      "learning_goal": "Áp dụng công thức diện tích hình vuông/tam giác",
      "math_content": {
        "latex": "S_{ABCD} = a^2",
        "explanation": "Đáy ABCD là hình vuông cạnh a."
      },
      "visual_objects": ["base_polygon", "area_formula"],
      "animations": [
        {"type": "Indicate", "target": "base_polygon", "duration": 1.5},
        {"type": "Write", "target": "area_formula", "duration": 2}
      ],
      "narration": {
        "text_vi": "Bước một, ta xác định diện tích đáy. Vì đáy là hình vuông cạnh a nên S bằng a bình phương.",
        "voice_tone": "step_by_step",
        "duration_hint_seconds": 15
      }
    },
    {
      "scene_id": "scene_03_conclusion",
      "scene_index": 3,
      "title": "Tổng hợp công thức và kết luận",
      "learning_goal": "Thu được kết quả thể tích chính xác",
      "math_content": {
        "latex": "V = \\frac{1}{3} S_{đáy} \\cdot h = \\frac{a^3\\sqrt{3}}{3}",
        "explanation": "Thay số và rút gọn thu được đáp án."
      },
      "visual_objects": ["final_box", "highlight_text"],
      "animations": [
        {"type": "Transform", "target": "formula", "duration": 2},
        {"type": "Circumscribe", "target": "final_box", "duration": 2}
      ],
      "narration": {
        "text_vi": "Áp dụng công thức một phần ba đáy nhân chiều cao, ta thu được kết quả thể tích cuối cùng.",
        "voice_tone": "enthusiastic",
        "duration_hint_seconds": 15
      }
    }
  ],
  "manim_python_code": "from manim import *\\n\\nclass MathLesson(Scene):\\n    def construct(self):\\n        title = Text('MATH AI VIDEO STUDIO', font_size=40).to_edge(UP)\\n        self.play(Write(title))\\n        self.wait(1)\\n"
}`;

    const prompt = `Create Manim video plan and full Python code for this math problem and solution:
PROBLEM: ${problemIR.problem}
TOPIC: ${problemIR.topic}
SOLUTION SUMMARY: ${solution.section_2_approach.strategy_overview}
STEPS: ${solution.section_3_detailed_steps.map((s) => `${s.title}: ${s.math_latex}`).join(" | ")}
FINAL ANSWER: ${solution.final_answer.value}`;

    let effectiveSystemPrompt = systemPrompt;
    let resolvedMode: VideoTaskMode = "MANIM_VIDEO_CREATE";

    if (options.videoStyle === "geometry_focus") {
      const is3D = (problemIR.domain || "").toLowerCase().includes("không gian") || visualSpec.visual_type === "GEOMETRY_3D";
      resolvedMode = is3D ? "GEOMETRY_3D" : "GEOMETRY_2D";
    } else if (options.videoStyle === "graph_animation") {
      resolvedMode = "GRAPH_2D";
    } else if (options.videoStyle === "standard_manim" || options.videoStyle === "cinematic_infographic" || options.videoStyle === "whiteboard" || options.videoStyle === "custom_reference") {
      resolvedMode = "MANIM_VIDEO_CREATE";
    }

    let taskInstruction = "GEOMETRY & GRAPH LOCK: Visual elements, coordinates, points, and equations from visualSpec/graphSpec are the immutable mathematical source of truth. Do NOT invent new geometry or alter coordinates.";
    
    if (options.safetyLocks?.mathLock !== false) {
      taskInstruction += "\nMATH LOCK ACTIVE: Do not alter verified formulas, algebraic factors, numerical roots, or step deductions.";
    }
    if (options.safetyLocks?.geometryLock !== false) {
      taskInstruction += "\nGEOMETRY LOCK ACTIVE: Do not add unverified points/edges/faces, do not change perspective/proportions or guess projections.";
    }
    if (options.safetyLocks?.zeroInference !== false) {
      taskInstruction += "\nZERO INFERENCE ACTIVE: Zero speculation. If visual evidence is insufficient, preserve exact given constraints.";
    }
    if (options.videoStyle === "cinematic_infographic") {
      taskInstruction += "\nCINEMATIC INFOGRAPHIC DIRECTIVE: Apply high-contrast Facebook cinematic palette, Camera Director flow (OVERVIEW -> TRAVEL -> FOCUS -> PUSH IN -> SETTLE -> READ -> PULL OUT), and pacing rule (MOVE -> SETTLE -> READ -> MOVE).";
    } else if (options.videoStyle === "standard_manim") {
      taskInstruction += "\nSTANDARD MANIM DIRECTIVE: Focus on clean vector math presentation without heavy cinematic framing.";
    } else if (options.videoStyle === "whiteboard") {
      taskInstruction += "\nWHITEBOARD DIRECTIVE: High-contrast pedagogical whiteboard layout, step-by-step math writing emphasis.";
    }

    try {
      const skillCtx = await buildSystemSkillInstruction({
        mode: resolvedMode,
        coreAppInstruction: systemPrompt,
        taskInstruction,
      });
      effectiveSystemPrompt = skillCtx.systemInstruction;
    } catch (err: any) {
      console.warn(`[VideoPlannerService] SkillContext fallback: ${err.message}`);
    }

    try {
      const result = await provider.generateStructuredJSON<VideoSpecification>(prompt, schemaDescription, {
        systemPrompt: effectiveSystemPrompt,
        temperature: 0.15,
      });

      // Ensure manim_python_code is rich and valid
      if (!result.manim_python_code || result.manim_python_code.length < 50) {
        result.manim_python_code = generateFallbackManimCode(problemIR, solution);
      }

      return result;
    } catch (err: any) {
      console.error("VideoPlanner error:", err);
      return {
        video_title: `Bài giảng: ${problemIR.topic || "Toán THPT"}`,
        total_duration_seconds: 45,
        target_aspect_ratio: "16:9",
        resolution: "1080p",
        scenes: [
          {
            scene_id: "scene_01_intro",
            scene_index: 1,
            title: "Giới thiệu bài toán",
            learning_goal: "Nắm vững đề bài và phương hướng tiếp cận",
            math_content: {
              latex: problemIR.latex || "f(x)",
              explanation: "Đề bài và giả thiết ban đầu",
            },
            visual_objects: ["title", "problem_text"],
            animations: [{ type: "Write", target: "title", duration: 2 }],
            narration: {
              text_vi: "Chào các em, chúng ta cùng phân tích lời giải chi tiết cho bài toán sau đây.",
              voice_tone: "formal_teacher",
              duration_hint_seconds: 15,
            },
          },
          {
            scene_id: "scene_02_steps",
            scene_index: 2,
            title: "Triển khai lời giải sư phạm",
            learning_goal: "Thực hiện các bước biến đổi toán học chuẩn xác",
            math_content: {
              latex: solution.section_3_detailed_steps[0]?.math_latex || "y' = f'(x)",
              explanation: "Các bước giải chi tiết",
            },
            visual_objects: ["step_card", "formula_group"],
            animations: [{ type: "Create", target: "step_card", duration: 2 }],
            narration: {
              text_vi: "Ta tiến hành biến đổi theo từng bước có căn cứ định lý chặt chẽ.",
              voice_tone: "step_by_step",
              duration_hint_seconds: 20,
            },
          },
          {
            scene_id: "scene_03_conclusion",
            scene_index: 3,
            title: "Kết luận và Đáp số",
            learning_goal: "Ghi nhớ kết quả và dạng bài tổng quát",
            math_content: {
              latex: solution.final_answer.latex || solution.final_answer.value,
              explanation: solution.final_answer.summary_text,
            },
            visual_objects: ["final_badge", "conclusion_text"],
            animations: [{ type: "Circumscribe", target: "final_badge", duration: 2 }],
            narration: {
              text_vi: `Như vậy, đáp số cuối cùng của bài toán là ${solution.final_answer.value}. Chúc các em học tốt!`,
              voice_tone: "enthusiastic",
              duration_hint_seconds: 15,
            },
          },
        ],
        manim_python_code: generateFallbackManimCode(problemIR, solution),
      };
    }
  }
}

function generateFallbackManimCode(problemIR: MathProblemIR, solution: MathSolution): string {
  const safeLatex = (problemIR.latex || "f(x)").replace(/\\/g, "\\\\");
  const safeAnswer = (solution.final_answer.latex || solution.final_answer.value || "Ans").replace(/\\/g, "\\\\");

  return `from manim import *

class MathLessonScene(Scene):
    def construct(self):
        # 1. Background styling
        self.camera.background_color = "#0B0F19"
        
        # 2. Header banner
        header = Text("MATH AI VIDEO STUDIO", font_size=28, color=TEAL_B).to_edge(UP, buff=0.4)
        topic = Text("${problemIR.topic || 'Toán học THPT'}", font_size=20, color=GRAY_B).next_to(header, DOWN, buff=0.2)
        self.play(Write(header), FadeIn(topic))
        self.wait(1)

        # 3. Problem statement
        problem_box = Rectangle(width=12, height=1.6, color=BLUE_D, fill_opacity=0.2, corner_radius=0.2)
        problem_box.next_to(topic, DOWN, buff=0.4)
        problem_label = Text("Đề bài:", font_size=18, color=YELLOW_C).next_to(problem_box.get_corner(UL), DR, buff=0.15)
        problem_tex = MathTex(r"${safeLatex}", font_size=24, color=WHITE).move_to(problem_box.get_center())
        
        self.play(Create(problem_box), Write(problem_label), Write(problem_tex))
        self.wait(1.5)

        # 4. Pedagogical Solution steps
        step_group = VGroup()
        step1_title = Text("1. Hướng giải:", font_size=20, color=GREEN_C).to_edge(LEFT, buff=1.0).shift(UP * 0.2)
        step1_tex = MathTex(r"${(solution.section_2_approach.formulas_needed[0] || 'f(x) \\rightarrow f\\\'(x)').replace(/\\/g, '\\\\')}", font_size=22, color=BLUE_A).next_to(step1_title, RIGHT, buff=0.3)
        
        self.play(Write(step1_title), Write(step1_tex))
        self.wait(1.5)

        # 5. Final Answer Reveal
        ans_box = SurroundingRectangle(step1_tex, color=GOLD, buff=0.2, corner_radius=0.1)
        final_text = MathTex(r"\\text{Kết quả: } ${safeAnswer}", font_size=26, color=YELLOW_A).to_edge(DOWN, buff=1.0)
        
        self.play(Create(ans_box), Write(final_text))
        self.play(Indicate(final_text, color=YELLOW_D))
        self.wait(2)
        
        # Fade out
        self.play(FadeOut(Group(*self.mobjects)))
`;
}
