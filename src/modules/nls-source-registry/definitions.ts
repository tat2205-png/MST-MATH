import type { NlsSourceDefinition } from "./types.js";

export const KNTT_SOURCE_DEFINITIONS: readonly NlsSourceDefinition[] = Object.freeze([
  { sourceId: "KNTT-MATH-10-T1", grade: 10, volumeType: "textbook_volume_1", filename: "Toan10-Tap1-KNTT.pdf" },
  { sourceId: "KNTT-MATH-10-T2", grade: 10, volumeType: "textbook_volume_2", filename: "Toan10-Tap2-KNTT.pdf" },
  { sourceId: "KNTT-MATH-10-CD", grade: 10, volumeType: "specialized_topic", filename: "Toan10-ChuyenDe-KNTT.pdf" },
  { sourceId: "KNTT-MATH-11-T1", grade: 11, volumeType: "textbook_volume_1", filename: "Toan11-Tap1-KNTT.pdf" },
  { sourceId: "KNTT-MATH-11-T2", grade: 11, volumeType: "textbook_volume_2", filename: "Toan11-Tap2-KNTT.pdf" },
  { sourceId: "KNTT-MATH-11-CD", grade: 11, volumeType: "specialized_topic", filename: "Toan11-ChuyenDe-KNTT.pdf" },
  { sourceId: "KNTT-MATH-12-T1", grade: 12, volumeType: "textbook_volume_1", filename: "Toan12-Tap1-KNTT.pdf" },
  { sourceId: "KNTT-MATH-12-T2", grade: 12, volumeType: "textbook_volume_2", filename: "Toan12-Tap2-KNTT.pdf" },
  { sourceId: "KNTT-MATH-12-CD", grade: 12, volumeType: "specialized_topic", filename: "Toan12-ChuyenDe-KNTT.pdf" },
]);

export const DEFAULT_NLS_SOURCE_ROOT = "D:\\NA-MATH-NLS-AI-SOURCES";
export const DEFAULT_NLS_CLEAN_SOURCE_ROOT = "D:\\NA-MATH-NLS-AI-SOURCES-CLEAN";
export const resolveNlsSourceRoot = (environment: NodeJS.ProcessEnv = process.env): string =>
  environment.NA_MATH_NLS_SOURCE_ROOT?.trim() || DEFAULT_NLS_SOURCE_ROOT;
export const resolveNlsCleanSourceRoot = (environment: NodeJS.ProcessEnv = process.env): string =>
  environment.NA_MATH_NLS_CLEAN_SOURCE_ROOT?.trim() || DEFAULT_NLS_CLEAN_SOURCE_ROOT;
