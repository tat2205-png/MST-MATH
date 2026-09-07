import assert from "node:assert/strict";
import { normalizeDocument, normalizationFingerprint } from "../src/modules/exam-normalization/index.js";
import type { DocumentIR } from "../src/modules/document-engine/document-ir.js";

const raw: DocumentIR = {
  sourceDocument: "fixture-v1.docx", sourceHash: "raw-hash", warnings: [],
  figures: [{ id: "fig-1", relationshipId: "r1", sourceLocation: "doc.xml:p:1", semanticRole: "REAL_FIGURE" }],
  blocks: [
    { id: "b1", kind: "PARAGRAPH", order: 0, sourceLocation: "doc.xml:p:0", content: [{ type: "text", value: "  Câu  1:  Cho  x.  ", sourceLocation: "doc.xml:p:0" }, { type: "math", math: { sourceType: "LATEX", sourceRaw: "x", latex: "  x  ", normalized: undefined, parseStatus: "PARSED", warnings: [], sourceLocation: "doc.xml:p:0:math" }, sourceLocation: "doc.xml:p:0" }] },
    { id: "b2", kind: "PARAGRAPH", order: 1, sourceLocation: "doc.xml:p:1", content: [{ type: "text", value: "A.  Đúng", sourceLocation: "doc.xml:p:1" }, { type: "figure", figureId: "fig-1", sourceLocation: "doc.xml:p:1" }] },
  ],
};

const before = JSON.stringify(raw);
const first = normalizeDocument(raw);
assert.equal(JSON.stringify(raw), before, "RAW DocumentIR must remain unchanged");
assert.equal(first.normalized.blocks[0].content[0].type, "text");
assert.equal((first.normalized.blocks[0].content[0] as { value: string }).value, "Câu 1: Cho x.");
assert.equal(first.questions.length, 1);
assert.deepEqual(first.questions[0].figureIds, ["fig-1"]);
assert.ok(first.provenance.some(change => change.layer === "N1"));
assert.ok(first.provenance.some(change => change.layer === "N2"));
assert.equal(normalizationFingerprint(first), normalizationFingerprint(normalizeDocument(first.normalized)));
console.log("exam-normalization-v1 PASS");
