import brandRoot from "../../registry/brand-root.json";
import outputProfiles from "../../registry/output-profiles.json";

export const PIMATH_DNA = brandRoot as typeof brandRoot;
export const NA_MATH_BRAND_ROOT = PIMATH_DNA;
export const NA_MATH_OUTPUT_PROFILES = outputProfiles.profiles.map((profile) => ({ ...profile, parentBrandId: outputProfiles.parentBrandId }));
export type NaMathOutputProfileId = (typeof NA_MATH_OUTPUT_PROFILES)[number]["profileId"];
export type PiMathConsumer = "APP_UI" | "DOCUMENT" | "DOCX" | "PDF_LATEX" | "ASSESSMENT" | "VIDEO" | "GEOGEBRA" | "FOLD" | "GAME";

const consumerProfiles: Record<PiMathConsumer, NaMathOutputProfileId> = {
  APP_UI: "P12_APP_UI",
  DOCUMENT: "P01_LEARNING_MATERIAL",
  DOCX: "P01_LEARNING_MATERIAL",
  PDF_LATEX: "P01_LEARNING_MATERIAL",
  ASSESSMENT: "P05_TEST",
  VIDEO: "P07_VIDEO",
  GEOGEBRA: "P08_GEOGEBRA",
  FOLD: "P09_FOLD",
  GAME: "P10_GAME",
};

function fail(message: string): never { throw new Error(`PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED:${message}`); }
export function resolveBrand() { if (PIMATH_DNA.standardId !== "PIMATH-DNA-V1.0" || !PIMATH_DNA.canonical || !PIMATH_DNA.singleSourceOfTruth) fail("root"); return PIMATH_DNA; }
export function resolveOutputProfile(profileId: string) { const profile = NA_MATH_OUTPUT_PROFILES.find((p) => p.profileId === profileId); return profile ?? fail(`profile:${profileId}`); }
export function resolveCanonicalReference(name: keyof typeof PIMATH_DNA.references) { const value = resolveBrand().references[name]; return value ?? fail(`reference:${name}`); }
export function resolveConsumerProfile(consumer: PiMathConsumer) {
  const profile = resolveOutputProfile(consumerProfiles[consumer]);
  if (profile.parentBrandId !== resolveBrand().standardId) fail(`parent:${consumer}`);
  return profile;
}
export function resolvePdfLatexAuthority(profileId = "P01_LEARNING_MATERIAL") {
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
export function resolveIcon(name: string): never { return fail(`icon:${name}`); }
export function resolveComponent(name: string): never { return fail(`component:${name}`); }
