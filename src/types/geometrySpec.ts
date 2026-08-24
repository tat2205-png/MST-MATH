export type GeometryObjectType = "POLYGON_2D" | "COORDINATE_2D" | "POLYHEDRON" | "POLYHEDRON_NET";

export interface GeometryVertex { id: string; x: number; y: number; z?: number; }
export interface GeometryEdge { id: string; vertices: [string, string]; }
export interface GeometryFace { id: string; vertices: string[]; }
export interface GeometryLabel { id: string; text: string; vertex?: string; position?: [number, number]; }
export interface GeometryDimension { id: string; edge: string; value: number; unit?: string; label: string; }
export interface GeometryNet {
  rootFace: string;
  faceCoordinates: Record<string, Array<[number, number]>>;
  adjacency: Array<{ faces: [string, string]; hingeEdge: string }>;
}

export interface GeometrySpec {
  schemaVersion: "1.0";
  taskId: string;
  geometryType: GeometryObjectType;
  vertices: GeometryVertex[];
  edges: GeometryEdge[];
  faces: GeometryFace[];
  labels: GeometryLabel[];
  dimensions: GeometryDimension[];
  adjacency: Array<{ faces: [string, string]; edge: string }>;
  renderOptions: { outputFormat: "PDF_SVG"; widthCm?: number; heightCm?: number; strokeColor?: string };
  net?: GeometryNet;
  sourceFingerprint: string;
}

export interface GeometryValidationReport {
  status: "PASS" | "FAIL";
  checks: Record<string, "PASS" | "FAIL" | "NOT_APPLICABLE">;
  errors: string[];
}

export interface GeometryArtifactResult {
  engine: "LUADRAW";
  status: "PASS" | "FAIL";
  pdfPath?: string;
  svgPath?: string;
  metadataPath?: string;
  qaPath?: string;
  sourceFingerprint: string;
  error?: string;
}
