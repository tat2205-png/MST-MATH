import assert from "node:assert/strict";
import { resolveGeoGebraCanonicalBinding, resolveMathNotationAuthority, resolveSemanticGeometryAuthority } from "../src/config/mstMathBrandRoot.ts";

const notation = resolveMathNotationAuthority();
assert.equal(notation.authorityId, "NA_MATH_SYSTEM_BASELINE_V2_6");
assert.equal(notation.policy.id, "GDPT2018_KNTT_MATH_NOTATION_POLICY");
assert.equal(notation.symbolRegistry.id, "NA_MATH_KNTT_SYMBOL_STANDARD_V1_0");
assert.equal(notation.provenance.root, "MST-MATH-DNA-V1.0");
assert.equal(notation.provenance.binding, "CANONICAL_BINDING");

const geometry = resolveSemanticGeometryAuthority();
assert.equal(geometry.authorityId, "NA_MATH_SYSTEM_BASELINE_V2_6");
assert.equal(geometry.standardId, "NA_MATH_GEOMETRY_RULES_V1_8_GEO8");
assert.equal(geometry.profiles.rules.visibility_source, "VIEW_PROFILE_ONLY");
assert.equal(geometry.provenance.root, "MST-MATH-DNA-V1.0");
assert.equal(geometry.provenance.binding, "CANONICAL_BINDING");

const geogebra = resolveGeoGebraCanonicalBinding();
assert.equal(geogebra.geometryAuthority, "NA_MATH_GEOMETRY_RULES_V1_8_GEO8");
assert.equal(geogebra.authoritySource, "MST_MATH_DNA");
assert.equal(geogebra.runtimeRole, "ADAPTER_BOUNDARY");
assert.equal(geogebra.authoritative, false);
assert.equal(geogebra.provenance.binding, "CANONICAL_BINDING");

console.log("MST_MATH_DNA_RUNTIME_RESOLVER_QA=PASS");
console.log("MST_MATH_AUTHORITY_PROVENANCE_QA=PASS");
