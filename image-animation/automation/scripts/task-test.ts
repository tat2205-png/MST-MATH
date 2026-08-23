import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const taskId = process.argv[2] ?? process.env.IA_TASK_ID;
if (!/^IA-(?:[1-9]|10)\.1$/.test(taskId ?? "")) { console.error("TASK_QA=FAIL INVALID_TASK"); process.exit(2); }
const aliases: Record<string, string> = { "ia-1": "scene-graph", "ia-2": "geometry-lock", "ia-3": "manim", "ia-4": "timeline", "ia-5": "editor", "ia-6": "image-understanding", "ia-7": "segmentation", "ia-8": "depth", "ia-9": "blender", "ia-10": "v1" };
const directory = path.join(process.cwd(), "image-animation", "tests", aliases[taskId!.split(".")[0].toLowerCase()]);
if (!existsSync(directory)) { console.error(`TASK_QA=FAIL MISSING_TEST_DIRECTORY=${directory}`); process.exit(1); }
const tests = readdirSync(directory).filter((file) => file.endsWith(".test.ts")).sort();
if (tests.length === 0) { console.error("TASK_QA=FAIL NO_TESTS"); process.exit(1); }
for (const test of tests) {
  const result = spawnSync(process.execPath, [require.resolve("tsx/cli"), path.join(directory, test)], { cwd: process.cwd(), stdio: "inherit", shell: false });
  if (result.error || result.status !== 0) { console.error(`TASK_QA=FAIL TEST=${test}`); process.exit(1); }
}
console.log(`TASK_QA=PASS TASK=${taskId} TESTS=${tests.length}`);
