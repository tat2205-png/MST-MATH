/**
 * Canonical MathProblemIR & Math AI Video Studio Schema definitions
 */

export type MathDomain =
  | "Đại số & Giải tích"
  | "Hình học không gian"
  | "Hình học phẳng"
  | "Hình học tọa độ (Oxy/Oxyz)"
  | "Lượng giác"
  | "Tổ hợp - Xác suất"
  | "Thống kê"
  | "Bài toán tối ưu & Ứng dụng thực tế";

export type HighSchoolGrade = "Lớp 10" | "Lớp 11" | "Lớp 12" | "Ôn thi ĐGNL / THPT Quốc Gia";

export interface MathEntity {
  id: string;
  name: string;
  type: "point" | "line" | "plane" | "polyhedron" | "sphere" | "function" | "variable" | "set" | "vector" | "matrix";
  description?: string;
  latex?: string;
  relations?: string[];
}

export type ParseStatus =
  | "PASS"
  | "READY"
  | "COMPLETE"
  | "NEED_MORE_INFORMATION"
  | "WARNING"
  | "FAIL"
  | "AMBIGUOUS"
  | "INCONSISTENT";

export interface MathConstraint {
  id?: string;
  type: "domain" | "boundary" | "geometric" | "variable" | "inequality";
  expression: string;
  description?: string;
}

export interface MathProblemIR {
  problem_id?: string;
  problem: string;
  originalText?: string;
  normalizedText?: string;
  latex: string;
  domain: MathDomain;
  topic: string;
  grade: HighSchoolGrade;
  given: string[];
  find: string[];
  entities: MathEntity[];
  constraints: (string | MathConstraint)[];
  ambiguities: string[];
  confidence: number; // 0.0 to 1.0
  status: ParseStatus;
  missing_information_prompt?: string;
  raw_input?: string;
  input_source?: "text" | "image" | "pdf" | "docx";
  sourceOriginal?: string;
  sourceNormalized?: string;
  providerExtraction?: string;
  sourceHash?: string;
  normalizedSourceHash?: string;
  provenance?: ProvenanceRecord[];
}

export type ProvenanceKind = "SOURCE_LITERAL" | "SOURCE_EXTRACTED_UNVERIFIED" | "DETERMINISTIC_DERIVED" | "PROVIDER_INFERRED";

export interface ProvenanceRecord {
  id: string;
  kind: ProvenanceKind;
  value: string;
  sourceField?: string;
  sourceSpan?: { start?: number; end?: number };
  derivedFrom?: string[];
  derivationRule?: string;
  trustedForAutomation: boolean;
}

export interface DetailedStep {
  step_number: number;
  title: string;
  explanation: string;
  math_latex: string;
  pedagogical_notes?: string;
  key_theorems_used?: string[];
}

export interface MathSolution {
  section_1_analysis: {
    problem_essence: string;
    identified_pattern: string;
    pitfalls_and_traps: string[];
    core_theorems: string[];
  };
  section_2_approach: {
    strategy_overview: string;
    roadmap_steps: string[];
    formulas_needed: string[];
  };
  section_3_detailed_steps: DetailedStep[];
  final_answer: {
    value: string;
    latex: string;
    summary_text: string;
  };
  verification_data?: Record<string, any>;
  teacher_tips: string[];
}

export type SolutionIR = MathSolution;

export type VerificationStatus = "PASS" | "WARNING" | "FAIL" | "NEED_MORE_INFORMATION";

export interface CheckItem {
  id: string;
  name: string;
  status: VerificationStatus;
  details: string;
  evidence?: string;
}

export interface VerificationReport {
  verification_seal: "CONFIRMED_VALID" | "FLAGGED_CONCERNS";
  status: VerificationStatus;
  verificationSource?: "PROVIDER" | "DETERMINISTIC" | "HYBRID";
  deterministicVerification?: DeterministicVerificationResult | DeterministicInequalityResult;
  checks?: CheckItem[];
  symbolic_correctness: { passed: boolean; notes: string; sample_tests?: string[] };
  numeric_soundness: { passed: boolean; notes: string; sample_tests?: string[] };
  logical_deduction: { passed: boolean; notes: string };
  geometry_invariants: { passed: boolean; notes: string };
  domain_and_boundaries: { passed: boolean; notes: string };
  units_and_dimensions: { passed: boolean; notes: string };
  counter_example_search: { found_counter_example: boolean; details: string };
  discrepancies: string[];
}

export type DeterministicVerificationStatus =
  | "DETERMINISTIC_PASS"
  | "DETERMINISTIC_FAIL"
  | "UNSUPPORTED"
  | "HUMAN_REVIEW_REQUIRED";

export type DeterministicProblemType = "LINEAR_EQUATION" | "QUADRATIC_EQUATION" | "LINEAR_INEQUALITY" | "QUADRATIC_INEQUALITY" | "RATIONAL_INEQUALITY" | "UNSUPPORTED";

export interface InequalityInterval {
  left: string;
  right: string;
  leftClosed: boolean;
  rightClosed: boolean;
}

export interface DeterministicInequalityResult {
  status: DeterministicVerificationStatus;
  engine: "DETERMINISTIC_V1";
  problemType: "LINEAR_INEQUALITY" | "QUADRATIC_INEQUALITY" | "RATIONAL_INEQUALITY";
  variable: string;
  expectedSolutionSet?: { intervals: InequalityInterval[] };
  candidateSolutionSet?: { intervals: InequalityInterval[] };
  criticalPoints: string[];
  signAnalysis: Array<{ interval: InequalityInterval; sign: "POSITIVE" | "NEGATIVE" | "ZERO" }>;
  checks: DeterministicVerificationCheck[];
  reasons: string[];
  sourceEquation?: string;
  normalizedSourceEquation?: string;
  sourceHash?: string;
  provenance?: ProvenanceRecord[];
}

export interface DeterministicVerificationCheck {
  type: string;
  passed: boolean;
  detail: string;
}

export interface DeterministicVerificationResult {
  status: DeterministicVerificationStatus;
  engine: "DETERMINISTIC_V1";
  problemType: DeterministicProblemType;
  variable?: string;
  expectedSolutions?: string[];
  candidateSolutions?: string[];
  checks: DeterministicVerificationCheck[];
  reasons: string[];
  sourceEquation?: string;
  normalizedSourceEquation?: string;
  transformedEquation?: string;
  domainChecks?: Array<{
    expression: string;
    restriction: string;
    passed: boolean;
    reason: string;
  }>;
  excludedValues?: string[];
  extraneousSolutions?: string[];
  verifiedSolutions?: string[];
  transformations?: Array<{
    type: "CLEAR_DENOMINATOR" | "SQUARE_BOTH_SIDES";
    before: string;
    after: string;
    mayIntroduceExtraneousRoots: boolean;
  }>;
  provenance?: ProvenanceRecord[];
  sourceHash?: string;
  normalizedSourceHash?: string;
}

export type VerificationResult = VerificationReport;
export type MathVerification = VerificationReport;

export type VisualType =
  | "NONE"
  | "GEOMETRY_2D"
  | "GEOMETRY_3D"
  | "COORDINATE_GRAPH"
  | "FUNCTION_GRAPH"
  | "PROBABILITY"
  | "MIN_MAX"
  | "STATISTICS";

export interface VisualElement {
  id: string;
  type: "point" | "segment" | "line" | "polygon" | "circle" | "plane" | "polyhedron" | "curve" | "vector" | "angle" | "right_angle" | "axis" | "grid" | "label" | "shaded_region";
  label?: string;
  coords?: number[]; // [x, y] or [x, y, z]
  from?: number[];
  to?: number[];
  points?: number[][];
  equation?: string; // e.g. "x^3 - 3*x^2 + 2"
  color?: string;
  style?: "solid" | "dashed" | "dotted";
  width?: number;
  fill?: string;
  fill_opacity?: number;
  highlight?: boolean;
}

export interface VisualSpecification {
  visual_type: VisualType;
  title: string;
  description: string;
  view_mode: "2d" | "3d" | "graph";
  coordinate_system: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
    z_min?: number;
    z_max?: number;
    axis_labels?: { x: string; y: string; z?: string };
  };
  elements: VisualElement[];
  camera_angles?: { azimuth: number; elevation: number; distance: number };
  tikz_code?: string;
  asymptote_code?: string;
  geogebra_commands?: string[];
}

export interface ManimAnimation {
  type: "Create" | "Write" | "Transform" | "FadeIn" | "Indicate" | "Rotate" | "MoveTo" | "FadeOut" | "Circumscribe";
  target: string;
  duration: number;
  params?: Record<string, any>;
}

export interface ManimScene {
  scene_id: string;
  scene_index: number;
  title: string;
  learning_goal: string;
  math_content: {
    latex: string;
    explanation: string;
  };
  visual_objects: string[];
  animations: ManimAnimation[];
  narration: {
    text_vi: string;
    voice_tone: "formal_teacher" | "enthusiastic" | "step_by_step";
    duration_hint_seconds: number;
  };
}

export interface VideoSpecification {
  video_title: string;
  total_duration_seconds: number;
  target_aspect_ratio: "16:9" | "9:16";
  resolution: "1080p" | "720p";
  scenes: ManimScene[];
  manim_python_code: string;
  masterCanvas?: import("./cinematicCanvas.js").MasterCanvas;
  masterCanvasQa?: import("./cinematicCanvas.js").MasterCanvasQa;
  render_job?: {
    job_id: string;
    status: "IDLE" | "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED";
    progress: number;
    logs: string[];
    video_url?: string;
    started_at?: string;
    completed_at?: string;
    error?: string;
  };
}

export type ProviderType = "gemini" | "openai" | "deepseek";

export type VideoStyleType =
  | "cinematic_infographic"
  | "standard_manim"
  | "geometry_focus"
  | "graph_animation"
  | "whiteboard"
  | "custom_reference";

export type SkillModeType = "AUTO" | "MANUAL";

export type SkillModuleId =
  | "STYLE_REFERENCE_FACEBOOK_V1"
  | "CAMERA_DIRECTOR"
  | "VISUAL_SYSTEM"
  | "MATH_GEOMETRY_QA"
  | "NARRATION_SYNC"
  | "WORKFLOW";

export interface SafetyLocks {
  mathLock: boolean;
  geometryLock: boolean;
  zeroInference: boolean;
}

export type QAStatusValue =
  | "PASS"
  | "FAIL"
  | "NOT_TESTED"
  | "NOT_APPLICABLE"
  | "NEED_SOURCE_VERIFICATION";

export type QAStatusType = QAStatusValue;

export interface QADimensionResult {
  status: QAStatusValue;
  details?: string;
  scope?: string;
}

export type FinalQAStatus =
  | "RENDER_READY"
  | "QA_FAILED"
  | "NEED_SOURCE_VERIFICATION"
  | "NEED_MATH_VERIFICATION"
  | "RUNTIME_NOT_TESTED";

export interface ComprehensiveQAReport {
  math_qa: QAStatusValue;
  geometry_qa: QAStatusValue;
  graph_qa: QAStatusValue;
  layout_qa: QAStatusValue;
  camera_qa: QAStatusValue;
  narration_qa: QAStatusValue;
  python_qa: QAStatusValue;
  manim_runtime_qa: QAStatusValue;
  frame_qa: QAStatusValue;
  overall_status: FinalQAStatus;
  details?: Record<string, string>;
}

export interface VideoPipelineStageItem {
  id: string;
  name: string;
  status: "WAITING" | "RUNNING" | "PASS" | "FAIL";
  message?: string;
}

export interface SkillMetadataSafe {
  name: string;
  title: string;
  version: string;
  status: "ACTIVE" | "INACTIVE";
  description: string;
  availableModules: {
    id: SkillModuleId;
    label: string;
    description: string;
    isCoreRequired?: boolean;
  }[];
}

export * from "./graphSchema.js";
import { GraphSpec } from "./graphSchema.js";

export interface AIProviderInfo {
  id: ProviderType;
  name: string;
  model: string;
  badge: string;
  isAvailable: boolean;
  notes?: string;
}

export interface AppState {
  currentTab: "input" | "parsed" | "solution" | "visual" | "video" | "qa";
  inputMethod: "text" | "image" | "pdf" | "docx" | "preset";
  selectedProvider: ProviderType;
  isProcessing: boolean;
  processStage?: string;
  processProgress?: number;
  error?: string | null;
  
  // Pipeline outputs
  problemIR: MathProblemIR | null;
  solution: MathSolution | null;
  verification: MathVerification | null;
  visualSpec: VisualSpecification | null;
  graphSpec?: GraphSpec | null;
  videoSpec: VideoSpecification | null;
  
  // Step 5 state
  videoStyle: VideoStyleType;
  skillMode: SkillModeType;
  manualModules: Record<SkillModuleId, boolean>;
  safetyLocks: SafetyLocks;
  qaReport: ComprehensiveQAReport | null;
}
