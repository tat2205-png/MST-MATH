export type GraphStatus = "PASS" | "WARNING" | "FAIL" | "UNAVAILABLE";

export type GraphType =
  | "linear"
  | "quadratic"
  | "cubic"
  | "polynomial"
  | "rational"
  | "radical"
  | "exponential"
  | "logarithmic"
  | "trigonometric"
  | "absolute_value"
  | "piecewise"
  | "unsupported";

export interface GraphDomainInterval {
  min: number | "-inf";
  max: number | "inf";
  minInclusive: boolean;
  maxInclusive: boolean;
}

export interface GraphDomain {
  type: "all_reals" | "intervals" | "unsupported";
  intervals: GraphDomainInterval[];
  rawText: string;
  latex: string;
}

export interface KeyPoint {
  id: string;
  type:
    | "root"
    | "x_intercept"
    | "y_intercept"
    | "vertex"
    | "local_min"
    | "local_max"
    | "inflection"
    | "start_point"
    | "hole"
    | "generic";
  x: number;
  y: number;
  label: string;
  latex?: string;
  color?: string;
  description?: string;
}

export interface Asymptote {
  type: "vertical" | "horizontal" | "oblique";
  position: number; // For vertical: x = position, for horizontal: y = position
  equation: string;
  latex: string;
  slope?: number;
  intercept?: number;
}

export interface GraphFeatures {
  xIntercepts: KeyPoint[];
  yIntercept: KeyPoint | null;
  vertex: KeyPoint | null;
  criticalPoints: KeyPoint[];
  turningPoints: KeyPoint[];
  inflectionPoints: KeyPoint[];
  verticalAsymptotes: Asymptote[];
  horizontalAsymptotes: Asymptote[];
  obliqueAsymptotes: Asymptote[];
  holes: KeyPoint[];
  discontinuities: number[];
  openingDirection?: "up" | "down" | "none";
  symmetryAxis?: { x: number; latex: string } | null;
  period?: number;
  amplitude?: number;
}

export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphBranch {
  branchId: number;
  points: GraphPoint[];
  domainMin: number;
  domainMax: number;
}

export interface GraphViewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xStep: number;
  yStep: number;
}

export interface GraphCheckItem {
  id: string;
  name: string;
  status: "PASS" | "WARNING" | "FAIL";
  details: string;
  evidence?: string;
}

export interface GraphVerification {
  status: GraphStatus;
  checks: GraphCheckItem[];
  verifiedAt: string;
  notes?: string;
}

export interface GraphRenderingConfig {
  showAxes: boolean;
  showGrid: boolean;
  showLabels: boolean;
  showKeyPoints: boolean;
  showAsymptotes: boolean;
  lineColor: string;
  lineWidth: number;
}

export interface GraphError {
  code:
    | "FUNCTION_NOT_FOUND"
    | "FUNCTION_PARSE_ERROR"
    | "DOMAIN_ANALYSIS_ERROR"
    | "FEATURE_ANALYSIS_ERROR"
    | "SAMPLING_ERROR"
    | "RENDER_ERROR"
    | "GRAPH_VERIFICATION_FAIL"
    | "UNSUPPORTED_FUNCTION_TYPE";
  message: string;
  details?: string;
}

export interface GraphSpec {
  status: GraphStatus;
  graphType: GraphType;
  inputExpression: string;
  normalizedExpression: string;
  variable: string;
  associatedProblemNotice?: string;
  domain: GraphDomain;
  range?: string | null;
  features: GraphFeatures;
  sampling: {
    window: GraphViewport;
    branches: GraphBranch[];
    totalPoints: number;
  };
  rendering: GraphRenderingConfig;
  verification: GraphVerification;
  error?: GraphError | null;
}
