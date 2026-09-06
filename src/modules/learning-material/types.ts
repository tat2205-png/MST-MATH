import type { ContentBlock, DocumentIR, PreservationStatus, Provenance } from "../document-engine/document-ir.js";

export const P01_PROFILE_ID = "P01_LEARNING_MATERIAL" as const;
export const P01_ICON_AUTHORITY = "PIMATH-DNA-SEMANTIC-ICONS-V1.1" as const;

export type P01ContentUnitKind = "SECTION" | "PARAGRAPH" | "TABLE";
export type P01VisualRequirementKind = "EQUATION" | "FIGURE" | "TABLE";

export interface P01ContentUnit {
  id: string;
  sourceBlockId: string;
  sourceLocation: string;
  order: number;
  kind: P01ContentUnitKind;
  content: ContentBlock[];
}

export interface P01ContentModel {
  schemaVersion: 1;
  sourceDocument: string;
  sourceHash: string;
  units: P01ContentUnit[];
}

export interface P01LessonBlueprint {
  strategy: "SOURCE_SEQUENCE";
  unitIds: string[];
}

export interface P01ActivityNode {
  id: string;
  kind: "SOURCE_UNIT";
  unitId: string;
}

export interface P01ActivityGraph {
  strategy: "SOURCE_SEQUENCE";
  nodes: P01ActivityNode[];
  edges: Array<{ from: string; to: string }>;
}

export interface P01VisualRequirement {
  id: string;
  kind: P01VisualRequirementKind;
  sourceUnitId: string;
  figureId?: string;
  sourceLocation?: string;
}

export interface P01LessonIR {
  schemaVersion: 1;
  kind: "P01_LESSON_IR";
  profileId: typeof P01_PROFILE_ID;
  iconAuthority: typeof P01_ICON_AUTHORITY;
  source: {
    document: string;
    sha256: string;
    provenance?: Provenance;
  };
  contentModel: P01ContentModel;
  blueprint: P01LessonBlueprint;
  activityGraph: P01ActivityGraph;
  visualRequirements: P01VisualRequirement[];
  document: DocumentIR;
  semanticSignature: string;
}

export interface P01QaFinding {
  code: string;
  status: PreservationStatus;
  message: string;
  objectId?: string;
}

export interface P01QaResult {
  state: "PASS" | "REVIEW" | "FAIL";
  findings: P01QaFinding[];
  semanticSignature: string;
  sourceBlockCount: number;
  lessonUnitCount: number;
  sourceFigureCount: number;
  referencedFigureCount: number;
  sourceMathCount: number;
  lessonMathCount: number;
}

export interface P01RenderedArtifact {
  format: "HTML" | "DOCX" | "PDF";
  bytes: Uint8Array;
  semanticSignature: string;
  warnings: string[];
}

export interface P01OutputBundle {
  lesson: P01LessonIR;
  qa: P01QaResult;
  artifacts: P01RenderedArtifact[];
}
