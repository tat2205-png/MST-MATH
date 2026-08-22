import { execFile } from "child_process";
import { promisify } from "util";
import {
  RepairChange,
  RepairPatchProposal,
  FrameQAIssue,
} from "../../src/types/localRender.js";
import { geminiProvider } from "../providers/index.js";

const execFileAsync = promisify(execFile);

export interface OpenClawConnectionStatus {
  gatewayAvailable: boolean;
  cliAvailable: boolean;
  status: "ACTIVE" | "UNAVAILABLE";
  version?: string;
  error?: string;
}

export class OpenClawClient {
  private gatewayUrl: string;
  private authToken?: string;

  constructor(options?: { gatewayUrl?: string; authToken?: string }) {
    this.gatewayUrl = options?.gatewayUrl || process.env.OPENCLAW_URL || "http://127.0.0.1:18789";
    this.authToken = options?.authToken || process.env.OPENCLAW_TOKEN || process.env.OPENCLAW_PASSWORD;
  }

  /**
   * Checks connectivity to local OpenClaw Gateway (HTTP) or CLI binary
   */
  public async checkConnection(): Promise<OpenClawConnectionStatus> {
    let gatewayAvailable = false;
    let cliAvailable = false;
    let version: string | undefined;
    let error: string | undefined;

    // 1. Check HTTP Gateway at 127.0.0.1:18789
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.gatewayUrl}/health`, {
        method: "GET",
        headers,
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && (res.ok || res.status === 401 || res.status === 404)) {
        gatewayAvailable = true;
        const data = await res.json().catch(() => ({}));
        version = data.version || "1.0.0";
      }
    } catch (err: any) {
      error = err.message;
    }

    // 2. Check CLI Fallback using safe execFile (no shell: true)
    if (!gatewayAvailable) {
      try {
        const { stdout } = await execFileAsync("openclaw", ["--version"], {
          timeout: 2000,
        });
        if (stdout) {
          cliAvailable = true;
          version = stdout.trim();
        }
      } catch {
        // CLI not installed or not in PATH
      }
    }

    const isAvailable = gatewayAvailable || cliAvailable;

    return {
      gatewayAvailable,
      cliAvailable,
      status: isAvailable ? "ACTIVE" : "UNAVAILABLE",
      version,
      error: isAvailable ? undefined : error || "OpenClaw Gateway/CLI not found on localhost",
    };
  }

  /**
   * Request a structured patch proposal from OpenClaw for SAFE layout/camera issues.
   * Strictly enforces prompt rules:
   * - YOU ARE A PATCH PROPOSER.
   * - You may ONLY repair presentation/layout/camera/timing problems.
   * - You MUST NOT modify mathematics, verified geometry, GraphSpec, coordinates, formulas.
   */
  public async proposePatch(params: {
    sceneName: string;
    files: Array<{ path: string; content: string }>;
    issues: FrameQAIssue[];
    frameQAEvidence?: string;
    renderLogs?: string[];
    immutableLocks?: {
      problemText?: string;
      formulas?: string[];
      geometryFacts?: string[];
      graphSpec?: any;
    };
  }): Promise<RepairPatchProposal> {
    const { sceneName, files, issues, frameQAEvidence, renderLogs, immutableLocks } = params;

    // Filter to SAFE issues only
    const safeIssues = issues.filter(
      (iss) =>
        iss.repairClass === "SAFE_AUTO_REPAIR" &&
        (iss.category === "LAYOUT_ERROR" ||
          iss.category === "CAMERA_ERROR" ||
          iss.category === "TEXT_ERROR" ||
          iss.category === "ASSET_ERROR")
    );

    if (safeIssues.length === 0) {
      return {
        status: "REVIEW_REQUIRED",
        reason: "No SAFE_AUTO_REPAIR issues present. All issues require human review.",
        changes: [],
      };
    }

    const prompt = `YOU ARE A PATCH PROPOSER FOR MANIM PYTHON SCENES.

You may ONLY repair presentation/layout/camera/timing problems.
You MUST NOT modify:
- mathematics
- verified geometry
- GraphSpec
- coordinates
- formulas
- labels that encode mathematical facts

SCENE NAME: ${sceneName}

SOURCE FILES:
${files.map((f) => `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE ---`).join("\n\n")}

SAFE ISSUES DETECTED:
${JSON.stringify(safeIssues, null, 2)}

EVIDENCE:
${frameQAEvidence || "Visual frame inspection detected elements overlapping or clipping."}

IMMUTABLE MATHEMATICAL LOCKS (NEVER ALTER THESE):
- Problem: ${immutableLocks?.problemText || "Verified Math"}
- Formulas: ${JSON.stringify(immutableLocks?.formulas || [])}
- Geometry Facts: ${JSON.stringify(immutableLocks?.geometryFacts || [])}

INSTRUCTIONS FOR REPAIR:
1. Provide a surgical diff replacing only layout/spacing methods (e.g. next_to, shift, arrange, buff, scale, font_size, camera frame center, camera frame width).
2. DO NOT change any text inside MathTex or change any equation numbers.
3. Keep changes minimal and targeted.
4. Return ONLY valid JSON conforming to the schema below.

JSON OUTPUT SCHEMA:
{
  "status": "PATCH_PROPOSED",
  "reason": "Clear explanation of why this patch fixes the visual issue without altering math",
  "changes": [
    {
      "file": "main.py",
      "operation": "replace_range",
      "oldText": "exact text in source file to replace",
      "newText": "replacement text",
      "category": "LAYOUT_ERROR"
    }
  ]
}`;

    const schemaDescription = `{
  "status": "PATCH_PROPOSED" | "PATCH_REJECTED" | "NO_PATCH",
  "reason": string,
  "changes": Array<{
    "file": string,
    "operation": "replace_range" | "replace_all" | "insert_after" | "insert_before",
    "oldText": string,
    "newText": string,
    "category": "LAYOUT_ERROR" | "CAMERA_ERROR" | "TEXT_ERROR" | "ASSET_ERROR"
  }>
}`;

    // 1. Try OpenClaw Gateway first if active
    const conn = await this.checkConnection();
    if (conn.gatewayAvailable) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        if (this.authToken) {
          headers["Authorization"] = `Bearer ${this.authToken}`;
        }

        const gatewayRes = await fetch(`${this.gatewayUrl}/v1/responses`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "openclaw-patch-engine",
            prompt,
            temperature: 0.1,
          }),
        });

        if (gatewayRes.ok) {
          const gatewayData = await gatewayRes.json();
          if (gatewayData?.changes && Array.isArray(gatewayData.changes)) {
            return this.normalizePatchResponse(gatewayData);
          }
        }
      } catch (err: any) {
        console.warn("[OpenClawClient] Gateway call failed, attempting fallback:", err.message);
      }
    }

    // 2. Try OpenClaw CLI if available
    if (conn.cliAvailable) {
      try {
        const { stdout } = await execFileAsync("openclaw", [
          "infer",
          "model",
          "run",
          "--prompt",
          prompt,
          "--json",
        ], { timeout: 15000 });

        const parsed = JSON.parse(stdout);
        if (parsed?.changes && Array.isArray(parsed.changes)) {
          return this.normalizePatchResponse(parsed);
        }
      } catch (err: any) {
        console.warn("[OpenClawClient] CLI invocation failed:", err.message);
      }
    }

    // 3. Delegation to Gemini Patch Engine (as verified server-side assistant)
    try {
      const parsed = await geminiProvider.generateStructuredJSON<any>(prompt, schemaDescription, {
        temperature: 0.1,
      });

      return this.normalizePatchResponse(parsed);
    } catch (err: any) {
      console.error("[OpenClawClient] Patch proposal generation failed:", err.message);
      return {
        status: "PATCH_REJECTED",
        reason: `Failed to generate patch: ${err.message}`,
        changes: [],
      };
    }
  }

  private normalizePatchResponse(raw: any): RepairPatchProposal {
    const rawChanges: any[] = Array.isArray(raw?.changes) ? raw.changes : [];
    const validCategories = ["LAYOUT_ERROR", "CAMERA_ERROR", "TEXT_ERROR", "ASSET_ERROR"];

    const normalizedChanges: RepairChange[] = rawChanges.map((c) => ({
      file: typeof c.file === "string" ? c.file.replace(/^[/\\]+/, "") : "main.py",
      operation: c.operation || "replace_range",
      oldText: String(c.oldText || ""),
      newText: String(c.newText || ""),
      category: validCategories.includes(c.category) ? c.category : "LAYOUT_ERROR",
    }));

    return {
      status: raw?.status === "PATCH_PROPOSED" && normalizedChanges.length > 0 ? "PATCH_PROPOSED" : "NO_PATCH",
      reason: raw?.reason || "Proposed layout adjustment",
      changes: normalizedChanges,
    };
  }
}

export const openClawClient = new OpenClawClient();
