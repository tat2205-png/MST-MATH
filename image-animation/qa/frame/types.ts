export interface FrameEvidence {
  readonly version: 1;
  readonly frameIndex: number;
  readonly width: number;
  readonly height: number;
  readonly pixelFormat: "rgba8";
  readonly byteLength: number;
  readonly sha256: string;
}

export interface FrameQaIssue {
  readonly code: "NO_FRAME_EVIDENCE" | "MISSING_FRAME" | "DUPLICATE_FRAME" | "INVALID_FRAME_EVIDENCE";
  readonly frameIndex?: number;
  readonly message: string;
}

export interface FrameQaResult {
  readonly passed: boolean;
  readonly evidence: readonly FrameEvidence[];
  readonly issues: readonly FrameQaIssue[];
}
