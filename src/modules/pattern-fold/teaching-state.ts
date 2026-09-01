import type { PatternFoldScene } from "./types.js";
export interface FoldTeachingState {
  parameters: Record<string, number>;
  foldProgress: number;
  showCutPieces: boolean;
  showSourceSheet: boolean;
  showFoldLines: boolean;
  showDimensions: boolean;
}
export const DEFAULT_FOLD_TEACHING_STATE: Readonly<FoldTeachingState> = { parameters: {}, foldProgress: 0,
  showCutPieces: true,
  showSourceSheet: true,
  showFoldLines: true,
  showDimensions: true };
export const createFoldTeachingState = (_scene: PatternFoldScene, foldProgress = 0): FoldTeachingState => ({ ...DEFAULT_FOLD_TEACHING_STATE, parameters: {}, foldProgress: Math.max(0, Math.min(1, foldProgress)) });
export const updateFoldTeachingState = (_scene: PatternFoldScene, state: FoldTeachingState, foldProgress: number): FoldTeachingState => ({ ...state, foldProgress: Math.max(0, Math.min(1, foldProgress)) });
