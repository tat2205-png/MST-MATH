import brandRoot from "../../registry/brand-root.json";
import outputProfiles from "../../registry/output-profiles.json";
import iconAuthority from "../../registry/pimath-dna-icons.json";

export const PIMATH_DNA = brandRoot as typeof brandRoot;
export const NA_MATH_BRAND_ROOT = PIMATH_DNA;
export const NA_MATH_OUTPUT_PROFILES = outputProfiles.profiles.map((profile) => ({ ...profile, parentBrandId: outputProfiles.parentBrandId }));
export type NaMathOutputProfileId = (typeof NA_MATH_OUTPUT_PROFILES)[number]["profileId"];
export type PiMathConsumer = "APP_UI" | "DOCUMENT" | "DOCX" | "PDF_LATEX" | "ASSESSMENT" | "VIDEO" | "GEOGEBRA" | "FOLD" | "GAME";

const consumerProfiles: Partial<Record<PiMathConsumer, NaMathOutputProfileId>> = {
  APP_UI: "P12_APP_UI",
  DOCUMENT: undefined,
  DOCX: undefined,
  PDF_LATEX: undefined,
  ASSESSMENT: "P05_TEST",
  VIDEO: "P07_VIDEO",
  GEOGEBRA: "P08_GEOGEBRA",
  FOLD: "P09_FOLD",
  GAME: "P10_GAME",
};

function fail(message: string): never { throw new Error(`PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED:${message}`); }
function requireProfileId(consumer: PiMathConsumer, profileId: string | undefined): NaMathOutputProfileId {
  if (!profileId) throw new Error(`PIMATH_DNA_OUTPUT_PROFILE_REQUIRED:${consumer}`);
  return profileId as NaMathOutputProfileId;
}
export function resolveBrand() { if (PIMATH_DNA.standardId !== "PIMATH-DNA-V1.0" || !PIMATH_DNA.canonical || !PIMATH_DNA.singleSourceOfTruth) fail("root"); return PIMATH_DNA; }
export function resolveOutputProfile(profileId: string) {
  const profile = NA_MATH_OUTPUT_PROFILES.find((p) => p.profileId === profileId);
  if (profile) return profile;
  const alias = outputProfiles.aliases?.[profileId as keyof typeof outputProfiles.aliases];
  if (alias?.status === "COMPATIBILITY_ALIAS") return resolveOutputProfile(alias.aliasOf);
  return fail(`profile:${profileId}`);
}
export function resolveCanonicalReference(name: keyof typeof PIMATH_DNA.references) { const value = resolveBrand().references[name]; return value ?? fail(`reference:${name}`); }
export function resolveConsumerProfile(consumer: PiMathConsumer, profileId?: string) {
  const profile = resolveOutputProfile(requireProfileId(consumer, profileId ?? consumerProfiles[consumer]));
  if (profile.parentBrandId !== resolveBrand().standardId) fail(`parent:${consumer}`);
  return profile;
}
export function resolvePdfLatexAuthority(profileId?: string) {
  requireProfileId("PDF_LATEX", profileId);
  const profile = resolveOutputProfile(profileId);
  return { profile, brand: resolveBrand(), layout: resolveCanonicalReference("layout"), typography: resolveCanonicalReference("typography"), color: resolveCanonicalReference("color"), renderer: "LATEX_PDF_ADAPTER" as const, canOverridePiMathDna: false as const };
}
export function resolveTypography(role: string) {
  const roles = new Set(["body", "ui", "math", "fallback_vi_serif"]);
  if (!roles.has(role)) fail(`typography:${role}`);
  return { authority: resolveCanonicalReference("typography"), role } as const;
}
export function resolveSemanticColor(name: string) {
  if (!name.trim()) fail("color");
  return { authority: resolveCanonicalReference("color"), name } as const;
}
export type PiMathIconRole = keyof typeof iconAuthority.roles;
export function resolveIcon(name: string) {
  if (!(name in iconAuthority.roles)) return fail(`icon:${name}`);
  const role = name as PiMathIconRole;
  return { authority: iconAuthority.standardId, role, resource: iconAuthority.roles[role].resource, style: iconAuthority.style } as const;
}
export function resolveComponent(name: string): never { return fail(`component:${name}`); }
