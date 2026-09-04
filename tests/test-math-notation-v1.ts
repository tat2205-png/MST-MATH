import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canonicalizeMathNotationToken,
  resolveMathNotationToken,
  validateMathNotationRegistry,
  validateMathNotationRenderable,
  type MathNotationRegistry,
} from "../src/modules/math-notation/index.js";

const registryPath = resolve(process.cwd(), "registry", "pimath-dna-math-notation-v1.0.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8")) as MathNotationRegistry;

const registryValidation = validateMathNotationRegistry(registry);
assert.equal(registryValidation.status, "PASS", JSON.stringify(registryValidation.issues, null, 2));

assert.equal(resolveMathNotationToken(registry, "\\perp").effectiveSemantic, "PERPENDICULAR");
assert.equal(resolveMathNotationToken(registry, "⟂").effectiveSemantic, "PERPENDICULAR");
assert.equal(resolveMathNotationToken(registry, "⊥").effectiveSemantic, "PERPENDICULAR");
assert.equal(resolveMathNotationToken(registry, "\\parallel").effectiveSemantic, "PARALLEL");
assert.equal(resolveMathNotationToken(registry, "∥").effectiveSemantic, "PARALLEL");

assert.equal(resolveMathNotationToken(registry, "\\in").effectiveSemantic, "SET_MEMBERSHIP");
assert.equal(resolveMathNotationToken(registry, "∉").effectiveSemantic, "SET_NON_MEMBERSHIP");
assert.equal(resolveMathNotationToken(registry, "\\leq").effectiveSemantic, "LESS_THAN_OR_EQUAL");
assert.equal(resolveMathNotationToken(registry, "<=").effectiveSemantic, "LESS_THAN_OR_EQUAL");
assert.equal(canonicalizeMathNotationToken(registry, "<=").canonicalLatex, "\\leq");

// In Vietnamese GDPT 2018 materials, ⊂ is convention-dependent and must not be
// assigned a global "proper subset" meaning without a notation profile.
const unscopedSubset = resolveMathNotationToken(registry, "⊂");
assert.equal(unscopedSubset.status, "FAIL");
assert.equal(unscopedSubset.issue?.code, "MATH_NOTATION_AMBIGUITY");

const vnSubset = resolveMathNotationToken(registry, "⊂", "VN_GDPT2018");
assert.equal(vnSubset.status, "PASS");
assert.equal(vnSubset.effectiveSemantic, "SUBSET_INCLUSIVE");
assert.equal(vnSubset.effectiveSpokenVi, "là tập con của");

const properSubset = resolveMathNotationToken(registry, "⊊");
assert.equal(properSubset.status, "PASS");
assert.equal(properSubset.effectiveSemantic, "PROPER_SUBSET");

const ttsPerpendicular = validateMathNotationRenderable(registry, "\\perp", "TTS");
assert.equal(ttsPerpendicular.status, "PASS");
assert.equal(ttsPerpendicular.effectiveSpokenVi, "vuông góc với");

for (const entry of registry.entries) {
  for (const output of registry.outputChannels) {
    const profileId = entry.profileSemantics ? "VN_GDPT2018" : undefined;
    const rendered = validateMathNotationRenderable(registry, entry.canonicalLatex, output, profileId);
    assert.equal(rendered.status, "PASS", `${entry.symbolId} must support ${output}`);
  }
}

const unknown = resolveMathNotationToken(registry, "\\definitelyUnknownSymbol");
assert.equal(unknown.status, "FAIL");
assert.equal(unknown.issue?.code, "MATH_NOTATION_UNKNOWN_TOKEN");

const collisionRegistry = structuredClone(registry);
collisionRegistry.entries.push({
  symbolId: "test.collision",
  semantic: "TEST_COLLISION",
  canonicalLatex: "\\testcollision",
  unicode: "≤",
  aliases: [],
  spokenVi: "kiểm thử",
  category: "test",
  outputs: ["PDF"],
});
const collisionValidation = validateMathNotationRegistry(collisionRegistry);
assert.equal(collisionValidation.status, "FAIL");
assert.equal(collisionValidation.issues.some((issue) => issue.code === "MATH_NOTATION_AMBIGUITY"), true);

console.log(`MST-MATH Math Notation V1 token QA PASS (${registry.entries.length} registry entries).`);
