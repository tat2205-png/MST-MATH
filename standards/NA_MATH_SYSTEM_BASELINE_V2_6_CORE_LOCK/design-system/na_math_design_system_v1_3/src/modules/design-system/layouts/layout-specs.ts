export type LayoutKind = 'document' | 'worksheet' | 'assessment' | 'video';

export interface LayoutSpec {
  kind: LayoutKind;
  density: 'comfortable' | 'compact' | 'presentation';
  header: boolean;
  footer: boolean;
  safeMargin: number;
  mainVisualRatio?: number;
  problemBarRatio?: number;
}

export const layoutSpecs: Record<LayoutKind, LayoutSpec> = {
  document: {
    kind: 'document',
    density: 'comfortable',
    header: true,
    footer: true,
    safeMargin: 18,
    mainVisualRatio: 0.30,
  },
  worksheet: {
    kind: 'worksheet',
    density: 'comfortable',
    header: true,
    footer: true,
    safeMargin: 18,
    mainVisualRatio: 0.28,
  },
  assessment: {
    kind: 'assessment',
    density: 'compact',
    header: true,
    footer: true,
    safeMargin: 16,
    mainVisualRatio: 0.24,
  },
  video: {
    kind: 'video',
    density: 'presentation',
    header: false,
    footer: true,
    safeMargin: 72,
    mainVisualRatio: 0.42,
    problemBarRatio: 0.20,
  },
};
