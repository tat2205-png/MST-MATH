export interface GenerativeMotionProvenance {
  readonly providerId: string;
  readonly model?: string;
  readonly promptDigest: string;
}

export interface GenerativeMotionArtifactInput {
  readonly id: string;
  readonly source: string;
  readonly mediaType: "video/mp4" | "video/webm" | "image/gif";
  readonly provenance: GenerativeMotionProvenance;
}

/** Generative motion is visual material only and can never establish geometry truth. */
export interface GenerativeMotionArtifact {
  readonly version: 1;
  readonly id: string;
  readonly source: string;
  readonly mediaType: "video/mp4" | "video/webm" | "image/gif";
  readonly authoritative: false;
  readonly geometryAuthority: "none";
  readonly provenance: GenerativeMotionProvenance;
  readonly warning: "GENERATIVE_OUTPUT_IS_NON_AUTHORITATIVE";
}
