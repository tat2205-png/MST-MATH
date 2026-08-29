import {
  NA_MATH_STANDARD_V2_6,
  getNaMathOutputContract,
  type NaMathOutputIdentity,
} from "../../config/naMathStandardV26.js";
import type { DocumentIR } from "./types.js";

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
  return {
    document,
    outputIdentity,
    outputContract: getNaMathOutputContract(outputIdentity),
    standard: NA_MATH_STANDARD_V2_6,
  } as const;
}
