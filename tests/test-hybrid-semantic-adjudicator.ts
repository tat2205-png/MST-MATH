import assert from "node:assert/strict";
import { hybridAdjudicate } from "../src/modules/question-bank/hybrid-semantic-adjudicator.ts";
import { independentlyAuditCandidate } from "../src/modules/question-bank/boundary-validation.ts";
const candidate = (text: string, kinds: string[], range = true) => ({ id: "fixture", textBlocks: [{ type: "text", value: text }], rawBlocks: [{ id: "a", kind: "PARAGRAPH", order: 0, content: [{ type: "text", value: text }], sourceLocation: "p" }, ...(range ? [{ id: "b", kind: "PARAGRAPH", order: 1, content: [{ type: "text", value: "next" }], sourceLocation: "p2" }] : [])], startCandidates: kinds.map((candidateKind) => ({ candidateId: candidateKind, sourceDocumentId: "fixture", sourceObjectId: "a", documentOrder: 0, candidateKind, rawEvidence: candidateKind === "TEXTUAL_MARKER" ? "Câu 1" : candidateKind, normalizedEvidence: candidateKind, confidence: "HIGH_CONFIDENCE", contradictions: [], qaStatus: "AUTO_ACCEPT" })), boundary: { startObjectId: "a", endObjectId: range ? "b" : "a", startEvidence: [], endEvidence: [], confidence: "HIGH_CONFIDENCE", contradictions: [], qaStatus: "AUTO_ACCEPT" } } as any);
assert.equal(hybridAdjudicate(candidate("Một phương trình cần giải.", ["WORD_NUMBERING", "SEMANTIC_STEM"])).finalDecision, "AUTO_CONFIRMED");
assert.equal(hybridAdjudicate(candidate("a) phương án thứ nhất", ["SEMANTIC_STEM"])).finalDecision, "AUTO_MERGE_PREVIOUS");
assert.equal(hybridAdjudicate(candidate("Định nghĩa hàm số", ["SEMANTIC_STEM"])).finalDecision, "STILL_HUMAN_REVIEW");
assert.equal(independentlyAuditCandidate(candidate("Câu 1. Tính giá trị", ["TEXTUAL_MARKER"])), "CONFIRMED");
console.log("HYBRID_SEMANTIC_ADJUDICATOR_TESTS=PASS");
