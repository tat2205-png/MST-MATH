import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { NA_MATH_STANDARD_V2_6 } from "../../../config/naMathStandardV26.js";
import type { GeometryArtifactResult } from "../../../types/geometrySpec.js";
import type { FigureRecord } from "../../question-bank/types.js";
import { DocxRenderError, type DocxFigureMetadata } from "./types.js";

export interface GeometryFigureAdapterInput {
  artifact: GeometryArtifactResult;
  figureId: string;
  profileId: string;
  title?: string;
  altText?: string;
  widthEmu?: number;
  heightEmu?: number;
  semanticFlags?: string[];
}

export async function adaptGeometryArtifactToDocxFigure(input: GeometryFigureAdapterInput): Promise<{ figure: FigureRecord; metadata: DocxFigureMetadata }> {
  const profile = NA_MATH_STANDARD_V2_6.approvedGeometryProfiles.profiles.find((candidate) => candidate.id === input.profileId);
  if (!profile || profile.status !== "LOCKED") throw new DocxRenderError("GEOMETRY_PROFILE_REVIEW_REQUIRED", `DOCX geometry profile is not locked and approved: ${input.profileId}`);
  if (input.artifact.status !== "PASS" || !input.artifact.svgPath) throw new DocxRenderError("GEOMETRY_ARTIFACT_NOT_VALIDATED", "DOCX geometry requires a passing existing-engine SVG artifact.");
  const bytes = await readFile(input.artifact.svgPath);
  return {
    figure: { id: input.figureId, relationshipId: "DOCX_PENDING", mediaPath: basename(input.artifact.svgPath), mimeType: "image/svg+xml", bytes, sourceLocation: input.artifact.svgPath, dimensions: { widthEmu: input.widthEmu, heightEmu: input.heightEmu } },
    metadata: { title: input.title, altText: input.altText, geometryProfileId: profile.id, semanticFigureId: input.figureId, semanticFlags: input.semanticFlags },
  };
}
