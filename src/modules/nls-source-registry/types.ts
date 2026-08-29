export const NLS_SOURCE_IDS = [
  "KNTT-MATH-10-T1", "KNTT-MATH-10-T2", "KNTT-MATH-10-CD",
  "KNTT-MATH-11-T1", "KNTT-MATH-11-T2", "KNTT-MATH-11-CD",
  "KNTT-MATH-12-T1", "KNTT-MATH-12-T2", "KNTT-MATH-12-CD",
] as const;

export type NlsSourceId = typeof NLS_SOURCE_IDS[number];
export type NlsGrade = 10 | 11 | 12;
export type NlsVolumeType = "textbook_volume_1" | "textbook_volume_2" | "specialized_topic";
export type TextLayerStatus = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "UNKNOWN";
export type ValidationStatus = "PASS" | "FAIL";

export interface NlsSourceDefinition {
  sourceId: NlsSourceId;
  grade: NlsGrade;
  volumeType: NlsVolumeType;
  filename: string;
}

export interface NlsSourceRecord extends NlsSourceDefinition {
  subject: "MATHEMATICS";
  series: "KET_NOI_TRI_THUC";
  curriculum: "GDPT_2018";
  language: "vi-VN";
  sourceKind: "REFERENCE_PDF";
  sourcePolicy: "READ_ONLY";
  relativePath: string;
  fileExtension: ".pdf";
  mimeType: "application/pdf";
  fileSize: number;
  modifiedAt: string;
  sha256: string;
  pageCount: number;
  textLayerStatus: TextLayerStatus;
  metadataReadable: boolean;
  validationStatus: ValidationStatus;
}

export interface NlsSourceManifest {
  schemaVersion: 1;
  program: "NA_MATH_NLS";
  sourceRootEnvironmentVariable: "NA_MATH_NLS_SOURCE_ROOT";
  expectedSourceCount: 9;
  sources: NlsSourceRecord[];
}
