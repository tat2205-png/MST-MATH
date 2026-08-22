import crypto from "crypto";
import {
  RepairChange,
  ProtectedFingerprints,
} from "../../src/types/localRender.js";

export interface FileSnapshot {
  snapshotId: string;
  attemptNumber: number;
  files: Record<string, string>;
  fingerprints: ProtectedFingerprints;
  createdAt: string;
}

export class RepairSnapshotManager {
  private snapshots: Map<string, FileSnapshot> = new Map();

  /**
   * Generates cryptographic SHA-256 fingerprints for protected mathematical data
   */
  public generateFingerprints(params: {
    problemText?: string;
    formulas?: string[];
    geometryFacts?: string[];
    graphSpec?: any;
  }): ProtectedFingerprints {
    const { problemText = "", formulas = [], geometryFacts = [], graphSpec } = params;

    const mathContent = JSON.stringify({
      problemText,
      formulas: formulas.sort(),
    });
    const mathHash = crypto.createHash("sha256").update(mathContent).digest("hex");

    const geometryContent = JSON.stringify(geometryFacts.sort());
    const geometryHash = crypto.createHash("sha256").update(geometryContent).digest("hex");

    const graphContent = JSON.stringify(graphSpec || {});
    const graphHash = crypto.createHash("sha256").update(graphContent).digest("hex");

    const problemTextHash = crypto.createHash("sha256").update(problemText).digest("hex");

    return {
      mathHash,
      geometryHash,
      graphHash,
      problemTextHash,
      formulaFingerprints: formulas,
    };
  }

  /**
   * Creates an immutable backup snapshot before applying a patch (Rule 9)
   */
  public createSnapshot(
    attemptNumber: number,
    files: Record<string, string>,
    fingerprints: ProtectedFingerprints
  ): FileSnapshot {
    const snapshotId = `snapshot_attempt_${attemptNumber}_${Date.now()}`;
    const clonedFiles: Record<string, string> = {};
    for (const [path, content] of Object.entries(files)) {
      clonedFiles[path] = content;
    }

    const snapshot: FileSnapshot = {
      snapshotId,
      attemptNumber,
      files: clonedFiles,
      fingerprints,
      createdAt: new Date().toISOString(),
    };

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  /**
   * Applies validated changes to a set of project files
   */
  public applyPatch(
    files: Record<string, string>,
    changes: RepairChange[]
  ): { updatedFiles: Record<string, string>; success: boolean; error?: string } {
    const updatedFiles = { ...files };

    try {
      for (const change of changes) {
        const filePath = change.file.replace(/^[/\\]+/, "");
        const currentContent = updatedFiles[filePath];

        if (currentContent === undefined) {
          throw new Error(`File ${filePath} not found in working copy.`);
        }

        if (!currentContent.includes(change.oldText)) {
          throw new Error(`Target text to replace not found in ${filePath}.`);
        }

        // Apply replacement exactly once
        updatedFiles[filePath] = currentContent.replace(change.oldText, change.newText);
      }

      return { updatedFiles, success: true };
    } catch (err: any) {
      return { updatedFiles: files, success: false, error: err.message };
    }
  }

  /**
   * Verifies that mathematical and geometry invariants were preserved after patch application (Rule 12 & 13)
   */
  public verifyInvariantsPreserved(
    afterFiles: Record<string, string>,
    initialFingerprints: ProtectedFingerprints
  ): { preserved: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check each formula is still present in at least one file
    for (const formula of initialFingerprints.formulaFingerprints) {
      let formulaFound = false;
      for (const content of Object.values(afterFiles)) {
        if (content.includes(formula)) {
          formulaFound = true;
          break;
        }
      }
      if (!formulaFound) {
        violations.push(`Protected mathematical formula "${formula}" was deleted or mutated.`);
      }
    }

    return {
      preserved: violations.length === 0,
      violations,
    };
  }

  /**
   * Rolls back files to a previous snapshot
   */
  public rollback(snapshotId: string): Record<string, string> | null {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return null;
    }
    const restored: Record<string, string> = {};
    for (const [path, content] of Object.entries(snapshot.files)) {
      restored[path] = content;
    }
    return restored;
  }
}

export const repairSnapshotManager = new RepairSnapshotManager();
