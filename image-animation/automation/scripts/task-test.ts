import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const taskId = process.argv[2] ?? process.env.IA_TASK_ID;
if (!/^IA-(?:(?:[1-9]|10)\.1|11\.[0-9])$/.test(taskId ?? "")) { console.error("TASK_QA=FAIL INVALID_TASK"); process.exit(2); }
const aliases: Record<string, string> = {
  "IA-1.1": "scene-graph", "IA-2.1": "geometry-lock", "IA-3.1": "manim", "IA-4.1": "timeline", "IA-5.1": "editor",
  "IA-6.1": "image-understanding", "IA-7.1": "segmentation", "IA-8.1": "depth", "IA-9.1": "blender", "IA-10.1": "v1",
  "IA-11.0": "runtime-discovery", "IA-11.1": "segmentation-runtime", "IA-11.2": "depth-runtime", "IA-11.3": "blender-runtime",
  "IA-11.4": "generative-runtime", "IA-11.5": "router-runtime", "IA-11.6": "frame-runtime", "IA-11.7": "pipeline-runtime",
  "IA-11.8": "performance-runtime", "IA-11.9": "release-runtime",
};
const directory = path.join(process.cwd(), "image-animation", "tests", aliases[taskId!]);
if (!existsSync(directory)) { console.error(`TASK_QA=FAIL MISSING_TEST_DIRECTORY=${directory}`); process.exit(1); }
const tests = readdirSync(directory).filter((file) => file.endsWith(".test.ts")).sort();
if (tests.length === 0) { console.error("TASK_QA=FAIL NO_TESTS"); process.exit(1); }
for (const test of tests) {
  const result = spawnSync(process.execPath, [require.resolve("tsx/cli"), path.join(directory, test)], { cwd: process.cwd(), stdio: "inherit", shell: false });
  if (result.error || result.status !== 0) { console.error(`TASK_QA=FAIL TEST=${test}`); process.exit(1); }
}
console.log(`TASK_QA=PASS TASK=${taskId} TESTS=${tests.length}`);
