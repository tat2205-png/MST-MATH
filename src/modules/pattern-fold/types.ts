import type { Mat4, Vec2, Vec3 } from "../fold-3d/types.js";

export type PatternOuterKind = "circle" | "triangle" | "square" | "rectangle" | "convex_polygon";
export type PatternShapeRole = "CUT_OUT" | "HOLE" | "FOLD_FLAP" | "FOLD_REGION" | "MARKED_REGION" | "REFERENCE_SHAPE";
export type CutType = "FULL" | "PARTIAL";
export type FoldAssignment = "MOUNTAIN" | "VALLEY" | "UNASSIGNED";
export type PatternGeometry = { kind: "polygon"; vertices: Vec2[] } | { kind: "circle"; center: Vec2; radius: number };
export type PatternSourceShape =
  | { type: "SQUARE"; side: number }
  | { type: "RECTANGLE"; width: number; height: number }
  | { type: "TRIANGLE"; a: number; b: number; c: number }
  | { type: "CIRCLE"; center: Vec2; radius: number };
export type GridType = "AUTO" | "CARTESIAN" | "TRIANGULAR_60" | "POLAR_REFERENCE";
export interface GridSettings { visible: boolean; type: GridType; spacing: number; snapGrid: boolean; snapVertex: boolean; snapMidpoint: boolean; snapIntersection: boolean; snapBoundary: boolean; }
export type ObjectFreedom = "FREE" | "PATH_BOUND" | "DEPENDENT";
export type ConstructionOperationType = "CREATE_FREE_POINT" | "CREATE_POINT_ON_CIRCLE" | "CREATE_SEGMENT" | "CREATE_CIRCLE" | "MIDPOINT" | "MIRROR" | "SET_SEGMENT_AS_GUIDE" | "SET_SEGMENT_AS_CUT" | "SET_SEGMENT_AS_CREASE" | "PARTITION_REGIONS" | "DISCARD_REGION" | "FOLD_POINT_TO_POINT" | "FOLD_EDGE_TO_EDGE" | "JOIN_EDGES";
export interface ConstructionOperation { id: string; type: ConstructionOperationType; inputs: string[]; outputs: string[]; parameters?: Record<string, string | number | boolean>; }
export interface ConstructionPoint { id: string; position: Vec2; label?: string; labelVisible?: boolean; freedom?: ObjectFreedom; constructionKind?: "FREE_POINT" | "POINT_ON_CIRCLE" | "MIDPOINT" | "MIRROR"; parentIds?: string[]; pathId?: string; symmetryPairId?: string; }
export type ConstructionSemantic = "NEUTRAL" | "GUIDE" | "CUT" | "CREASE";
export interface ConstructionSegment { id: string; pointIds: [string,string]; label?: string; semantic: ConstructionSemantic; symmetryPairId?: string; }
export interface ConstructionCircle { id: string; centerPointId: string; radius: number; label?: string; semantic: "NEUTRAL" | "GUIDE" | "CUT"; symmetryPairId?: string; }
export interface SymmetryGuide { id: string; type: "VERTICAL_AXIS" | "HORIZONTAL_AXIS" | "CUSTOM_LINE"; points: [Vec2,Vec2]; }
export interface SymmetryPair { id: string; sourceId: string; mirrorId: string; guideId: string; }
export interface PatternConstruction { grid: GridSettings; points: ConstructionPoint[]; segments: ConstructionSegment[]; circles: ConstructionCircle[]; symmetryGuides: SymmetryGuide[]; symmetryPairs: SymmetryPair[]; operations?: ConstructionOperation[]; }
export interface RemovedPatternRegion { id: string; vertices: Vec2[]; status: "DISCARDED"; }
export interface PatternBoundary { id: string; kind: PatternOuterKind; geometry: PatternGeometry; }
export interface PatternShape { id: string; geometry: PatternGeometry; role: PatternShapeRole; parentShapeId?: string; }
export interface PatternCut { id: string; points: Vec2[]; cutType: CutType; }
export interface PatternCrease { id: string; points: [Vec2, Vec2]; assignment: FoldAssignment; regionIds: [string, string]; fixedRegionId?: string; movingRegionId?: string; foldSide?: "A" | "B"; targetAngleRadians?: number; order?: number; symmetryPairId?: string; }
export type PatternBoundarySegment={kind:"line";start:Vec2;end:Vec2}|{kind:"arc";center:Vec2;radius:number;startAngle:number;endAngle:number;counterclockwise:boolean};
export interface PatternRegion { id: string; vertices: Vec2[]; boundarySegments?:PatternBoundarySegment[]; holeShapeIds?: string[]; role?: "BASE" | "PANEL" | "FLAP"; status?: "KEEP" | "DISCARD_PREVIEW"; }
export interface PatternSheet { id: string; sourceShape?: PatternSourceShape; boundary: PatternBoundary; shapes: PatternShape[]; cuts: PatternCut[]; creases: PatternCrease[]; regions: PatternRegion[]; rootRegionId: string; construction?: PatternConstruction; removedRegions?: RemovedPatternRegion[]; }
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
