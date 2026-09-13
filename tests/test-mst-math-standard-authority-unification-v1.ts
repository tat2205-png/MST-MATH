import assert from "node:assert/strict";
import standards from "../registry/standards.json";
import families from "../registry/standard-families.json";
import brandRoot from "../registry/brand-root.json";
import iconV1 from "../registry/pimath-dna-icons.json";
import iconV11 from "../registry/pimath-dna-icons-v1.1.json";
import iconV2 from "../registry/pimath-dna-icons-v2.json";
import baselineV1 from "../registry/pimath-dna-global-baseline-v1.0.json";
import baselineV11 from "../registry/pimath-dna-global-baseline-v1.1.json";
import baselineV12 from "../registry/pimath-dna-global-baseline-v1.2.json";
import accessibility from "../standards/PIMATH_ACCESSIBILITY_CANONICAL_V1_0/pimath-accessibility-canonical-v1.0.json";

const entries = standards.standards as Array<Record<string, unknown>>;
const byId = new Map(entries.map((entry) => [String(entry.id), entry]));

assert.equal(standards.authorityResolutionPolicy, "ONE_ACTIVE_CANONICAL_PER_SEMANTIC_FAMILY");
assert.equal(families.resolutionPolicy.oneActiveCanonicalPerSemanticFamily, true);
assert.equal(families.resolutionPolicy.historicalArtifactsRemainImmutable, true);
assert.equal(families.resolutionPolicy.registryClassificationOverridesHistoricalSelfDeclarationForCurrentAuthorityResolution, true);

for (const [familyName, familySpec] of Object.entries(families.families)) {
  const activeCanonical = (familySpec as { activeCanonical: string }).activeCanonical;
  assert.ok(activeCanonical, `FAMILY_WITHOUT_ACTIVE_CANONICAL:${familyName}`);
  const activeEntry = byId.get(activeCanonical);
  assert.ok(activeEntry, `ACTIVE_STANDARD_NOT_REGISTERED:${familyName}:${activeCanonical}`);
  if ("active" in activeEntry) assert.notEqual(activeEntry.active, false, `ACTIVE_STANDARD_MARKED_INACTIVE:${familyName}:${activeCanonical}`);
  if ("canonical" in activeEntry) assert.notEqual(activeEntry.canonical, false, `ACTIVE_STANDARD_MARKED_NON_CANONICAL:${familyName}:${activeCanonical}`);

  for (const historicalId of ((familySpec as { historical?: string[] }).historical ?? [])) {
    const historicalEntry = byId.get(historicalId);
    assert.ok(historicalEntry, `HISTORICAL_STANDARD_NOT_REGISTERED:${familyName}:${historicalId}`);
    assert.equal(historicalEntry.active, false, `HISTORICAL_STANDARD_ACTIVE:${familyName}:${historicalId}`);
    assert.equal(historicalEntry.canonical, false, `HISTORICAL_STANDARD_CANONICAL:${familyName}:${historicalId}`);
  }

  for (const aliasId of ((familySpec as { compatibilityAliases?: string[] }).compatibilityAliases ?? [])) {
    const aliasEntry = byId.get(aliasId);
    assert.ok(aliasEntry, `ALIAS_NOT_REGISTERED:${familyName}:${aliasId}`);
    assert.equal(aliasEntry.active, false, `COMPATIBILITY_ALIAS_ACTIVE:${familyName}:${aliasId}`);
    assert.equal(aliasEntry.canonical, false, `COMPATIBILITY_ALIAS_CANONICAL:${familyName}:${aliasId}`);
    assert.equal(aliasEntry.aliasOf, activeCanonical, `COMPATIBILITY_ALIAS_TARGET_MISMATCH:${familyName}:${aliasId}`);
  }
}

const baselineFamily = families.families.GLOBAL_BASELINE;
assert.equal(baselineFamily.activeCanonical, baselineV12.id);
assert.equal(baselineV12.inherits, baselineV11.id);
assert.equal(baselineV11.inherits, baselineV1.id);
assert.equal(brandRoot.globalBaseline, baselineV12.id);
assert.equal(byId.get(baselineV1.id)?.canonical, false);
assert.equal(byId.get(baselineV11.id)?.canonical, false);
assert.equal(byId.get(baselineV12.id)?.canonical, true);

const iconFamily = families.families.SEMANTIC_ICONS;
assert.equal(iconFamily.activeCanonical, iconV2.standardId);
assert.equal(brandRoot.references.icons, iconV2.standardId);
assert.equal(accessibility.consumes.icons, iconV2.standardId);
assert.equal(iconFamily.consumerBindings.accessibility, iconV2.standardId);
assert.equal(byId.get(iconV1.standardId)?.canonical, false);
assert.equal(byId.get(iconV11.standardId)?.canonical, false);
assert.equal(byId.get(iconV2.standardId)?.canonical, true);
assert.equal(iconFamily.knownNonAuthorityLegacyReferences.length, 0);

// Historical locked payloads remain immutable; current authority comes from the registry classification.
assert.equal(iconV1.canonical, true);
assert.equal(baselineV1.canonical, true);
assert.deepEqual(iconV2.supersedes, [iconV1.standardId, iconV11.standardId]);

const dynamicGeometry = families.families.DYNAMIC_GEOMETRY;
assert.ok(dynamicGeometry.specializedFacets.length >= 4);
for (const id of dynamicGeometry.specializedFacets) assert.ok(byId.has(id));
assert.equal(dynamicGeometry.mergePolicy, "KEEP_SPECIALIZED_FACETS_UNDER_ONE_FAMILY_ROOT");
assert.equal(families.families.PRESENTATION_SYSTEM.mergePolicy, "KEEP_DISTINCT_FACETS_SHARED_PACKAGE");
assert.equal(families.families.VIDEO_PRESENTATION.mergePolicy, "KEEP_AUTHORITY_AND_GOLDEN_EVIDENCE_DISTINCT");
assert.equal(families.families.FOLD_PRESENTATION.mergePolicy, "KEEP_PRESENTATION_LAYER_SEPARATE_FROM_GEOMETRY_SEMANTICS");

console.log("STANDARD_FAMILY_REGISTRY_QA=PASS");
console.log("ONE_ACTIVE_CANONICAL_PER_FAMILY_QA=PASS");
console.log("GLOBAL_BASELINE_ACTIVE=V1.2");
console.log("SEMANTIC_ICON_ACTIVE=V2.0");
console.log("ACCESSIBILITY_ACTIVE_ICON_BINDING_QA=PASS");
console.log("HISTORICAL_IMMUTABILITY_PRESERVED_QA=PASS");
console.log("SPECIALIZED_FACET_NON_DESTRUCTIVE_MERGE_QA=PASS");
console.log("STANDARD_AUTHORITY_UNIFICATION_QA=PASS");
