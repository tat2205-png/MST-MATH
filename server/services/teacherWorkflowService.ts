import path from "node:path";
import { TeacherWorkflowService as CoreTeacherWorkflowService } from "./teacherWorkflowCoreService.js";
import { buildDemoRc1P01 } from "./demoRc1P01Service.js";

/**
 * Consolidated teacher workflow boundary.
 *
 * The convergence-v1 teacher workflow remains the Core authority. This adapter
 * adds the accepted RC1 P01 source-backed review path without replacing Core
 * Word preflight, Question Bank, readiness, approval, or export behavior.
 */
export class TeacherWorkflowService extends CoreTeacherWorkflowService {
  override async importDocxForRuntime(base64: string, fileName: string) {
    const result = await super.importDocxForRuntime(base64, fileName);
    const bytes = new Uint8Array(Buffer.from(base64, "base64"));
    const p01 = await buildDemoRc1P01(
      path.basename(fileName),
      bytes,
      path.join(process.cwd(), "render_output", "teacher-workflow", "p01"),
    );

    const diagnostics = [...result.diagnostics];
    if (p01.status !== "PASS") {
      diagnostics.push({
        code: "P01_REVIEW_REQUIRED",
        severity: "WARNING",
        details: {
          status: p01.status,
          sourceHash: p01.sourceHash,
          diagnostics: p01.diagnostics,
        },
      });
    }

    return {
      ...result,
      diagnostics,
      p01: {
        status: p01.status,
        sourceHash: p01.sourceHash,
        diagnostics: p01.diagnostics,
        qaState: p01.qa?.state,
        mathQAStatus: p01.mathQA?.status,
        artifactFormats: p01.artifacts?.map((artifact) => artifact.format),
      },
    };
  }
}
