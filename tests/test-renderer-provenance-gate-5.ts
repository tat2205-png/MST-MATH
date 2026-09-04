import assert from "node:assert/strict";
import { resolveRendererAdapterValue, resolveRendererColor, resolveRendererTypography } from "../src/config/pimathRendererProvenance.ts";

const color = resolveRendererColor("amber");
assert.equal(color.value, "#D9911B");
assert.equal(color.authority, "NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0");
assert.equal(color.provenance, "CANONICAL_BINDING");
const typography = resolveRendererTypography("math");
assert.equal(typography.value, "Libertinus Math");
assert.equal(typography.provenance, "CANONICAL_BINDING");
const adapter = resolveRendererAdapterValue("#D9911B", "manim");
assert.equal(adapter.upstream, "MST-MATH-DNA-V1.0");
assert.equal(adapter.provenance, "ADAPTER_BOUNDARY");
console.log("RENDERER_PROVENANCE_RESOLVED=PASS");
console.log("COLOR_AUTHORITY_PROVENANCE=PASS");
console.log("TYPOGRAPHY_AUTHORITY_PROVENANCE=PASS");
console.log("ADAPTER_BOUNDARY_PROVENANCE=PASS");
