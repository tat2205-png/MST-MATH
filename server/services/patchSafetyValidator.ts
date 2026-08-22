import {
  RepairChange,
  validateManifestPath,
  ProtectedFingerprints,
} from "../../src/types/localRender.js";

export interface PatchValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  safeToApply: boolean;
}

export class PatchSafetyValidator {
  private static FORBIDDEN_TOKENS = [
    "subprocess",
    "os.system",
    "os.popen",
    "os.remove",
    "os.unlink",
    "os.rmdir",
    "shutil.rmtree",
    "shutil.move",
    "eval(",
    "exec(",
    "__import__",
    "compile(",
    "globals()",
    "locals()",
    "socket",
    "urllib",
    "requests",
    "http.client",
    "aiohttp",
    "httpx",
    "open(",
    "write(",
    "delete",
    "sys.exit",
  ];

  /**
   * Validates a batch of proposed patch changes against strict safety boundaries (Rule 8)
   */
  public validatePatch(params: {
    changes: RepairChange[];
    projectFiles: Record<string, string>;
    allowedScopeFiles?: string[];
    protectedFingerprints?: ProtectedFingerprints;
  }): PatchValidationResult {
    const { changes, projectFiles, allowedScopeFiles, protectedFingerprints } = params;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!changes || changes.length === 0) {
      return {
        valid: false,
        errors: ["Patch proposal contains no changes."],
        warnings: [],
        safeToApply: false,
      };
    }

    // Check 1: Max changes per attempt limit
    if (changes.length > 10) {
      errors.push(`Patch contains too many changes (${changes.length}). Max allowed is 10.`);
    }

    for (let idx = 0; idx < changes.length; idx++) {
      const change = changes[idx];
      const prefix = `Change #${idx + 1} (${change.file})`;

      // 1. Path Security Validation (Rule 7 & 8.1)
      const pathCheck = validateManifestPath(change.file);
      if (!pathCheck.valid) {
        errors.push(`${prefix}: ${pathCheck.error}`);
        continue;
      }

      // Check for path traversal or drive/UNC markers
      if (
        change.file.includes("..") ||
        change.file.startsWith("/") ||
        change.file.startsWith("\\") ||
        /^[a-zA-Z]:/.test(change.file)
      ) {
        errors.push(`${prefix}: Path contains forbidden traversal or absolute path prefix.`);
        continue;
      }

      // 2. File must belong to project and repair scope (Rule 8.2)
      const normalizedPath = change.file.replace(/\\/g, "/");
      const fileContent = projectFiles[normalizedPath] || projectFiles[change.file];

      if (fileContent === undefined) {
        errors.push(`${prefix}: Target file does not exist in project manifest.`);
        continue;
      }

      if (allowedScopeFiles && allowedScopeFiles.length > 0) {
        const isAllowed = allowedScopeFiles.some(
          (f) => f === normalizedPath || f === change.file || f.endsWith(normalizedPath)
        );
        if (!isAllowed) {
          errors.push(`${prefix}: File "${change.file}" is outside the allowed repair scope.`);
          continue;
        }
      }

      // 3. oldText must exist and match exactly once (Rule 8.3)
      if (!change.oldText || change.oldText.trim() === "") {
        errors.push(`${prefix}: oldText cannot be empty.`);
        continue;
      }

      const occurrences = (fileContent.match(new RegExp(this.escapeRegExp(change.oldText), "g")) || []).length;
      if (occurrences === 0) {
        errors.push(`${prefix}: oldText was not found in target file.`);
      } else if (occurrences > 1) {
        errors.push(`${prefix}: oldText matches multiple times (${occurrences} occurrences). Replacement must be unambiguous.`);
      }

      // 4. Check for forbidden security tokens (Rule 8.5, 8.6, 8.7, 8.8)
      const lowerNewText = change.newText.toLowerCase();
      for (const token of PatchSafetyValidator.FORBIDDEN_TOKENS) {
        if (lowerNewText.includes(token.toLowerCase())) {
          errors.push(`${prefix}: newText contains forbidden security token "${token}".`);
        }
      }

      // 5. Check if change modifies protected formulas or math facts (Rule 8.4, 8.9)
      if (protectedFingerprints?.formulaFingerprints) {
        for (const formula of protectedFingerprints.formulaFingerprints) {
          // If oldText contains the formula but newText removes or mutates it
          if (change.oldText.includes(formula) && !change.newText.includes(formula)) {
            errors.push(`${prefix}: Proposed change mutates protected mathematical formula "${formula}".`);
          }
        }
      }

      // 6. Diff size limit (Rule 8.10)
      const diffLength = Math.abs(change.newText.length - change.oldText.length) + change.newText.length;
      if (diffLength > 2000) {
        errors.push(`${prefix}: Diff size too large (${diffLength} chars). Max allowed per change is 2000.`);
      }
    }

    const valid = errors.length === 0;

    return {
      valid,
      errors,
      warnings,
      safeToApply: valid,
    };
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

export const patchSafetyValidator = new PatchSafetyValidator();
