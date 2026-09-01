import {
  NA_MATH_STANDARD_V2_6,
  getNaMathOutputContract,
  type NaMathOutputIdentity,
} from "../../config/naMathStandardV26.js";
import type { DocumentIR } from "./types.js";
import { resolveConsumerProfile } from "../../config/naMathBrandRoot.js";

export type ExistingDocumentIdentity = NaMathOutputIdentity | "document" | "assessment";

const outputIdentityMap: Record<ExistingDocumentIdentity, NaMathOutputIdentity> = {
  document: "learning_material",
  learning_material: "learning_material",
  worksheet: "worksheet",
  assessment: "exercise_sheet",
  exercise_sheet: "exercise_sheet",
  video: "video",
};

export function adaptQuestionBankDocumentStandard(document: DocumentIR, identity: ExistingDocumentIdentity) {
  const outputIdentity = outputIdentityMap[identity];
  const profileId = identity === "assessment" ? "P04_EXERCISE_SHEET" : identity === "worksheet" ? "P03_WORKSHEET" : identity === "video" ? "P07_VIDEO" : identity === "exercise_sheet" ? "P04_EXERCISE_SHEET" : "P01_LEARNING_MATERIAL";
  const consumerProfile = resolveConsumerProfile(identity === "assessment" ? "ASSESSMENT" : "DOCUMENT", profileId);
  return {
    document,
    outputIdentity,
    consumerProfile,
    outputContract: getNaMathOutputContract(outputIdentity),
    standard: NA_MATH_STANDARD_V2_6,
  } as const;
}
