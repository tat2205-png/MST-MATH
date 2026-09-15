export const UNIFIED_VISUAL_STANDARD_VERSION = "mst-math-visual/v1" as const;

export type AuthorityId =
  | "MATHEMATICAL_TRUTH"
  | "SOURCE_EVIDENCE"
  | "GDPT2018_KNTT"
  | "PEDAGOGICAL_PURPOSE"
  | "MST_PROFILE"
  | "INTERNATIONAL_REFERENCE"
  | "TOOL_DEFAULT";

export interface AuthorityResolutionRule {
  conflict: string;
  winner: AuthorityId | "METADATA_DEPENDENT";
  scope: string;
}

export const AUTHORITY_RESOLUTION_MATRIX: readonly AuthorityResolutionRule[] = Object.freeze([
  { conflict: "MATHEMATICAL_TRUTH_vs_ANY", winner: "MATHEMATICAL_TRUTH", scope: "Mathematical truth cannot be overridden by curriculum, pedagogy, style, international reference, or tool defaults." },
  { conflict: "SOURCE_EVIDENCE_vs_AI_INFERENCE", winner: "SOURCE_EVIDENCE", scope: "Explicit source evidence wins over inferred geometry or measurements." },
  { conflict: "GDPT2018_KNTT_vs_INTERNATIONAL_REFERENCE", winner: "GDPT2018_KNTT", scope: "Curriculum convention, notation convention, and instructional routing for GDPT 2018/KNTT outputs." },
  { conflict: "GDPT2018_KNTT_vs_TOOL_DEFAULT", winner: "GDPT2018_KNTT", scope: "Curriculum convention overrides GeoGebra, renderer, or UI defaults." },
  { conflict: "PEDAGOGICAL_PURPOSE_vs_AESTHETICS", winner: "PEDAGOGICAL_PURPOSE", scope: "The intended learning or assessment function wins over decorative or artistic composition." },
  { conflict: "MST_PROFILE_vs_TOOL_DEFAULT", winner: "MST_PROFILE", scope: "MST publication/readability rules override default renderer styling." },
  { conflict: "METRIC_FIDELITY_vs_VIEW_FIDELITY", winner: "METADATA_DEPENDENT", scope: "Resolve from task semantics and explicit fidelity metadata; never guess." },
]);

export type PedagogicalPurpose = "GIVEN_ONLY" | "SCAFFOLDED" | "EXPLANATORY" | "FULL_SOLUTION";

export interface PedagogicalDisclosureRule {
  purpose: PedagogicalPurpose;
  showGiven: true;
  showIntermediateDerived: boolean;
  showTargetOrFinalResult: boolean;
  rule: string;
}

export const PEDAGOGICAL_DISCLOSURE_RUBRIC: Readonly<Record<PedagogicalPurpose, PedagogicalDisclosureRule>> = Object.freeze({
  GIVEN_ONLY: {
    purpose: "GIVEN_ONLY",
    showGiven: true,
    showIntermediateDerived: false,
    showTargetOrFinalResult: false,
    rule: "Show only stated assumptions and representation structure required to read the task. Do not reveal a derived target or result.",
  },
  SCAFFOLDED: {
    purpose: "SCAFFOLDED",
    showGiven: true,
    showIntermediateDerived: true,
    showTargetOrFinalResult: false,
    rule: "Allow validated intermediate states or facts selected by the learning design, but do not reveal the final target/result.",
  },
  EXPLANATORY: {
    purpose: "EXPLANATORY",
    showGiven: true,
    showIntermediateDerived: true,
    showTargetOrFinalResult: true,
    rule: "Allow the validated process and final result for worked explanation; emphasis must follow the current explanatory step.",
  },
  FULL_SOLUTION: {
    purpose: "FULL_SOLUTION",
    showGiven: true,
    showIntermediateDerived: true,
    showTargetOrFinalResult: true,
    rule: "Allow complete validated construction/reasoning/result annotations for solution or reference material.",
  },
});

export type CoreVisualFamily =
  | "ALGEBRAIC_REPRESENTATION"
  | "COORDINATE_AND_FUNCTION"
  | "PLANE_GEOMETRY"
  | "SPATIAL_GEOMETRY"
  | "TRANSFORMATION_AND_PROCESS"
  | "STATISTICS_AND_PROBABILITY"
  | "MATHEMATICAL_MODELING"
  | "REAL_WORLD_EVIDENCE";

export type ExtensionVisualFamily =
  | "LOGIC_AND_DISCRETE"
  | "ADVANCED_CALCULUS"
  | "APPLIED_MATHEMATICS";

export interface FamilySemanticContract {
  familyId: CoreVisualFamily | ExtensionVisualFamily | (string & {});
  required: readonly string[];
  conditional: readonly string[];
  invariants: readonly string[];
  forbiddenInference: readonly string[];
}

export const CORE_FAMILY_SEMANTIC_CONTRACTS: readonly FamilySemanticContract[] = Object.freeze([
  {
    familyId: "COORDINATE_AND_FUNCTION",
    required: ["coordinate mapping", "view bounds", "scale definition", "mathematical relation/function/data source"],
    conditional: ["domain when restricted or non-default", "axis labels when ambiguity is possible", "points only when mathematically or pedagogically relevant", "legend/direct labels when multiple curves are otherwise ambiguous"],
    invariants: ["plotted geometry matches verified relation", "ticks match scale", "discontinuities are preserved", "asymptotes are not rendered as part of the curve"],
    forbiddenInference: ["freehand curve approximation", "unverified intercept", "invented domain restriction", "invented asymptote"],
  },
  {
    familyId: "PLANE_GEOMETRY",
    required: ["validated points/entities", "incidence/topology", "declared or proven constraints", "view/bounds"],
    conditional: ["metric data when the task depends on length or angle", "relation markers only for source-given or proven relations"],
    invariants: ["topological fidelity is exact", "relation markers match validated constraints", "labels remain associated with owners"],
    forbiddenInference: ["invented perpendicularity", "invented parallelism", "invented midpoint", "invented equality marker"],
  },
  {
    familyId: "SPATIAL_GEOMETRY",
    required: ["validated 3D topology", "point/edge/face incidence", "projection/view definition", "visibility result or deterministic visibility inputs"],
    conditional: ["metric fidelity only when required by the task", "hidden-edge rendering only after visibility classification"],
    invariants: ["projection does not change semantic incidence", "visible/hidden classification derives from geometry plus view", "topology remains exact"],
    forbiddenInference: ["hidden edge chosen by appearance", "visual crossing interpreted as spatial intersection", "invented face/edge", "artistic perspective used as geometry truth"],
  },
]);

export interface LabelPlacementPolicy {
  ownerType: string;
  preferredZones: readonly string[];
  preferredAnchors: readonly string[];
  forbiddenRegions: readonly string[];
  minimumClearancePolicy: string;
  collisionPolicy: "FAIL" | "RESCORE" | "HUMAN_REVIEW_IF_AMBIGUOUS";
}

export interface SourceEvidenceManifest {
  id: string;
  sourceHash: string;
  sourceUri?: string;
  licenseEvidence: string;
  captureOrMeasurementMethod?: string;
  measurementUncertainty?: string;
  units?: string;
  verificationAuthority: string;
  sourceVersion: string;
  locationRequired: boolean;
  mathematicalAbstraction: {
    objectIds: readonly string[];
    constraintIds: readonly string[];
  };
}

export type AutomationActor = "LLM_AI" | "DETERMINISTIC_ENGINE" | "HUMAN";

export interface AutomationBoundaryRule {
  layer: string;
  aiMay: readonly string[];
  deterministicEngineOwns: readonly string[];
  humanRequiredWhen: readonly string[];
  forbidden: readonly string[];
}

export const AUTOMATION_BOUNDARY: readonly AutomationBoundaryRule[] = Object.freeze([
  {
    layer: "SEMANTIC_IR",
    aiMay: ["propose parse", "surface ambiguity", "validate schema-level consistency"],
    deterministicEngineOwns: ["schema validation", "constraint execution where defined"],
    humanRequiredWhen: ["source meaning is genuinely ambiguous", "multiple incompatible semantic parses remain valid"],
    forbidden: ["invent missing mathematical facts", "silently upgrade uncertain relations to truth"],
  },
  {
    layer: "GEOMETRY_CONSTRUCTION",
    aiMay: ["propose construction plan from explicit evidence", "propose candidate hinge from source evidence"],
    deterministicEngineOwns: ["solve coordinates from constraints", "validate incidence", "compute visibility from geometry plus view"],
    humanRequiredWhen: ["multiple valid constructions change pedagogical meaning", "source does not disambiguate a required degree of freedom"],
    forbidden: ["choose hinge without evidence", "choose hidden edges by appearance", "invent geometry to make a render plausible"],
  },
  {
    layer: "LABEL_PLACEMENT",
    aiMay: ["propose candidate anchors", "propose ownership-aware zones"],
    deterministicEngineOwns: ["collision scoring", "bounds checks", "clearance scoring", "select unique candidate above threshold"],
    humanRequiredWhen: ["multiple candidates remain tied or materially ambiguous", "golden review for a new pattern"],
    forbidden: ["accept overlap with required geometry", "place a label where ownership becomes ambiguous"],
  },
  {
    layer: "VIEW_AND_PROJECTION",
    aiMay: ["propose a pedagogically useful view within allowed fidelity metadata"],
    deterministicEngineOwns: ["projection", "depth/visibility classification", "safe-bounds computation"],
    humanRequiredWhen: ["multiple valid views materially change readability or pedagogy"],
    forbidden: ["change topology for composition", "override SOURCE_EXACT view fidelity"],
  },
  {
    layer: "OUTPUT",
    aiMay: ["draft accessible description from semantic IR"],
    deterministicEngineOwns: ["render", "apply MST profiles", "enforce minimum readable size", "serialize semantic alt-text data"],
    humanRequiredWhen: ["new golden accessibility wording", "unresolved size/readability tradeoff"],
    forbidden: ["shrink below readability thresholds", "use generative pixels as mathematical truth"],
  },
]);

export type FidelityLevel = "EXACT" | "NOT_TO_SCALE" | "SOURCE_PRESERVED" | "CONTROLLED" | "OPTIMIZED" | "UNKNOWN";

export interface FidelityVector {
  topological: FidelityLevel;
  metric: FidelityLevel;
  view: FidelityLevel;
}

export interface MaturityVector {
  specification: 0 | 1 | 2 | 3;
  golden: 0 | 1 | 2 | 3;
  negative: 0 | 1 | 2 | 3;
  label: 0 | 1 | 2 | 3;
  accessibility: 0 | 1 | 2 | 3;
  crossGrade: 0 | 1 | 2 | 3;
  deployment: 0 | 1 | 2 | 3;
  feedback: 0 | 1 | 2 | 3;
}

export type PatternReleaseState = "DRAFT" | "VALIDATED" | "PILOT" | "PRODUCTION" | "DEPRECATED";

export type ValidationGateId = "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8" | "G9";
export type ValidationSeverity = "BLOCKER" | "REVIEW_REQUIRED" | "WARNING";
export type ValidationOwner = "SOURCE_EVIDENCE" | "MATH_DOMAIN" | "GEOMETRY_ENGINE" | "NOTATION" | "PEDAGOGY" | "LAYOUT" | "ACCESSIBILITY";

export interface ValidationGateDefinition {
  id: ValidationGateId;
  name: string;
  owner: ValidationOwner;
}

export const UNIFIED_VISUAL_GATES: readonly ValidationGateDefinition[] = Object.freeze([
  { id: "G0", name: "SOURCE_AND_PROVENANCE", owner: "SOURCE_EVIDENCE" },
  { id: "G1", name: "MATHEMATICAL_SEMANTICS", owner: "MATH_DOMAIN" },
  { id: "G2", name: "RELATIONS_AND_CONSTRAINTS", owner: "MATH_DOMAIN" },
  { id: "G3", name: "GEOMETRY_CONSTRUCTION", owner: "GEOMETRY_ENGINE" },
  { id: "G4", name: "VIEW_AND_PROJECTION", owner: "GEOMETRY_ENGINE" },
  { id: "G5", name: "VISIBILITY", owner: "GEOMETRY_ENGINE" },
  { id: "G6", name: "MATHTYPE_COMPATIBLE_NOTATION", owner: "NOTATION" },
  { id: "G7", name: "PEDAGOGICAL_DISCLOSURE", owner: "PEDAGOGY" },
  { id: "G8", name: "VISUAL_AND_LAYOUT", owner: "LAYOUT" },
  { id: "G9", name: "OUTPUT_AND_ACCESSIBILITY", owner: "ACCESSIBILITY" },
]);

export const CONFLICT_RESOLUTION_POLICY = Object.freeze({
  rootCauseRule: "Fix the earliest failed gate before downstream gates.",
  rerunRule: "After a fix, recompute all downstream artifacts and rerun downstream gates.",
  regressionRule: "A new production defect should add a regression example when reproducible.",
});

export interface SharedPrimitivePolicy {
  primitive: "AXIS" | "GRID" | "POINT" | "LABEL" | "ARROW" | "REGION";
  baseRules: readonly string[];
  familyAdapters: readonly string[];
}

export const REUSABILITY_MAP: readonly SharedPrimitivePolicy[] = Object.freeze([
  { primitive: "AXIS", baseRules: ["validated scale", "owned labels", "tick/value consistency"], familyAdapters: ["COORDINATE_AND_FUNCTION", "STATISTICS_AND_PROBABILITY"] },
  { primitive: "GRID", baseRules: ["subordinate visual weight", "consistent spacing", "not semantic by itself"], familyAdapters: ["COORDINATE_AND_FUNCTION", "PLANE_GEOMETRY"] },
  { primitive: "POINT", baseRules: ["semantic owner", "readable marker", "no invented point"], familyAdapters: ["PLANE_GEOMETRY", "SPATIAL_GEOMETRY", "COORDINATE_AND_FUNCTION"] },
  { primitive: "LABEL", baseRules: ["owner association", "collision-free", "safe bounds"], familyAdapters: ["ALL"] },
  { primitive: "ARROW", baseRules: ["semantic arrow class", "direction is meaningful"], familyAdapters: ["PLANE_GEOMETRY", "TRANSFORMATION_AND_PROCESS", "COORDINATE_AND_FUNCTION"] },
  { primitive: "REGION", baseRules: ["boundary semantics preserved", "fill not sole information carrier"], familyAdapters: ["COORDINATE_AND_FUNCTION", "STATISTICS_AND_PROBABILITY"] },
]);

export interface PatternContract {
  id: string;
  familyId: CoreVisualFamily;
  required: readonly string[];
  expected: readonly string[];
  forbidden: readonly string[];
}

export const PILOT_PATTERN_CONTRACTS: readonly PatternContract[] = Object.freeze([
  {
    id: "TRIANGLE",
    familyId: "PLANE_GEOMETRY",
    required: ["three validated non-collinear vertices", "three boundary segments", "vertex-label ownership"],
    expected: ["correct adjacency", "relation markers only when validated", "collision-free labels"],
    forbidden: ["inferred right angle", "inferred equal sides", "invented midpoint", "overlapping required labels"],
  },
  {
    id: "FUNCTION_GRAPH",
    familyId: "COORDINATE_AND_FUNCTION",
    required: ["verified relation/function", "validated viewport", "validated scale"],
    expected: ["curve matches relation", "domain/discontinuities preserved", "axis/ticks consistent"],
    forbidden: ["freehand curve", "connection across discontinuity", "wrong scale", "invented intercept/asymptote"],
  },
  {
    id: "SPATIAL_LINE_PLANE",
    familyId: "SPATIAL_GEOMETRY",
    required: ["validated 3D relation graph", "projection metadata", "visibility inputs"],
    expected: ["semantic relations preserved under projection", "visible/hidden edges computed deterministically"],
    forbidden: ["visual crossing treated as 3D intersection", "hidden edge chosen artistically", "invented face/edge"],
  },
]);
