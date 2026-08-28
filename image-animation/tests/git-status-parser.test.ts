import assert from "node:assert/strict";
import { parseGitPorcelain, parseGitPorcelainLine } from "../automation/gates/gitStatusParser.ts";

const lines = [
  [" M image-animation/a.ts", "image-animation/a.ts"],
  ["M  image-animation/b.ts", "image-animation/b.ts"],
  ["A  image-animation/c.ts", "image-animation/c.ts"],
  ["?? image-animation/d.ts", "image-animation/d.ts"],
  ["D  image-animation/e.ts", "image-animation/e.ts"],
  ["M  package.json", "package.json"],
] as const;
for (const [line, expected] of lines) assert.equal(parseGitPorcelainLine(line)?.path, expected);
assert.equal(parseGitPorcelainLine("R  old.ts -> image-animation/new.ts")?.path, "image-animation/new.ts");
assert.deepEqual(parseGitPorcelain(lines.map(([line]) => line).join("\n")).map((entry) => entry.path), lines.map(([, expected]) => expected));
assert.equal(parseGitPorcelain(" M mage-animation/wrong.ts")[0].path, "mage-animation/wrong.ts");
console.log("Git porcelain parser tests: 7/7 passed");