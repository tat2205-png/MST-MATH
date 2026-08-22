import {
  buildActiveSkillContext,
  VideoTaskMode,
} from "./skillRouter.js";
import { loadSkillCore } from "./skillLoader.js";

export interface SkillContextRequest {
  mode: VideoTaskMode;
  taskInstruction?: string;
  coreAppInstruction?: string;
}

export interface SkillContextResponse {
  mode: VideoTaskMode;
  skillName: string;
  activeModules: string[];
  systemInstruction: string;
  skillDebug: {
    enabled: boolean;
    skillName: string;
    mode: VideoTaskMode;
    activeModules: string[];
  };
}

const DEFAULT_CORE_APP_INSTRUCTION = `You are the core intelligence engine for MATH AI VIDEO STUDIO (Hệ thống Trợ lý Video Bài giảng Toán học THPT).
Ensure absolute mathematical correctness, pedagogical clarity, zero-inference geometric fidelity, and strict schema compliance at all times.`;

/**
 * Builds a structured, server-side system instruction combining core app rules and active skill modules
 */
export async function buildSystemSkillInstruction(
  request: SkillContextRequest
): Promise<SkillContextResponse> {
  try {
    const activeContext = await buildActiveSkillContext(request.mode);

    // Build Active Modules section
    const moduleSections: string[] = [];
    for (const [moduleName, moduleContent] of Object.entries(activeContext.references)) {
      if (moduleContent && moduleContent.trim().length > 0) {
        moduleSections.push(`### MODULE: ${moduleName}\n${moduleContent.trim()}`);
      }
    }

    // Check for specialized prompt additions based on task mode
    let specializedPromptText = "";
    if (
      request.mode === "MANIM_VIDEO_CREATE" ||
      request.mode === "MANIM_VIDEO_REPAIR" ||
      request.mode === "VIDEO_QA"
    ) {
      try {
        const fullSkill = await loadSkillCore(activeContext.skillName);
        if (request.mode === "MANIM_VIDEO_CREATE") {
          const createPrompt = fullSkill.prompts["CREATE_NEW_VIDEO"];
          if (createPrompt && createPrompt.trim().length > 0) {
            specializedPromptText = `\n\n### CREATION DIRECTIVE:\n${createPrompt.trim()}`;
          }
        } else {
          const auditPrompt = fullSkill.prompts["AUDIT_VIDEO"];
          if (auditPrompt && auditPrompt.trim().length > 0) {
            specializedPromptText = `\n\n### AUDIT DIRECTIVE:\n${auditPrompt.trim()}`;
          }
        }
      } catch {
        // Prompts are optional, continue safely
      }
    }

    const coreAppText = request.coreAppInstruction?.trim() || DEFAULT_CORE_APP_INSTRUCTION;
    const taskRulesText = (request.taskInstruction || "").trim() + specializedPromptText;

    const sections: string[] = [
      `[MATH AI VIDEO STUDIO CORE]\n\n${coreAppText}`,
      `[ACTIVE SKILL]\n\nSkill:\n${activeContext.skillName}\n\nMode:\n${request.mode}`,
      `[SKILL CORE]\n\n${activeContext.coreInstruction.trim()}`,
    ];

    if (moduleSections.length > 0) {
      sections.push(`[ACTIVE MODULES]\n\n${moduleSections.join("\n\n---\n\n")}`);
    }

    if (taskRulesText.trim().length > 0) {
      sections.push(`[TASK RULES]\n\n${taskRulesText.trim()}`);
    }

    const systemInstruction = sections.join("\n\n==================================================\n\n");

    return {
      mode: request.mode,
      skillName: activeContext.skillName,
      activeModules: activeContext.activeModules,
      systemInstruction,
      skillDebug: {
        enabled: true,
        skillName: activeContext.skillName,
        mode: request.mode,
        activeModules: activeContext.activeModules,
      },
    };
  } catch (err: any) {
    throw new Error(`SKILL_CONTEXT_ERROR: ${err.message}`);
  }
}
