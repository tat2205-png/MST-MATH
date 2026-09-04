import assert from "node:assert/strict";
import { createMathDocument } from "../src/modules/math-ir/index.js";
import { mathIRToLatex } from "../src/modules/document-engine/latex/serializer.js";
import {
  DEFAULT_MST_MATH_NOTATION_PROFILE,
  prepareMstMathNotation,
} from "../src/modules/math-notation/authority.js";
import { verifyMathNotationSemanticSignature } from "../src/modules/math-notation/index.js";
import { toTtsText } from "../src/utils/pronunciation.js";

const notationProfileId = DEFAULT_MST_MATH_NOTATION_PROFILE;
const outputProfileId = "P01_LEARNING_MATERIAL";
const source = String.raw`A ⊂ B,\quad x≤2,\quad d\perp a`;
const prepared = prepareMstMathNotation(source, { profileId: notationProfileId, output: "PDF" });
assert.equal(prepared.status, "PASS", JSON.stringify(prepared.issues));
assert.ok(prepared.canonicalLatex?.includes(String.raw`\subset`));
assert.ok(prepared.canonicalLatex?.includes(String.raw`\leq`));
assert.ok(prepared.canonicalLatex?.includes(String.raw`\perp`));
assert.deepEqual(
  prepared.semanticSignature,
  [
    "set.subset:SUBSET_INCLUSIVE",
    "relation.less_equal:LESS_THAN_OR_EQUAL",
    "geometry.perpendicular:PERPENDICULAR",
  ],
);

const canonicalPrepared = prepareMstMathNotation(prepared.canonicalLatex!, { profileId: notationProfileId, output: "PDF" });
assert.equal(verifyMathNotationSemanticSignature(prepared, canonicalPrepared), undefined);

// Longest-token/control-word protection: \\in must never be read inside \\infty.
const infinity = prepareMstMathNotation(String.raw`x\to+\infty`, { profileId: notationProfileId });
assert.deepEqual(infinity.semanticSignature, ["constant.infinity:INFINITY"]);

const document = createMathDocument({
  id: "math-notation-integration-v1",
  title: "Math notation integration",
  expressions: [
    { id: "expr-1", raw: source, latex: source },
  ],
  sections: [
    {
      id: "section-1",
      blocks: [{ id: "equation-1", type: "equation", expressionId: "expr-1", display: true }],
    },
  ],
});

const latexResult = mathIRToLatex(document, {
  profileId: outputProfileId,
  notationProfileId,
});
assert.equal(latexResult.status, "PASS", JSON.stringify(latexResult.report.errors));
assert.ok(latexResult.latex?.includes(String.raw`A \subset B`));
assert.ok(latexResult.latex?.includes(String.raw`x\leq2`));
assert.ok(latexResult.latex?.includes(String.raw`d\perp a`));

const narration = toTtsText(source, { notationProfileId });
assert.ok(narration.includes("là tập con của"), narration);
assert.ok(narration.includes("nhỏ hơn hoặc bằng"), narration);
assert.ok(narration.includes("vuông góc với"), narration);

// A profile-dependent symbol with an invalid notation profile is release-blocking,
// while the required document output profile remains valid and explicit.
const invalidProfile = mathIRToLatex(document, {
  profileId: outputProfileId,
  notationProfileId: "UNKNOWN_PROFILE",
});
assert.equal(invalidProfile.status, "FAIL");
assert.equal(invalidProfile.latex, undefined);
assert.equal(
  invalidProfile.report.errors.some((issue) => issue.code === "MATH_NOTATION_AMBIGUITY"),
  true,
);

console.log("MST-MATH Math Notation integration QA PASS (authority → Document + TTS).");
