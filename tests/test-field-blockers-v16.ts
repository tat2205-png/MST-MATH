import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { posix, win32 } from "node:path";
import { ingestDocxQuestions } from "../src/modules/question-bank/pipeline.ts";
import { createQuestionDocx } from "./question-bank-fixture.ts";
import { parseOmml } from "../src/modules/question-bank/omml.ts";

const FIELD_EVIDENCE_ENV = "MAS_FIELD_EVIDENCE_ROOT";
const FIELD_EVIDENCE_RELATIVE_PATH = ["v1.6", "SELF-01", "PILOT-01", "source", "Full-Toán thực tế 10.docx"] as const;
const LEGACY_WINDOWS_FIELD_EVIDENCE_ROOT = "D:/math-ai-video-studio/mas-field-evidence";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts?: Record<string, string> };
assert.equal(packageJson.scripts?.["bridge:start"], "uv run python local_bridge/bridge.py");
assert.match(readFileSync("local_bridge/bridge.py", "utf8"), /timeout=30,/);
console.log("MACOS_BRIDGE_LAUNCHER_QA=PASS");

function resolveFieldEvidenceSource(environment: NodeJS.ProcessEnv, platform: NodeJS.Platform, cwd: string): string {
  const path = platform === "win32" ? win32 : posix;
  const configuredRoot = environment[FIELD_EVIDENCE_ENV]?.trim();
  const root = configuredRoot || (platform === "win32" ? LEGACY_WINDOWS_FIELD_EVIDENCE_ROOT : path.resolve(cwd, "field-evidence"));
  return path.resolve(root, ...FIELD_EVIDENCE_RELATIVE_PATH);
}

function requireFieldEvidenceSource(sourcePath: string, exists: (path: string) => boolean = existsSync): string {
  if (!exists(sourcePath)) {
    throw new Error(`FIELD_EVIDENCE_SOURCE_MISSING: set ${FIELD_EVIDENCE_ENV} to the evidence root; resolved candidate: ${sourcePath}`);
  }
  return sourcePath;
}

const posixSource = resolveFieldEvidenceSource({ [FIELD_EVIDENCE_ENV]: "/Volumes/Math Evidence" }, "darwin", "/workspace");
assert.equal(posixSource, "/Volumes/Math Evidence/v1.6/SELF-01/PILOT-01/source/Full-Toán thực tế 10.docx");
const windowsSource = resolveFieldEvidenceSource({}, "win32", "C:\\workspace");
assert.equal(windowsSource, "D:\\math-ai-video-studio\\mas-field-evidence\\v1.6\\SELF-01\\PILOT-01\\source\\Full-Toán thực tế 10.docx");
const windowsOverride = resolveFieldEvidenceSource({ [FIELD_EVIDENCE_ENV]: "E:\\Field Evidence" }, "win32", "C:\\workspace");
assert.equal(windowsOverride, "E:\\Field Evidence\\v1.6\\SELF-01\\PILOT-01\\source\\Full-Toán thực tế 10.docx");
assert.ok(posixSource.endsWith("Full-Toán thực tế 10.docx"));
assert.throws(() => requireFieldEvidenceSource(posixSource, () => false), new RegExp(`FIELD_EVIDENCE_SOURCE_MISSING: set ${FIELD_EVIDENCE_ENV}.*${posixSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
console.log("FIELD_EVIDENCE_PATH_RESOLVER_QA=PASS\nWINDOWS_PATH_COMPATIBILITY_QA=PASS\nMAC_PATH_COMPATIBILITY_QA=PASS\nUNICODE_FILENAME_QA=PASS\nMISSING_SOURCE_FAIL_CLOSED_QA=PASS");

const fixture = ingestDocxQuestions(createQuestionDocx(), "field-fixture.docx");
const multipleChoice = fixture.questions.find((question) => question.type === "MULTIPLE_CHOICE")!;
assert.equal(multipleChoice.options.length, 4);
assert.ok(multipleChoice.options.every((option) => option.content.length > 0));
assert.ok(multipleChoice.stem.some((block) => block.type === "math"));
assert.equal(new Set(multipleChoice.figureAssociations.map((association) => association.figureId)).size, multipleChoice.figureAssociations.length);
assert.equal(multipleChoice.solution?.length ?? 0, 0);

const sourcePath = requireFieldEvidenceSource(resolveFieldEvidenceSource(process.env, process.platform, process.cwd()));
const real = ingestDocxQuestions(new Uint8Array(readFileSync(sourcePath)), sourcePath);
assert.equal(real.questions.length, 158);
assert.equal(real.questions.filter((question) => question.options.length === 4).length, 158);
assert.equal(real.questions.filter((question) => (question.solution?.length ?? 0) > 0).length, 158);
assert.equal(real.document.figures.length, 149);
assert.ok(real.questions.every((question) => new Set(question.figureAssociations.map((association) => association.figureId)).size === question.figureAssociations.length));

const mathCases = [
  ["power", "<m:oMath><m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:oMath>", "^{"],
  ["fraction", "<m:oMath><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>x+1</m:t></m:r></m:den></m:f></m:oMath>", "\\frac"],
  ["absolute", "<m:oMath><m:d><m:dPr><m:begChr m:val=\"|\"/><m:endChr m:val=\"|\"/></m:dPr><m:e><m:r><m:t>x-2</m:t></m:r></m:e></m:d></m:oMath>", "\\left|"],
  ["parentheses", "<m:oMath><m:d><m:e><m:r><m:t>x+1</m:t></m:r></m:e></m:d></m:oMath>", "\\left("],
  ["bar", "<m:oMath><m:bar><m:e><m:r><m:t>ab</m:t></m:r></m:e></m:bar></m:oMath>", "\\overline"],
  ["vector", "<m:oMath><m:acc><m:accPr><m:chr m:val=\"⃗\"/></m:accPr><m:e><m:r><m:t>F</m:t></m:r></m:e></m:acc></m:oMath>", "\\vec"],
] as const;
for (const [name, xml, expected] of mathCases) { const parsed = parseOmml(xml, `field:${name}`); assert.equal(parsed.parseStatus, "PARSED"); assert.ok(parsed.latex?.includes(expected)); }
const eqarr = parseOmml("<m:oMath><m:eqArr><m:e><m:r><m:t>x=1</m:t></m:r></m:e></m:eqArr></m:oMath>", "field:eqArr");
assert.equal(eqarr.parseStatus, "UNSUPPORTED"); assert.ok(eqarr.warnings.some((warning) => warning.includes("UNSUPPORTED_OMML_CONSTRUCT")));

const realMath = real.questions.flatMap((question) => [...question.stem, ...question.options.flatMap((option) => option.content), ...(question.solution ?? [])].filter((block) => block.type === "math").map((block) => ({ question, math: block.math })));
const audit = (category: string, sourcePattern: RegExp, outputPattern: RegExp, limit = 5) => {
  const samples = realMath.filter(({ math }) => sourcePattern.test(math.sourceRaw) && outputPattern.test(math.latex ?? "")).slice(0, limit);
  assert.ok(samples.length > 0, `No real ${category} samples found`);
  for (const { math } of samples) { assert.equal(math.parseStatus, "PARSED", `${category} was not parsed`); assert.match(math.latex ?? "", outputPattern, `${category} structure was not preserved`); }
  return samples.length;
};
const realCounts = {
  power: audit("power", /<m:sSup\b/i, /\^\{/),
  fraction: audit("fraction", /<m:f\b/i, /\\frac\{/),
  absolute: audit("absolute value", /<m:dPr[\s\S]*m:begChr[^>]*m:val="\|"/i, /\\left\|[\s\S]*\\right\|/),
  parentheses: audit("parentheses", /<m:d\b/i, /\\left\(/),
  bar: audit("bar", /<m:bar\b/i, /\\overline\{/),
  acc: audit("acc", /<m:acc\b/i, /\\vec\{/),
  limUpp: audit("limUpp", /<m:limUpp\b/i, /\^\{/),
  box: audit("box", /<m:box\b/i, /./),
  quadratic: realMath.filter(({ math }) => /<m:sSup\b/i.test(math.sourceRaw) && /x|y/i.test(math.latex ?? "")).slice(0, 5).length,
  polynomial: realMath.filter(({ math }) => /<m:sSup\b/i.test(math.sourceRaw) && /[a-z].*[+\-=]/i.test(math.latex ?? "")).slice(0, 5).length,
};
assert.ok(realMath.some(({ question, math }) => question.stem.some((block) => block.type === "text") && math.sourceLocation));
const mathOptionCount = real.questions.flatMap((question) => question.options.flatMap((option) => option.content.filter((block) => block.type === "math"))).length;
assert.ok(mathOptionCount > 0);
const mathOptions = real.questions.flatMap((question) => question.options.flatMap((option) => option.content.filter((block) => block.type === "math").map((block) => ({ question, option, block }))));
assert.ok(mathOptions.length >= 10);
assert.ok(mathOptions.slice(0, 10).every(({ option, block }) => option.label && block.math.sourceRaw.length > 0 && block.math.parseStatus === "PARSED" && block.math.latex));
const mixedOptions = real.questions.flatMap((question) => question.options.filter((option) => option.content.some((block) => block.type === "text") && option.content.some((block) => block.type === "math")));
assert.ok(mixedOptions.length >= 10);
assert.ok(mixedOptions.slice(0, 10).every((option) => option.content.some((block) => block.type === "text") && option.content.some((block) => block.type === "math")));
console.log(`REAL_MATH_SAMPLE_COUNTS=${JSON.stringify(realCounts)}`);
console.log(`REAL_MATH_OPTION_SAMPLE_COUNT=${mathOptionCount}`);
console.log(`REAL_MIXED_OPTION_SAMPLE_COUNT=${mixedOptions.length}`);

console.log("TEST_FIELD_DOCX_001=PASS");
console.log("TEST_FIELD_DOCX_002=PASS");
console.log("TEST_FIELD_DOCX_003=PASS");
console.log("TEST_FIELD_DOCX_004=PASS");
console.log("TEST_FIELD_MATH_001=PASS");
console.log("TEST_FIELD_MATH_002=PASS");
console.log("TEST_FIELD_MATH_003=PASS");
console.log("TEST_FIELD_MATH_004=PASS");
console.log("TEST_FIELD_MATH_005=PASS");
console.log("TEST_FIELD_MATH_006=PASS");
console.log("TEST_FIELD_MATH_007=PASS");
console.log("TEST_FIELD_FIGURE_001=PASS");
console.log("TEST_FIELD_FIGURE_002=PASS");
console.log("TEST_FIELD_FIGURE_003=PASS");
