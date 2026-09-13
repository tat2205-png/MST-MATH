import type { ContentBlock, DocumentIR, FigureRecord } from "../document-engine/document-ir.js";
import type { QuestionObject } from "../question-bank/types.js";

export type ExamNormalizationProfile = "THPTQG" | "DGNL" | "SAT" | "VSAT" | "SCHOOL";
export interface SafeFigureBoundingBox { x: number; y: number; width: number; height: number; }
export interface ExamNormalizationOptions { exam: ExamNormalizationProfile; title?: string; sourceDocument?: string; figures?: ReadonlyMap<string, { safeBoundingBox: SafeFigureBoundingBox }> }
export interface NormalizedQuestionPlacement { questionId: string; questionNumber?: number; blockIds: string[]; keepWithQuestion: boolean; figureIds: string[]; safeFigureBounds: Record<string, SafeFigureBoundingBox | undefined>; pageBreakBefore?: boolean; }
export interface NormalizedAnswerRegion { questionId: string; type: "CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"; labels: string[]; rows: number; }
export interface ExamPaginationMetadata { page: "A4 portrait"; profileId: string; keepQuestionTogether: boolean; pageBreakBeforeQuestionIds: string[]; placements: NormalizedQuestionPlacement[]; }
export interface NormalizedExamDocument { document: DocumentIR; pagination: ExamPaginationMetadata; answerRegions: NormalizedAnswerRegion[]; profileId: string; warnings: string[]; }
export type QuestionContent = { content: ContentBlock[]; kind: "STEM" | "OPTIONS" | "TRUE_FALSE" | "SHORT_ANSWER" };
export type ExamQuestionInput = QuestionObject;
export type FigureSource = FigureRecord;
