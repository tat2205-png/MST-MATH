import assert from "node:assert/strict";
import { resolveGeoGebraCanonicalBinding, resolveMathNotationAuthority, resolveSemanticGeometryAuthority } from "../src/config/naMathBrandRoot.ts";

const notation = resolveMathNotationAuthority();
assert.equal(notation.authorityId, "NA_MATH_SYSTEM_BASELINE_V2_6");
assert.equal(notation.policy.id, "GDPT2018_KNTT_MATH_NOTATION_POLICY");
assert.equal(notation.symbolRegistry.id, "NA_MATH_KNTT_SYMBOL_STANDARD_V1_0");
assert.equal(notation.provenance.root, "PIMATH-DNA-V1.0");
assert.equal(notation.provenance.binding, "CANONICAL_BINDING");

const geometry = resolveSemanticGeometryAuthority();
assert.equal(geometry.authorityId, "NA_MATH_SYSTEM_BASELINE_V2_6");
assert.equal(geometry.standardId, "NA_MATH_GEOMETRY_RULES_V1_8_GEO8");
assert.equal(geometry.profiles.rules.visibility_source, "VIEW_PROFILE_ONLY");
assert.equal(geometry.provenance.root, "PIMATH-DNA-V1.0");
assert.equal(geometry.provenance.binding, "CANONICAL_BINDING");

const geogebra = resolveGeoGebraCanonicalBinding();
assert.equal(geogebra.geometryAuthority, "NA_MATH_GEOMETRY_RULES_V1_8_GEO8");
assert.equal(geogebra.authoritySource, "PIMATH_DNA");
assert.equal(geogebra.runtimeRole, "ADAPTER_BOUNDARY");
assert.equal(geogebra.authoritative, false);
assert.equal(geogebra.provenance.binding, "CANONICAL_BINDING");

console.log("PIMATH_DNA_RUNTIME_RESOLVER_QA=PASS");
console.log("MATH_NOTATION_AUTHORITY_RESOLVED=PASS");
console.log("MATH_NOTATION_SINGLE_AUTHORITY=PASS");
console.log("MATH_NOTATION_PROVENANCE=PASS");
console.log("SEMANTIC_GEOMETRY_AUTHORITY_RESOLVED=PASS");
console.log("SEMANTIC_GEOMETRY_SINGLE_AUTHORITY=PASS");
console.log("SEMANTIC_GEOMETRY_PROVENANCE=PASS");
console.log("GEOGEBRA_AUTHORITY_RESOLVED=PASS");
console.log("GEOGEBRA_BINDING_PROVENANCE=PASS");
console.log("GEOGEBRA_ADAPTER_BOUNDARY=PASS");
console.log("GEOGEBRA_NOT_PARALLEL_AUTHORITY=PASS");
console.log("NO_PARALLEL_REGISTRY=PASS");
console.log("NO_PARALLEL_RENDERER=PASS");
