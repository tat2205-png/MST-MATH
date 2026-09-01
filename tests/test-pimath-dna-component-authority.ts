import assert from "node:assert/strict";
import { PIMATH_DNA, resolveComponent } from "../src/config/naMathBrandRoot.ts";

assert.equal(PIMATH_DNA.references.components, "NA_MATH_DESIGN_SYSTEM_V1_3");
const component = resolveComponent("worked-example");
assert.equal(component.authority, "NA_MATH_DESIGN_SYSTEM_V1_3");
assert.equal(component.component.kind, "worked-example");
assert.equal(component.provenance, "Component Runtime → Component Authority → PiMath DNA Core");
assert.throws(() => resolveComponent("not-a-component"), /PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
console.log("PIMATH_DNA_COMPONENT_AUTHORITY_QA=PASS\nPIMATH_DNA_COMPONENT_PROVENANCE_QA=PASS");
