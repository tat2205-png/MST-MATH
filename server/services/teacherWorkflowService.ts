import path from "node:path";
import { TeacherWorkflowService as CoreTeacherWorkflowService } from "./teacherWorkflowCoreService.js";
import { buildDemoRc1P01FromCanonical } from "./demoRc1P01Service.js";

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
    const canonicalDocument = this.lastCanonicalDocument;
    if (!canonicalDocument) throw new Error("CANONICAL_DOCUMENT_UNAVAILABLE");
    const p01 = buildDemoRc1P01FromCanonical(
      canonicalDocument,
      path.join(process.cwd(), "render_output", "teacher-workflow", "p01"),
      result.diagnostics,
    );

    return {
      ...result,
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
