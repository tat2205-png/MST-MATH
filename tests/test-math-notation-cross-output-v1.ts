import assert from "node:assert/strict";
import { renderMstMathToHtml } from "../src/modules/math-notation/html.js";
import { serializeMathNodeToOmml } from "../src/modules/document-export/docx/omml.js";
import type { MathNode } from "../src/modules/document-engine/document-ir.js";

const source = String.raw`A⊂B,\quad x≤2,\quad d\perp a`;

const html = renderMstMathToHtml(source, {
  notationProfileId: "VN_GDPT2018",
  displayMode: true,
});
assert.equal(html.status, "PASS", JSON.stringify(html.issues));
assert.equal(html.canonicalLatex, String.raw`A\subset B,\quad x\leq2,\quad d\perp a`);
assert.deepEqual(html.semanticSignature, [
  "set.subset:SUBSET_INCLUSIVE",
  "relation.less_equal:LESS_THAN_OR_EQUAL",
  "geometry.perpendicular:PERPENDICULAR",
]);
assert.ok(html.html?.includes("katex"));
assert.ok(html.html?.includes("mathml"));

const htmlInvalidProfile = renderMstMathToHtml("A⊂B", {
  notationProfileId: "UNKNOWN_PROFILE",
});
assert.equal(htmlInvalidProfile.status, "FAIL");
assert.equal(htmlInvalidProfile.html, undefined);
assert.equal(htmlInvalidProfile.issues.some((issue) => issue.code === "MATH_NOTATION_AMBIGUITY"), true);

const node: MathNode = {
  sourceType: "LATEX",
  sourceRaw: source,
  latex: source,
  normalized: source,
  parseStatus: "PARSED",
  warnings: [],
  sourceLocation: "math-notation-cross-output-v1",
};

const omml = serializeMathNodeToOmml(node, { notationProfileId: "VN_GDPT2018" });
assert.ok(omml.startsWith("<m:oMath>"));
assert.ok(omml.includes("&#x2282;"), "subset must survive canonicalization into OMML");
assert.ok(omml.includes("&#x2264;"), "less-than-or-equal must survive canonicalization into OMML");
assert.ok(omml.includes("&#x27C2;"), "perpendicular must use the canonical Unicode relation in OMML");

assert.throws(
  () => serializeMathNodeToOmml(node, { notationProfileId: "UNKNOWN_PROFILE" }),
  (error: unknown) => error instanceof Error && error.message.includes("UNKNOWN_PROFILE"),
);

const canonicalCommandNode: MathNode = {
  ...node,
  sourceRaw: String.raw`A\subsetneq B,\quad x\neq0,\quad y\geq1,\quad z\approx2,\quad \angle ABC`,
  latex: String.raw`A\subsetneq B,\quad x\neq0,\quad y\geq1,\quad z\approx2,\quad \angle ABC`,
  normalized: String.raw`A\subsetneq B,\quad x\neq0,\quad y\geq1,\quad z\approx2,\quad \angle ABC`,
};
const canonicalOmml = serializeMathNodeToOmml(canonicalCommandNode);
for (const entity of ["&#x228A;", "&#x2260;", "&#x2265;", "&#x2248;", "&#x2220;"]) {
  assert.ok(canonicalOmml.includes(entity), `OMML adapter must support canonical entity ${entity}`);
}

console.log("MST-MATH Math Notation cross-output QA PASS (HTML/KaTeX + DOCX/OMML).");
