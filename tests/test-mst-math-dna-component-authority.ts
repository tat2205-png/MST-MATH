import assert from "node:assert/strict";
import { MST_MATH_DNA, resolveComponent } from "../src/config/mstMathBrandRoot.ts";

assert.equal(MST_MATH_DNA.references.components, "NA_MATH_DESIGN_SYSTEM_V1_3");
const component = resolveComponent("worked-example");
assert.equal(component.authority, "NA_MATH_DESIGN_SYSTEM_V1_3");
assert.equal(component.component.kind, "worked-example");
assert.equal(component.provenance, "Component Runtime → Component Authority → MST-MATH DNA Core");
assert.throws(() => resolveComponent("not-a-component"), /MST_MATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
console.log("MST_MATH_DNA_COMPONENT_AUTHORITY_QA=PASS");
