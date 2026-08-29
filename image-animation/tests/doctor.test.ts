import assert from "node:assert/strict";
import { parseGitPorcelain } from "../automation/gates/gitStatusParser.ts";
import { readFileSync } from "node:fs";
import path from "node:path";

const scripts = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")).scripts;
for (const script of ["ia:status", "ia:qa", "ia:regression", "ia:auto", "ia:agent-status", "ia:build", "ia:doctor", "ia:resume"]) assert.equal(typeof scripts[script], "string");
assert.deepEqual(parseGitPorcelain(" M image-animation/a.ts\nM  image-animation/b.ts\nA  image-animation/c.ts\n?? image-animation/d.ts\nD  image-animation/e.ts").map((entry) => entry.path), ["image-animation/a.ts", "image-animation/b.ts", "image-animation/c.ts", "image-animation/d.ts", "image-animation/e.ts"]);
console.log("Doctor and state tests: PASS");