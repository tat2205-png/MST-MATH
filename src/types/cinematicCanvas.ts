export type KnowledgeRegionType =
  | "TITLE"
  | "CONCEPT"
  | "FORMULA"
  | "EXAMPLE"
  | "GRAPH"
  | "GEOMETRY"
  | "ILLUSTRATION"
  | "SUMMARY";

export type KnowledgeRegion = {
  id: string;
  type: KnowledgeRegionType;
  title: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  contentIds: string[];
  narrationCueIds: string[];
  cameraTargetId?: string;
  sourceRefs?: string[];
};

export type CanvasConnection = {
  id: string;
  fromRegionId: string;
  toRegionId: string;
  style: "CURVED_RIBBON";
};

export type CameraTarget = {
  id: string;
  regionId: string;
  center: { x: number; y: number };
  frameWidth: number;
  requiredContentIds: string[];
};

export type CameraShotType =
  | "OVERVIEW"
  | "TRAVEL"
  | "FOCUS"
  | "PUSH_IN"
  | "SETTLE"
  | "READ"
  | "PULL_OUT";

export type CameraShot = {
  id: string;
  type: CameraShotType;
  targetId: string;
  narrationCueIds: string[];
  duration: number;
  sequenceIndex: number;
};

export type MasterCanvas = {
  id: string;
  title: string;
  width: number;
  height: number;
  centerRegionId: string;
  regions: KnowledgeRegion[];
  connections: CanvasConnection[];
  cameraTargets: CameraTarget[];
  cameraShots: CameraShot[];
};

export type MasterCanvasQaStatus = "PASS" | "FAIL" | "NEED_SOURCE_VERIFICATION";

export type MasterCanvasQa = {
  MASTER_CANVAS_QA: MasterCanvasQaStatus;
  KNOWLEDGE_REGION_QA: MasterCanvasQaStatus;
  CAMERA_TARGET_QA: MasterCanvasQaStatus;
  CAMERA_PLAN_QA: MasterCanvasQaStatus;
  details: string[];
};

export type MasterCanvasBuildResult = {
  masterCanvas: MasterCanvas | null;
  qa: MasterCanvasQa;
};
