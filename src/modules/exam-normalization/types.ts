import type { DocumentIR, ContentBlock, FigureRecord } from "../document-engine/document-ir.js";
import type { QuestionObject } from "../question-bank/types.js";
import type { FigureCompatibilityContract } from "../figure-exam-foundation/contracts.js";

export type ExamNormalizationProfile = "THPTQG" | "DGNL" | "SAT" | "VSAT" | "SCHOOL";
export interface ExamNormalizationOptions { exam: ExamNormalizationProfile; title?: string; sourceDocument?: string; figures?: ReadonlyMap<string, FigureCompatibilityContract>; }
export interface NormalizedQuestionPlacement { questionId: string; questionNumber?: number; blockIds: string[]; keepWithQuestion: boolean; figureIds: string[]; safeFigureBounds: Record<string, FigureCompatibilityContract["safeBoundingBox"]>; pageBreakBefore?: boolean; }
export interface NormalizedAnswerRegion { questionId: string; type: "CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"; labels: string[]; rows: number; }
export interface ExamPaginationMetadata { page: "A4 portrait"; profileId: string; keepQuestionTogether: boolean; pageBreakBeforeQuestionIds: string[]; placements: NormalizedQuestionPlacement[]; }
export interface NormalizedExamDocument { document: DocumentIR; pagination: ExamPaginationMetadata; answerRegions: NormalizedAnswerRegion[]; profileId: string; warnings: string[]; }
export type QuestionContent = { content: ContentBlock[]; kind: "STEM" | "OPTIONS" | "TRUE_FALSE" | "SHORT_ANSWER" };
export type ExamQuestionInput = QuestionObject;
export type FigureSource = FigureRecord;
