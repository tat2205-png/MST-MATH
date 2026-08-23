export type CapabilityStatus = "AVAILABLE" | "NOT_AVAILABLE" | "NOT_TESTED";

export type CapabilityId =
  | "node"
  | "npm"
  | "python"
  | "ffmpeg"
  | "manim"
  | "gpu"
  | "cuda"
  | "blender"
  | `model:${string}`;

export interface ProcessRequest {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
  readonly shell: false;
}

export interface ProcessResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
}

export interface ProcessRunner {
  run(request: ProcessRequest): ProcessResult | Promise<ProcessResult>;
}

export interface ProbeEvidence {
  readonly command: string;
  readonly args: readonly string[];
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
}

export interface CapabilityResult {
  readonly id: CapabilityId;
  readonly status: CapabilityStatus;
  readonly summary: string;
  readonly version?: string;
  readonly evidence: readonly ProbeEvidence[];
}

export interface RuntimeDiscoveryReport {
  readonly contractVersion: 1;
  readonly readOnly: true;
  readonly isolatedEnvironment: true;
  readonly capabilities: readonly CapabilityResult[];
}

export interface RuntimeDiscoveryOptions {
  readonly cwd?: string;
  readonly timeoutMs?: number;
  readonly runner?: ProcessRunner;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly testOptionalModels?: boolean;
  readonly optionalModelStacks?: readonly string[];
  readonly platform?: NodeJS.Platform;
  readonly nodeExecutable?: string;
}
