import { spawnSync } from "node:child_process";
import process from "node:process";
import type {
  CapabilityId,
  CapabilityResult,
  ProbeEvidence,
  ProcessRequest,
  ProcessResult,
  ProcessRunner,
  RuntimeDiscoveryOptions,
  RuntimeDiscoveryReport,
} from "./types.ts";

export * from "./types.ts";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MODEL_STACKS = ["torch", "tensorflow", "onnxruntime", "transformers", "diffusers"] as const;
const ENVIRONMENT_ALLOWLIST = [
  "PATH",
  "Path",
  "PATHEXT",
  "SYSTEMROOT",
  "SystemRoot",
  "WINDIR",
  "TEMP",
  "TMP",
  "COMSPEC",
] as const;

function nonEmpty(value: string, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
  return value;
}

function cleanOutput(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

export function createIsolatedEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
  additions: Readonly<Record<string, string | undefined>> = {},
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const key of ENVIRONMENT_ALLOWLIST) {
    const value = source[key];
    if (typeof value === "string") result[key] = value;
  }
  for (const [key, value] of Object.entries(additions)) {
    if (typeof value === "string") result[key] = value;
  }
  return Object.freeze({ ...result });
}

export const systemProcessRunner: ProcessRunner = Object.freeze({
  run(request: ProcessRequest): ProcessResult {
    const result = spawnSync(request.command, [...request.args], {
      cwd: request.cwd,
      env: { ...request.env },
      encoding: "utf8",
      timeout: request.timeoutMs,
      windowsHide: true,
      shell: false,
    });
    return Object.freeze({
      exitCode: result.status,
      stdout: cleanOutput(result.stdout ?? ""),
      stderr: cleanOutput(result.stderr ?? ""),
      ...(result.error === undefined ? {} : { error: result.error.message }),
    });
  },
});

interface ProbeContext {
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
  readonly runner: ProcessRunner;
}

interface CommandSpec {
  readonly command: string;
  readonly args: readonly string[];
}

async function execute(context: ProbeContext, spec: CommandSpec): Promise<ProbeEvidence> {
  try {
    const result = await context.runner.run(Object.freeze({
      command: spec.command,
      args: Object.freeze([...spec.args]),
      cwd: context.cwd,
      env: context.env,
      timeoutMs: context.timeoutMs,
      shell: false as const,
    }));
    return Object.freeze({
      command: spec.command,
      args: Object.freeze([...spec.args]),
      exitCode: result.exitCode,
      stdout: cleanOutput(result.stdout),
      stderr: cleanOutput(result.stderr),
      ...(result.error === undefined ? {} : { error: result.error }),
    });
  } catch (error) {
    return Object.freeze({
      command: spec.command,
      args: Object.freeze([...spec.args]),
      exitCode: null,
      stdout: "",
      stderr: "",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function result(
  id: CapabilityId,
  status: CapabilityResult["status"],
  summary: string,
  evidence: readonly ProbeEvidence[],
  version?: string,
): CapabilityResult {
  return Object.freeze({
    id,
    status,
    summary,
    ...(version === undefined ? {} : { version }),
    evidence: Object.freeze([...evidence]),
  });
}

function evidenceText(evidence: ProbeEvidence): string {
  return [evidence.stdout, evidence.stderr].filter(Boolean).join("\n");
}

function firstLine(value: string): string | undefined {
  const line = value.split("\n").map((item) => item.trim()).find(Boolean);
  return line || undefined;
}

async function probeCandidates(
  context: ProbeContext,
  id: CapabilityId,
  candidates: readonly CommandSpec[],
): Promise<CapabilityResult> {
  const evidence: ProbeEvidence[] = [];
  for (const candidate of candidates) {
    const attempt = await execute(context, candidate);
    evidence.push(attempt);
    if (attempt.exitCode === 0) {
      const version = firstLine(evidenceText(attempt));
      return result(id, "AVAILABLE", `${id} probe completed successfully.`, evidence, version);
    }
  }
  return result(id, "NOT_AVAILABLE", `${id} could not be executed successfully.`, evidence);
}

function pythonCandidates(platform: NodeJS.Platform): readonly CommandSpec[] {
  return platform === "win32"
    ? [
        { command: "python", args: ["--version"] },
        { command: "py", args: ["-3", "--version"] },
      ]
    : [
        { command: "python3", args: ["--version"] },
        { command: "python", args: ["--version"] },
      ];
}

function selectedPython(resultValue: CapabilityResult): CommandSpec | undefined {
  const successful = resultValue.evidence.find((item) => item.exitCode === 0);
  if (successful === undefined) return undefined;
  const prefix = successful.command === "py" ? ["-3"] : [];
  return { command: successful.command, args: prefix };
}

async function probePythonModule(
  context: ProbeContext,
  id: CapabilityId,
  python: CommandSpec | undefined,
  moduleName: string,
  displayName: string,
): Promise<CapabilityResult> {
  if (python === undefined) {
    return result(id, "NOT_TESTED", `${displayName} was not tested because Python is unavailable.`, []);
  }
  const script = "import importlib.util,sys;sys.exit(0 if importlib.util.find_spec(sys.argv[1]) else 3)";
  const evidence = await execute(context, {
    command: python.command,
    args: [...python.args, "-I", "-c", script, moduleName],
  });
  if (evidence.exitCode === 0) {
    return result(id, "AVAILABLE", `${displayName} module is import-discoverable.`, [evidence]);
  }
  if (evidence.exitCode === 3) {
    return result(id, "NOT_AVAILABLE", `${displayName} module is not installed in the isolated Python environment.`, [evidence]);
  }
  return result(id, "NOT_TESTED", `${displayName} module discovery could not complete.`, [evidence]);
}

export async function discoverRuntimeCapabilities(
  options: RuntimeDiscoveryOptions = {},
): Promise<RuntimeDiscoveryReport> {
  const platform = options.platform ?? process.platform;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("Runtime discovery timeout must be a positive safe integer.");
  }
  const cwd = options.cwd ?? process.cwd();
  nonEmpty(cwd, "Runtime discovery working directory");
  const context: ProbeContext = Object.freeze({
    cwd,
    timeoutMs,
    runner: options.runner ?? systemProcessRunner,
    env: createIsolatedEnvironment(options.environment ?? process.env, {
      PYTHONNOUSERSITE: "1",
      PYTHONDONTWRITEBYTECODE: "1",
      PIP_DISABLE_PIP_VERSION_CHECK: "1",
      PIP_NO_INPUT: "1",
    }),
  });

  const node = await probeCandidates(context, "node", [
    { command: options.nodeExecutable ?? process.execPath, args: ["--version"] },
  ]);
  const npm = await probeCandidates(context, "npm", [
    { command: platform === "win32" ? "npm.cmd" : "npm", args: ["--version"] },
  ]);
  const python = await probeCandidates(context, "python", pythonCandidates(platform));
  const pythonCommand = selectedPython(python);
  const ffmpeg = await probeCandidates(context, "ffmpeg", [
    { command: platform === "win32" ? "ffmpeg.exe" : "ffmpeg", args: ["-version"] },
  ]);
  const manim = await probePythonModule(context, "manim", pythonCommand, "manim", "Manim");
  const gpu = await probeCandidates(context, "gpu", [
    { command: platform === "win32" ? "nvidia-smi.exe" : "nvidia-smi", args: ["--query-gpu=name,driver_version", "--format=csv,noheader"] },
  ]);
  const cuda = await probeCandidates(context, "cuda", [
    { command: platform === "win32" ? "nvcc.exe" : "nvcc", args: ["--version"] },
  ]);
  const blender = await probeCandidates(context, "blender", [
    { command: platform === "win32" ? "blender.exe" : "blender", args: ["--version"] },
  ]);

  const capabilities: CapabilityResult[] = [node, npm, python, ffmpeg, manim, gpu, cuda, blender];
  const stacks = options.optionalModelStacks ?? DEFAULT_MODEL_STACKS;
  const seen = new Set<string>();
  for (const stack of stacks) {
    nonEmpty(stack, "Optional model stack name");
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(stack)) {
      throw new TypeError(`Optional model stack ${stack} must be a valid Python module name.`);
    }
    if (seen.has(stack)) throw new TypeError(`Optional model stack ${stack} is duplicated.`);
    seen.add(stack);
    if (options.testOptionalModels === false) {
      capabilities.push(result(`model:${stack}`, "NOT_TESTED", `${stack} was explicitly excluded from discovery.`, []));
    } else {
      capabilities.push(await probePythonModule(context, `model:${stack}`, pythonCommand, stack, stack));
    }
  }

  return Object.freeze({
    contractVersion: 1 as const,
    readOnly: true as const,
    isolatedEnvironment: true as const,
    capabilities: Object.freeze(capabilities),
  });
}
