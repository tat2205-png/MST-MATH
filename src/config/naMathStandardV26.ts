import colorSystem from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/color-system/NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0.json";
import tokens from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/na_math_design_system_v1_3/src/modules/design-system/tokens/tokens.json";
import geometryManifest from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/geometry.manifest.json";
import mathNotation from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/profiles/gdpt2018-kntt-math-notation-policy-v2_3.json";
import approvedGeometryProfiles from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/profiles/view-profile-registry.json";
import symbolRegistry from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/symbol-registry/NA_MATH_KNTT_SYMBOL_STANDARD_V1_0.json";
import qaContracts from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/system-lock/NA_MATH_SYSTEM_CORE_LOCK_POLICY_V2_6.json";

export type NaMathOutputIdentity = "learning_material" | "worksheet" | "exercise_sheet" | "video";
export type CanonicalMathStatus = "PASS" | "BLOCK_RENDER" | "REVIEW_REQUIRED";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const canonicalCommands = new Set(
  Object.values(symbolRegistry.categories)
    .flat()
    .flatMap((entry) => entry[2].match(/\\[A-Za-z]+/g) ?? []),
);

function validateMathSource(source: string): { status: CanonicalMathStatus; reasons: string[] } {
  const reasons: string[] = [];
  const rawSymbols = symbolRegistry.forbidden_raw_unicode_examples.filter((symbol) => source.includes(symbol));
  if (rawSymbols.length) reasons.push(`RAW_UNICODE_MATH:${rawSymbols.join(",")}`);
  const unknownCommands = [...new Set(source.match(/\\[A-Za-z]+/g) ?? [])].filter(
    (command) => !canonicalCommands.has(command),
  );
  if (unknownCommands.length) reasons.push(`UNKNOWN_CANONICAL_SYMBOL:${unknownCommands.join(",")}`);
  return reasons.length ? { status: "BLOCK_RENDER", reasons } : { status: "PASS", reasons: [] };
}

export const NA_MATH_STANDARD_V2_6 = deepFreeze({
  id: "NA_MATH_STANDARD_V2_6" as const,
  baseline: qaContracts.baseline_name,
  status: qaContracts.status,
  canonicalAssetRoot: "standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK" as const,
  layout: {
    id: approvedGeometryProfiles.layout_contract.layout_id,
    status: approvedGeometryProfiles.layout_contract.status,
    tokens: tokens.layout,
  },
  colorSystem,
  typography: tokens.typography,
  mathNotation,
  symbolRegistry,
  semanticGeometry: {
    pipeline: geometryManifest.core_pipeline,
    rules: approvedGeometryProfiles.rules,
  },
  approvedGeometryProfiles,
  qaContracts,
  validateMathSource,
});

export function getNaMathOutputContract(identity: NaMathOutputIdentity) {
  return NA_MATH_STANDARD_V2_6.colorSystem.output_contracts[identity];
}
