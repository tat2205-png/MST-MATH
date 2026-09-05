import assert from "node:assert/strict";
import { zipSync } from "fflate";
import { parseDocx } from "../src/modules/question-bank/document.ts";
import { normalizeCandidate } from "../src/modules/question-bank/extraction.ts";
import { disambiguateQuestionObjectIds } from "../src/modules/question-bank/question-identity.ts";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.ts";

const enc = new TextEncoder();
const p = (numId: string, text: string, ilvl = "0") =>
  `<w:p><w:pPr><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr></w:pPr><w:r><w:t>${text}</w:t></w:r></w:p>`;
const plain = (text: string) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
const explicit = (text: string) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;

const numbering = `<w:numbering>
  <w:abstractNum w:abstractNumId="10"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="Câu %1:"/></w:lvl></w:abstractNum>
  <w:abstractNum w:abstractNumId="11"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum>
  <w:num w:numId="6"><w:abstractNumId w:val="10"/></w:num>
  <w:num w:numId="7"><w:abstractNumId w:val="10"/></w:num>
  <w:num w:numId="8"><w:abstractNumId w:val="11"/></w:num>
</w:numbering>`;

const body = [
  p("6", "Question one"),
  plain("A. one B. two C. three D. four"),
  p("6", "Question two"),
  plain("A. one B. two C. three D. four"),
  p("7", "Question reset"),
  plain("A. one B. two C. three D. four"),
  p("8", "Generic numbered text"),
].join("");

const bytes = zipSync({
  "word/document.xml": enc.encode(`<w:document><w:body>${body}</w:body></w:document>`),
  "word/numbering.xml": enc.encode(numbering),
});

const document = parseDocx(bytes, "structural.docx");
const candidates = segmentQuestions(document);

assert.equal(candidates.length, 3);
assert.deepEqual(candidates.map((candidate) => candidate.questionIndex), [1, 2, 1]);
assert.deepEqual(candidates.map((candidate) => candidate.questionLabel), ["Câu 1:", "Câu 2:", "Câu 1:"]);
assert.equal("sequenceIndex" in candidates[0], false, "structural numbering must not introduce a second identity axis");

const normalized = candidates.map((candidate) => normalizeCandidate(candidate, document));
assert.equal(new Set(normalized.map((question) => question.id)).size, 2, "numbering reset should surface a collision before the canonical identity gate");

const disambiguated = disambiguateQuestionObjectIds(normalized, candidates);
assert.equal(new Set(disambiguated.map((question) => question.id)).size, 3, "canonical identity authority must resolve numbering-reset collisions");
assert.match(disambiguated[0].id, /-q1-candidate-1$/u);
assert.match(disambiguated[1].id, /-q2$/u);
assert.match(disambiguated[2].id, /-q1-candidate-3$/u);

const genericOnly = parseDocx(
  zipSync({
    "word/document.xml": enc.encode(`<w:document><w:body>${p("8", "Generic numbered text")}</w:body></w:document>`),
    "word/numbering.xml": enc.encode(numbering),
  }),
  "generic.docx",
);
assert.equal(segmentQuestions(genericOnly).length, 0, "generic %1. numbering must remain non-authoritative");

const bareNumeric = parseDocx(
  zipSync({
    "word/document.xml": enc.encode(`<w:document><w:body>${plain("1. Bare numeric prose")}</w:body></w:document>`),
  }),
  "bare.docx",
);
assert.equal(segmentQuestions(bareNumeric).length, 0, "bare numeric paragraphs must not become question boundaries");

const legacy = parseDocx(
  zipSync({
    "word/document.xml": enc.encode(`<w:document><w:body>${explicit("Câu 7. Legacy question")}${plain("A. one B. two C. three D. four")}</w:body></w:document>`),
  }),
  "legacy.docx",
);
const legacyCandidates = segmentQuestions(legacy);
assert.equal(legacyCandidates.length, 1);
assert.equal(legacyCandidates[0].questionIndex, 7);
const legacyQuestion = normalizeCandidate(legacyCandidates[0], legacy);
assert.match(legacyQuestion.id, /-q7$/u, "existing explicit question identity must stay stable");

console.log("MST_MATH_DOCX_STRUCTURAL_NUMBERING_CONVERGENCE_V1=PASS");
