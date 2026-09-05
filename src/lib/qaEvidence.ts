import type {
  MathProblemIR,
  QAStatusType,
  VerificationReport,
  VideoSpecification,
} from "../types/mathSchema.js";
import type { MasterCanvasQaStatus } from "../types/cinematicCanvas.js";

export interface DerivedQaEvidence {
  geometry: QAStatusType;
  graph: QAStatusType;
  layout: QAStatusType;
  camera: QAStatusType;
  narration: QAStatusType;
  python: QAStatusType;
  manimRuntime: QAStatusType;
  frame: QAStatusType;
}

const normalize = (value: string | undefined) => (value ?? "").toLocaleLowerCase("vi-VN");

function combineCanvasQa(statuses: Array<MasterCanvasQaStatus | undefined>): QAStatusType {
  const present = statuses.filter((status): status is MasterCanvasQaStatus => Boolean(status));
  if (!present.length) return "NOT_TESTED";
  if (present.includes("FAIL")) return "FAIL";
  if (present.includes("NEED_SOURCE_VERIFICATION")) return "NEED_SOURCE_VERIFICATION";
  return present.every((status) => status === "PASS") ? "PASS" : "NOT_TESTED";
}

function mapVerificationCheckStatus(status: string | undefined): QAStatusType {
  if (status === "PASS") return "PASS";
  if (status === "FAIL") return "FAIL";
  if (status === "WARNING" || status === "NEED_MORE_INFORMATION") return "NEED_SOURCE_VERIFICATION";
  return "NOT_TESTED";
}

export function deriveQaEvidence(
  problemIR: MathProblemIR | null,
  verification: VerificationReport,
  videoSpec?: VideoSpecification | null,
): DerivedQaEvidence {
  const domain = normalize(problemIR?.domain);
  const problemText = normalize(problemIR?.problem);
  const topic = normalize(problemIR?.topic);

  const isGeometryDomain = domain.includes("hình") || domain.includes("không gian");
  const isGraphDomain =
    domain.includes("đồ thị") ||
    topic.includes("hàm số") ||
    topic.includes("đồ thị") ||
    problemText.includes("hàm số") ||
    problemText.includes("đồ thị") ||
    /\bf\s*\(\s*x\s*\)/iu.test(problemIR?.problem ?? "");

  const geometry = !isGeometryDomain
    ? "NOT_APPLICABLE"
    : verification.geometry_invariants
      ? verification.geometry_invariants.passed
        ? "PASS"
        : "FAIL"
      : "NOT_TESTED";

  const graphCheck = verification.checks?.find((check) =>
    /graph|đồ thị|hàm số|asymptote|tiệm cận|extrema|cực trị/iu.test(`${check.id} ${check.name}`),
  );
  const graph = !isGraphDomain
    ? "NOT_APPLICABLE"
    : mapVerificationCheckStatus(graphCheck?.status);

  const canvasQa = videoSpec?.masterCanvasQa;
  const layout = canvasQa
    ? combineCanvasQa([canvasQa.MASTER_CANVAS_QA, canvasQa.KNOWLEDGE_REGION_QA])
    : "NOT_TESTED";
  const camera = canvasQa
    ? combineCanvasQa([canvasQa.CAMERA_TARGET_QA, canvasQa.CAMERA_PLAN_QA])
    : "NOT_TESTED";

  const narration: QAStatusType = "NOT_TESTED";

  const renderStatus = videoSpec?.render_job?.status;
  const python: QAStatusType =
    renderStatus === "COMPLETED"
      ? "PASS"
      : renderStatus === "FAILED"
        ? "FAIL"
        : "NOT_TESTED";
  const manimRuntime: QAStatusType = python;
  const frame: QAStatusType = "NOT_TESTED";

  return {
    geometry,
    graph,
    layout,
    camera,
    narration,
    python,
    manimRuntime,
    frame,
  };
}
