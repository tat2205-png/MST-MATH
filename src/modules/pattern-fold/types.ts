import type { Mat4, Vec2, Vec3 } from "../fold-3d/types.js";

export type PatternOuterKind = "circle" | "triangle" | "square" | "rectangle" | "convex_polygon";
export type PatternShapeRole = "CUT_OUT" | "HOLE" | "FOLD_FLAP" | "FOLD_REGION" | "MARKED_REGION" | "REFERENCE_SHAPE";
export type CutType = "FULL" | "PARTIAL";
export type FoldAssignment = "MOUNTAIN" | "VALLEY" | "UNASSIGNED";
export type PatternGeometry = { kind: "polygon"; vertices: Vec2[] } | { kind: "circle"; center: Vec2; radius: number };
export interface PatternBoundary { id: string; kind: PatternOuterKind; geometry: PatternGeometry; }
export interface PatternShape { id: string; geometry: PatternGeometry; role: PatternShapeRole; parentShapeId?: string; }
export interface PatternCut { id: string; points: Vec2[]; cutType: CutType; }
export interface PatternCrease { id: string; points: [Vec2, Vec2]; assignment: FoldAssignment; regionIds: [string, string]; targetAngleRadians?: number; order?: number; }
export interface PatternRegion { id: string; vertices: Vec2[]; holeShapeIds?: string[]; role?: "BASE" | "PANEL" | "FLAP"; }
export interface PatternSheet { id: string; boundary: PatternBoundary; shapes: PatternShape[]; cuts: PatternCut[]; creases: PatternCrease[]; regions: PatternRegion[]; rootRegionId: string; }
export interface PatternIssue { code: string; severity: "error" | "warning"; path: string; message: string; }
export interface PatternResult<T> { status: "PASS" | "FAIL" | "UNSUPPORTED"; value?: T; issues: PatternIssue[]; }
export interface PatternAdjacency { regionIds: [string, string]; creaseId: string; }
export interface PatternFoldEdge { id: string; parentRegionId: string; childRegionId: string; creaseId: string; axis: [Vec2, Vec2]; targetAngleRadians: number; assignment: FoldAssignment; order: number; }
export interface PatternTopology { sheet: PatternSheet; materialRegionIds: string[]; adjacency: PatternAdjacency[]; foldEdges: PatternFoldEdge[]; holes: PatternShape[]; markedShapes: PatternShape[]; }
export interface PatternFoldStep { creaseId: string; targetAngleRadians?: number; }
export interface PatternFoldSequence { id: string; steps: PatternFoldStep[]; }
export interface PatternRegionTransform { regionId: string; matrix: Mat4; transformedVertices: Array<{ position2D: Vec2; position3D: Vec3 }>; }
export interface PatternFoldState { currentStep: number; progress: number; regionTransforms: PatternRegionTransform[]; creaseAngles: Record<string, number>; }
export interface PatternFoldScene { id: string; sheet: PatternSheet; topology: PatternTopology; sequence: PatternFoldSequence; state: PatternFoldState; correspondence: Array<{ regionId: string; sourcePatternId: string }>; metadata: { rendererNeutral: true; engine: "pattern-fold-v1"; }; }
export interface PatternRendererBoundary { renderer: "svg" | "tikz" | "threejs" | "manim"; status: "PASS" | "PARTIAL" | "FAIL"; available: boolean; output?: string; scene?: PatternFoldScene; issues: PatternIssue[]; }
