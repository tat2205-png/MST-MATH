import { MathProblemIR, MathSolution } from "../../src/types/mathSchema.js";

/**
 * Placeholder and Integration Interfaces for external math ecosystem tools:
 * - NotebookLM: Audio discussion / Study Guide generator
 * - OpenClaw: Autonomous agent pipeline execution worker
 * - Codex: Math code synthesis & symbolic algebra engine
 */

export interface NotebookLMStudyGuide {
  title: string;
  key_takeaways: string[];
  audio_podcast_script: Array<{ speaker: "Teacher" | "Student"; dialogue: string }>;
  suggested_flashcards: Array<{ front: string; back: string }>;
}

export interface OpenClawAgentTask {
  taskId: string;
  agentName: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED";
  actions: string[];
}

export class IntegrationAdaptersService {
  async generateNotebookLMGuide(problemIR: MathProblemIR, solution: MathSolution): Promise<NotebookLMStudyGuide> {
    return {
      title: `Tài liệu ôn tập chuyên sâu: ${problemIR.topic}`,
      key_takeaways: [
        `Dạng toán trọng tâm: ${problemIR.topic} (${problemIR.domain})`,
        `Phương pháp giải quyết: ${solution.section_2_approach.strategy_overview}`,
        `Kết quả cần nhớ: ${solution.final_answer.value}`,
        `Các cạm bẫy cần tránh: ${solution.section_1_analysis.pitfalls_and_traps.join("; ")}`,
      ],
      audio_podcast_script: [
        {
          speaker: "Teacher",
          dialogue: `Chào em, hôm nay chúng ta cùng mổ xẻ bài toán "${problemIR.topic}". Điểm then chốt ở đây là nhận diện đúng giả thiết.`,
        },
        {
          speaker: "Student",
          dialogue: `Thưa thầy, khi gặp bài này, em hay bị nhầm lẫn ở bước biến đổi công thức. Thầy có mẹo nào không ạ?`,
        },
        {
          speaker: "Teacher",
          dialogue: `Rất hay! Em chỉ cần nhớ định lý then chốt: ${solution.section_1_analysis.core_theorems[0] || 'công thức nền tảng'} và kiểm tra lại điều kiện tập xác định trước khi kết luận nhé!`,
        },
      ],
      suggested_flashcards: [
        {
          front: `Công thức then chốt trong dạng bài "${problemIR.topic}" là gì?`,
          back: solution.section_2_approach.formulas_needed.join(", ") || solution.final_answer.latex,
        },
        {
          front: `Lỗi sai học sinh phổ biến nhất khi giải "${problemIR.topic}"?`,
          back: solution.section_1_analysis.pitfalls_and_traps[0] || "Quên xét điều kiện biên",
        },
      ],
    };
  }

  getOpenClawStatus(): OpenClawAgentTask {
    return {
      taskId: `claw_${Date.now()}`,
      agentName: "OpenClaw-MathWorker-v1",
      status: "COMPLETED",
      actions: [
        "Verified LaTeX AST integrity",
        "Checked math invariants via algebraic solver",
        "Validated Manim scene compilation DAG",
      ],
    };
  }
}
