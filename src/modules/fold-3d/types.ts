import type { MathScene } from "../math-ir/index.js";

export type SupportedFoldSolid = "cube" | "rectangular_prism" | "triangular_prism" | "tetrahedron" | "square_pyramid";
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Mat4 = [number,number,number,number, number,number,number,number, number,number,number,number, number,number,number,number];

export interface FoldIssue { code: string; severity: "error" | "warning"; path: string; message: string; }
export interface FoldValidationResult { status: "PASS" | "FAIL"; issues: FoldIssue[]; }

export interface FoldVertex { id: string; sourceEntityId: string; foldedPosition: Vec3; origin: "source" | "visual_only"; }
export interface FoldEdge { id: string; sourceEntityId: string; vertexIds: [string, string]; incidentFaceIds: string[]; boundary: boolean; }
export interface FoldFace { id: string; sourceEntityId: string; vertexIds: string[]; edgeIds: string[]; normal: Vec3; }
export interface FaceAdjacency { faceIds: [string, string]; sharedEdgeId: string; }

export interface FoldTopology {
  id: string;
  solidId: string;
  solidType: SupportedFoldSolid;
  sourceSceneId: string;
  sourceScene: MathScene;
  vertices: FoldVertex[];
  edges: FoldEdge[];
  faces: FoldFace[];
  adjacency: FaceAdjacency[];
  metadata: { dimensions: Record<string, number>; origin: "source" | "visual_only" };
}

export interface NetFaceVertex { vertexId: string; position: Vec2; }
export interface NetFace { faceId: string; sourceFaceId: string; vertices: NetFaceVertex[]; }
export interface FoldHinge {
  id: string;
  parentFaceId: string;
  childFaceId: string;
  sharedEdgeId: string;
  axisVertexIds: [string, string];
  targetAngleRadians: number;
  foldDirection: 1 | -1;
}

export interface NetLayout {
  id: string;
  solidId: string;
  topologyId: string;
  rootFaceId: string;
  faces: NetFace[];
  hinges: FoldHinge[];
  variant: "canonical-v1";
}

export interface FaceTransform { faceId: string; matrix: Mat4; transformedVertices: Array<{ vertexId: string; position: Vec3 }>; }
export interface FoldState { progress: number; faceTransforms: FaceTransform[]; }
export interface FoldScene {
  id: string;
  solidId: string;
  solidType: SupportedFoldSolid;
  topology: FoldTopology;
  net: NetLayout;
  state: FoldState;
  faceCorrespondence: Array<{ netFaceId: string; solidFaceId: string; sourceFaceId: string }>;
  edgeCorrespondence: Array<{ netEdgeId: string; solidEdgeId: string; sourceEdgeId: string }>;
  cameraHints: { target: Vec3; projection: "perspective" };
  metadata: { rendererNeutral: true; origin: "source" | "visual_only" };
}

export interface FoldBuildResult<T> { status: "PASS" | "FAIL" | "UNSUPPORTED"; value?: T; issues: FoldIssue[]; }
export interface FoldRendererBoundaryResult { status: "PASS" | "PARTIAL" | "FAIL"; renderer: "threejs" | "manim" | "svg" | "tikz"; available: boolean; scene?: FoldScene; issues: FoldIssue[]; }
