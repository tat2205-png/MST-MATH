import brandRoot from "../../registry/mst-math-brand-root.json";
import outputProfiles from "../../registry/output-profiles.json";
import iconAuthority from "../../registry/mst-math-dna-icons-v1.1.json";
import geometryManifest from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/geometry.manifest.json";
import mathNotation from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/profiles/gdpt2018-kntt-math-notation-policy-v2_3.json";
import approvedGeometryProfiles from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/profiles/view-profile-registry.json";
import symbolRegistry from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/symbol-registry/NA_MATH_KNTT_SYMBOL_STANDARD_V1_0.json";
import accessibilityAuthority from "../../standards/MST_MATH_ACCESSIBILITY_CANONICAL_V1_0/mst-math-accessibility-canonical-v1.0.json";
import voiceNarrationAuthority from "../../standards/MST_MATH_VOICE_NARRATION_CANONICAL_V1_0/mst-math-voice-narration-canonical-v1.0.json";
import { componentRegistry } from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/na_math_design_system_v1_3/src/modules/design-system/components/component-registry.js";

export const MST_MATH_DNA = brandRoot as typeof brandRoot;
/** @deprecated Compatibility export. New code must use MST_MATH_DNA. */
export const PIMATH_DNA = MST_MATH_DNA;
export const NA_MATH_BRAND_ROOT = MST_MATH_DNA;
export const MST_MATH_OUTPUT_PROFILES = outputProfiles.profiles.map((profile) => ({ ...profile, parentBrandId: outputProfiles.parentBrandId }));
/** @deprecated Compatibility export. */
export const NA_MATH_OUTPUT_PROFILES = MST_MATH_OUTPUT_PROFILES;
export type MstMathOutputProfileId = (typeof MST_MATH_OUTPUT_PROFILES)[number]["profileId"];
export type NaMathOutputProfileId = MstMathOutputProfileId;
export type MstMathConsumer = "APP_UI" | "DOCUMENT" | "DOCX" | "PDF_LATEX" | "ASSESSMENT" | "EXAM_THPTQG" | "EXAM_DGNL" | "EXAM_SAT" | "EXAM_VSAT" | "VIDEO" | "GEOGEBRA" | "FOLD" | "GAME";
/** @deprecated Compatibility type alias. */
export type PiMathConsumer = MstMathConsumer;

const consumerProfiles: Partial<Record<MstMathConsumer, MstMathOutputProfileId>> = {
  APP_UI: "P12_APP_UI", DOCUMENT: undefined, DOCX: undefined, PDF_LATEX: undefined, ASSESSMENT: "P05_TEST",
  EXAM_THPTQG: "P06_EXAM_THPTQG", EXAM_DGNL: "P06_EXAM_DGNL", EXAM_SAT: "P06_EXAM_SAT", EXAM_VSAT: "P06_EXAM_VSAT",
  VIDEO: "MST_MATH_VIDEO_VISUAL_CANONICAL_V2.0", GEOGEBRA: "P08_GEOGEBRA", FOLD: "P09_FOLD", GAME: "P10_GAME",
};
function fail(message: string): never { throw new Error(`MST_MATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED:${message}`); }
function requireProfileId(consumer: MstMathConsumer, profileId: string | undefined): MstMathOutputProfileId { if (!profileId) throw new Error(`MST_MATH_DNA_OUTPUT_PROFILE_REQUIRED:${consumer}`); return profileId as MstMathOutputProfileId; }
export function resolveBrand() { if (MST_MATH_DNA.standardId !== "MST-MATH-DNA-V1.0" || !MST_MATH_DNA.canonical || !MST_MATH_DNA.singleSourceOfTruth) fail("root"); return MST_MATH_DNA; }
export function resolveOutputProfile(profileId: string) { const profile = MST_MATH_OUTPUT_PROFILES.find((p) => p.profileId === profileId); if (profile) return profile; const alias = outputProfiles.aliases?.[profileId as keyof typeof outputProfiles.aliases]; if (alias?.status === "COMPATIBILITY_ALIAS") return resolveOutputProfile(alias.aliasOf); return fail(`profile:${profileId}`); }
export function resolveCanonicalReference(name: keyof typeof MST_MATH_DNA.references) { const value = resolveBrand().references[name]; return value ?? fail(`reference:${name}`); }
function resolveChildAuthority(authority: typeof accessibilityAuthority | typeof voiceNarrationAuthority, reference: string) { const brand = resolveBrand(); if (brand.references[reference as keyof typeof brand.references] !== authority.id || authority.status !== "LOCKED" || !authority.canonical || !authority.approved || authority.inherits !== "MST_MATH_DNA_CORE" || authority.overrideCoreDna) fail(`child:${authority.id}`); return { authority, provenance: { root: brand.standardId, source: `${authority.id} → MST-MATH DNA Core` as const, binding: "CANONICAL_BINDING" as const } } as const; }
export function resolveAccessibilityAuthority() { return resolveChildAuthority(accessibilityAuthority, "accessibility"); }
export function resolveVoiceNarrationAuthority() { return resolveChildAuthority(voiceNarrationAuthority, "voice"); }
export function resolveMathNotationAuthority() { const brand = resolveBrand(); if (brand.references.math !== "NA_MATH_SYSTEM_BASELINE_V2_6") fail("math:reference"); return { authorityId: "NA_MATH_SYSTEM_BASELINE_V2_6" as const, policy: mathNotation, symbolRegistry, provenance: { root: brand.standardId, source: "MST-MATH DNA Core → Math Notation Authority" as const, binding: "CANONICAL_BINDING" as const } } as const; }
export function resolveSemanticGeometryAuthority() { const brand = resolveBrand(); if (brand.references.math !== "NA_MATH_SYSTEM_BASELINE_V2_6") fail("geometry:reference"); return { authorityId: "NA_MATH_SYSTEM_BASELINE_V2_6" as const, standardId: "NA_MATH_GEOMETRY_RULES_V1_8_GEO8" as const, manifest: geometryManifest, profiles: approvedGeometryProfiles, provenance: { root: brand.standardId, source: "MST-MATH DNA Core → Semantic Geometry Authority" as const, binding: "CANONICAL_BINDING" as const } } as const; }
export function resolveGeoGebraCanonicalBinding() { const brand = resolveBrand(); const binding = brand.references.geogebra; if (!binding || binding.kind !== "ADAPTER_BOUNDARY" || binding.geometryAuthority !== "NA_MATH_GEOMETRY_RULES_V1_8_GEO8" || binding.authoritySource !== "MST_MATH_DNA" || binding.runtimeRole !== "ADAPTER_BOUNDARY" || binding.authoritative !== false || !binding.adapter) fail("geogebra:binding"); return { ...binding, provenance: { root: brand.standardId, binding: "CANONICAL_BINDING" as const } } as const; }
export function resolveConsumerProfile(consumer: MstMathConsumer, profileId?: string) { const profile = resolveOutputProfile(requireProfileId(consumer, profileId ?? consumerProfiles[consumer])); if (profile.parentBrandId !== resolveBrand().standardId) fail(`parent:${consumer}`); return profile; }
export type MstMathExamProfile = "THPTQG" | "DGNL" | "SAT" | "VSAT";
export type PiMathExamProfile = MstMathExamProfile;
const examConsumer: Record<MstMathExamProfile, Extract<MstMathConsumer, `EXAM_${string}`>> = { THPTQG: "EXAM_THPTQG", DGNL: "EXAM_DGNL", SAT: "EXAM_SAT", VSAT: "EXAM_VSAT" };
export function resolveExamRuntimeAuthority(exam: MstMathExamProfile) { const consumer = examConsumer[exam]; const profile = resolveConsumerProfile(consumer); return { exam, profile, authority: "MST-MATH-DNA-V1.0" as const, renderer: "EXISTING_EXAM_RENDERER" as const, canOverrideMstMathDna: false as const, canOverridePiMathDna: false as const, provenance: "MST-MATH DNA Core → Output Profile Registry → Canonical Exam Profile → Runtime Resolver → Existing Renderer" as const } as const; }
export function resolvePdfLatexAuthority(profileId?: string) { requireProfileId("PDF_LATEX", profileId); const profile = resolveOutputProfile(profileId); return { profile, brand: resolveBrand(), layout: resolveCanonicalReference("layout"), typography: resolveCanonicalReference("typography"), color: resolveCanonicalReference("color"), renderer: "LATEX_PDF_ADAPTER" as const, canOverrideMstMathDna: false as const, canOverridePiMathDna: false as const }; }
export function resolveTypography(role: string) { const roles = new Set(["body", "ui", "math", "fallback_vi_serif"]); if (!roles.has(role)) fail(`typography:${role}`); return { authority: resolveCanonicalReference("typography"), role } as const; }
export function resolveSemanticColor(name: string) { if (!name.trim()) fail("color"); return { authority: resolveCanonicalReference("color"), name } as const; }
export type MstMathIconRole = keyof typeof iconAuthority.roles;
export type MstMathIconOutput = keyof typeof iconAuthority.outputContract.targets;
export type PiMathIconRole = MstMathIconRole;
export type PiMathIconOutput = MstMathIconOutput;
export function resolveIcon(name: string) { if (resolveBrand().references.icons !== iconAuthority.standardId || !iconAuthority.canonical || !iconAuthority.approved || !iconAuthority.singleSourceOfTruth) fail("icon:authority"); if (!(name in iconAuthority.roles)) return fail(`icon:${name}`); const role = name as MstMathIconRole; const spec = iconAuthority.roles[role]; const semanticRole = "semanticRole" in spec ? spec.semanticRole : role; return { authority: iconAuthority.standardId, role, semanticRole, resource: spec.resource, style: iconAuthority.style } as const; }
export function resolveIconForOutput(name: string, target: MstMathIconOutput) { if (!(target in iconAuthority.outputContract.targets)) return fail(`icon-output:${target}`); const icon = resolveIcon(name); const output = iconAuthority.outputContract.targets[target]; return { ...icon, target, adapter: output.adapter, preserveIdentity: output.preserveIdentity, fallback: output.fallback, identityRule: iconAuthority.outputContract.identityRule } as const; }
export function resolveComponentIcon(componentName: string, target: MstMathIconOutput) { if (!(componentName in iconAuthority.componentBindings)) return fail(`component-icon:${componentName}`); const role = iconAuthority.componentBindings[componentName as keyof typeof iconAuthority.componentBindings]; return { componentName, ...resolveIconForOutput(role, target) } as const; }
export function resolveComponent(name: string) { const brand = resolveBrand(); if (brand.references.components !== "NA_MATH_DESIGN_SYSTEM_V1_3") fail("component:reference"); const component = componentRegistry[name as keyof typeof componentRegistry]; if (!component) return fail(`component:${name}`); return { authority: brand.references.components, component, provenance: "Component Runtime → Component Authority → MST-MATH DNA Core" as const } as const; }
