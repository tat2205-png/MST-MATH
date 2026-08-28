import assert from "node:assert/strict";
import {
  createIsolatedEnvironment,
  discoverRuntimeCapabilities,
  type ProcessRequest,
  type ProcessResult,
  type ProcessRunner,
} from "../../runtime/discovery/index.ts";

class FakeRunner implements ProcessRunner {
  readonly requests: ProcessRequest[] = [];

  constructor(private readonly respond: (request: ProcessRequest) => ProcessResult) {}

  run(request: ProcessRequest): ProcessResult {
    this.requests.push(request);
    return this.respond(request);
  }
}

const isolated = createIsolatedEnvironment(
  { PATH: "tools", SECRET_TOKEN: "must-not-leak", TEMP: "temp" },
  { PYTHONNOUSERSITE: "1", OMITTED: undefined },
);
assert.deepEqual(isolated, {
  PATH: "tools",
  TEMP: "temp",
  PYTHONNOUSERSITE: "1",
});
assert.equal(Object.isFrozen(isolated), true);

const runner = new FakeRunner((request) => {
  assert.equal(request.shell, false, "every child process must explicitly disable the shell");
  assert.equal(request.cwd, "C:\\runtime-fixture");
  assert.equal(request.timeoutMs, 1234);
  assert.equal(request.env.SECRET_TOKEN, undefined);
  assert.equal(request.env.PYTHONNOUSERSITE, "1");
  assert.equal(request.env.PYTHONDONTWRITEBYTECODE, "1");

  if (request.command === "node-fixture") {
    return { exitCode: 0, stdout: "v22.1.0\r\n", stderr: "" };
  }
  if (request.command === "npm.cmd") {
    return { exitCode: 0, stdout: "10.8.0", stderr: "" };
  }
  if (request.command === "python") {
    if (request.args[0] === "--version") {
      return { exitCode: 0, stdout: "", stderr: "Python 3.12.4" };
    }
    const moduleName = request.args.at(-1);
    if (moduleName === "manim" || moduleName === "torch") {
      return { exitCode: 0, stdout: "", stderr: "" };
    }
    return { exitCode: 3, stdout: "", stderr: "" };
  }
  if (request.command === "ffmpeg.exe") {
    return { exitCode: 1, stdout: "", stderr: "not found", error: "ENOENT" };
  }
  if (request.command === "nvidia-smi.exe") {
    return { exitCode: 0, stdout: "Fixture GPU, 555.1", stderr: "" };
  }
  if (request.command === "nvcc.exe") {
    return { exitCode: null, stdout: "", stderr: "", error: "ENOENT" };
  }
  if (request.command === "blender.exe") {
    return { exitCode: 0, stdout: "Blender 4.2.0\nextra", stderr: "" };
  }
  throw new Error(`Unexpected command: ${request.command}`);
});

const report = await discoverRuntimeCapabilities({
  cwd: "C:\\runtime-fixture",
  timeoutMs: 1234,
  runner,
  environment: { PATH: "fixture-path", SECRET_TOKEN: "private" },
  platform: "win32",
  nodeExecutable: "node-fixture",
  optionalModelStacks: ["torch", "tensorflow"],
});

assert.equal(report.contractVersion, 1);
assert.equal(report.readOnly, true);
assert.equal(report.isolatedEnvironment, true);
assert.equal(Object.isFrozen(report), true);
assert.equal(Object.isFrozen(report.capabilities), true);

const byId = new Map(report.capabilities.map((capability) => [capability.id, capability]));
assert.equal(byId.get("node")?.status, "AVAILABLE");
assert.equal(byId.get("node")?.version, "v22.1.0");
assert.equal(byId.get("npm")?.status, "AVAILABLE");
assert.equal(byId.get("python")?.version, "Python 3.12.4");
assert.equal(byId.get("ffmpeg")?.status, "NOT_AVAILABLE");
assert.equal(byId.get("ffmpeg")?.evidence[0]?.error, "ENOENT");
assert.equal(byId.get("manim")?.status, "AVAILABLE");
assert.equal(byId.get("gpu")?.status, "AVAILABLE");
assert.equal(byId.get("cuda")?.status, "NOT_AVAILABLE");
assert.equal(byId.get("blender")?.status, "AVAILABLE");
assert.equal(byId.get("blender")?.version, "Blender 4.2.0");
assert.equal(byId.get("model:torch")?.status, "AVAILABLE");
assert.equal(byId.get("model:tensorflow")?.status, "NOT_AVAILABLE");
assert.ok(runner.requests.every((request) => request.shell === false));
assert.ok(runner.requests.every((request) => !request.args.includes("install")));
assert.ok(runner.requests.every((request) => !request.args.includes("--upgrade")));

const missingPythonRunner = new FakeRunner((request) => {
  if (request.command === "python" || request.command === "py") {
    return { exitCode: null, stdout: "", stderr: "", error: "ENOENT" };
  }
  return { exitCode: 1, stdout: "", stderr: "unavailable" };
});
const missingPython = await discoverRuntimeCapabilities({
  runner: missingPythonRunner,
  platform: "win32",
  nodeExecutable: "node-fixture",
  optionalModelStacks: ["torch"],
});
const missingById = new Map(missingPython.capabilities.map((item) => [item.id, item]));
assert.equal(missingById.get("python")?.status, "NOT_AVAILABLE");
assert.equal(missingById.get("manim")?.status, "NOT_TESTED");
assert.equal(missingById.get("model:torch")?.status, "NOT_TESTED");
assert.equal(missingById.get("manim")?.evidence.length, 0);
assert.equal(
  missingPythonRunner.requests.some((request) => request.args.includes("manim")),
  false,
  "Python-dependent probes must not run when Python is unavailable",
);

const excludedRunner = new FakeRunner((request) => {
  if (request.command === "python3" && request.args[0] === "--version") {
    return { exitCode: 0, stdout: "Python 3.11.0", stderr: "" };
  }
  if (request.args.at(-1) === "manim") return { exitCode: 3, stdout: "", stderr: "" };
  return { exitCode: 1, stdout: "", stderr: "unavailable" };
});
const excluded = await discoverRuntimeCapabilities({
  runner: excludedRunner,
  platform: "linux",
  testOptionalModels: false,
  optionalModelStacks: ["torch"],
});
const excludedModel = excluded.capabilities.find((item) => item.id === "model:torch");
assert.equal(excludedModel?.status, "NOT_TESTED");
assert.deepEqual(excludedModel?.evidence, []);
assert.equal(
  excludedRunner.requests.some((request) => request.args.at(-1) === "torch"),
  false,
);

await assert.rejects(
  () => discoverRuntimeCapabilities({ timeoutMs: 0, runner }),
  /positive safe integer/,
);
await assert.rejects(
  () => discoverRuntimeCapabilities({ runner, optionalModelStacks: ["bad-name"] }),
  /valid Python module name/,
);
await assert.rejects(
  () => discoverRuntimeCapabilities({ runner, optionalModelStacks: ["torch", "torch"] }),
  /duplicated/,
);

console.log("Runtime discovery tests: PASS");
