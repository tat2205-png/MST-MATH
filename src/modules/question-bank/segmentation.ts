import type {
  ContentBlock,
  DocumentBlock,
  DocumentIR,
  DocumentQuestionCandidate,
  MathNode,
  QuestionStartCandidate,
  QuestionType,
  BoundaryEvidence,
  BoundaryConfidence,
} from "./types.js";

/**
 * A segmentation unit is a logical slice of one physical DocumentBlock.
 * `id` and `sourceLocation` deliberately remain those of the physical source
 * object so provenance is not fabricated. `segmentationUnitId` exists only to
 * keep boundary-evidence IDs unique when several questions share one paragraph.
 */
type SegmentationBlock = DocumentBlock & { segmentationUnitId?: string };

const textOf = (blocks: ContentBlock[]): string =>
  blocks
    .map((block) =>
      block.type === "text"
        ? block.value
        : block.type === "table"
          ? block.cells.flat().map((cell) => textOf([cell])).join(" ")
          : "",
    )
    .join("");

const question = /^(?:(Câu|Bài|Question)\s*)?(\d+)\s*[.:)]\s*/iu;
const explicitQuestion = /^(Câu|Bài|Question)\s*(\d+)\s*[.:)]\s*/iu;
const section = /^(PHẦN\s+(?:I|II|III|IV|V)|TRẮC NGHIỆM|ĐÚNG\s*\/\s*SAI|TRẢ LỜI NGẮN|TỰ LUẬN)/iu;
const semantic = /^(?:cho|tính|tìm|xác định|chứng minh|giải|hãy|một|trong|tại|người ta|một người|một công ty|một vật)\b/iu;
const answerSolution = /^(?:đáp\s*án|lời\s*giải|hướng\s*dẫn\s*giải|kết\s*quả)\b/iu;

function contentStartsExplicitQuestion(content: ContentBlock): boolean {
  return content.type === "text" && explicitQuestion.test(content.value.trimStart());
}

/**
 * Word can store several visually separate "Câu N:" lines inside a single
 * physical block. The old segmenter iterated only DocumentBlock boundaries and
 * therefore merged all of them into one candidate.
 *
 * Split only when the same physical block contains at least two explicit
 * question starts. Do not trust `DocumentBlock.kind` as a veto: ingestion can
 * classify a paragraph/text container as SECTION even when its runs contain
 * actual questions. Explicit source markers are stronger local evidence here.
 */
function expandIntraBlockQuestionUnits(block: DocumentBlock): SegmentationBlock[] {
  if (block.content.length < 2) return [block];

  const markerIndexes = block.content
    .map((content, index) => (contentStartsExplicitQuestion(content) ? index : -1))
    .filter((index) => index >= 0);

  if (markerIndexes.length < 2) return [block];

  const units: SegmentationBlock[] = [];
  const firstMarker = markerIndexes[0];

  // Preserve any physical content that precedes the first explicit marker. It
  // remains a separate segmentation unit and may attach to prior context using
  // the existing rules. No source content is discarded.
  if (firstMarker > 0) {
    units.push({
      ...block,
      content: block.content.slice(0, firstMarker),
      segmentationUnitId: `${block.id}::prefix`,
    });
  }

  markerIndexes.forEach((start, markerOrdinal) => {
    const end = markerIndexes[markerOrdinal + 1] ?? block.content.length;
    units.push({
      ...block,
      content: block.content.slice(start, end),
      segmentationUnitId: `${block.id}::question-segment-${markerOrdinal + 1}`,
      // A Word list number belongs to the physical paragraph, not every
      // logical segment inside it. Explicit Câu/Bài/Question markers are the
      // authority for the derived segments.
      ...(markerOrdinal > 0 ? { numbering: undefined } : {}),
    });
  });

  return units;
}

function segmentationUnits(document: DocumentIR): SegmentationBlock[] {
  return document.blocks.flatMap(expandIntraBlockQuestionUnits);
}

const evidenceFor = (
  block: SegmentationBlock,
  document: DocumentIR,
  kind: QuestionStartCandidate["candidateKind"],
  raw: string,
  confidence: BoundaryConfidence,
): QuestionStartCandidate => ({
  candidateId: `${block.segmentationUnitId ?? block.id}:${kind}`,
  sourceDocumentId: document.sourceDocumentId ?? document.id ?? document.sourceHash,
  // Preserve the physical source object identity even for an intra-block slice.
  sourceObjectId: block.id,
  sourceAnchor: {
    sourceDocumentId: document.sourceDocumentId ?? document.sourceHash,
    partName: "word/document.xml",
    objectIndex: block.order,
    ...(block.paragraphIndex === undefined ? {} : { paragraphIndex: block.paragraphIndex }),
  },
  documentOrder: block.order,
  candidateKind: kind,
  rawEvidence: raw,
  normalizedEvidence: raw.normalize("NFC").toLocaleLowerCase("vi"),
  confidence,
  contradictions: [],
  qaStatus: confidence === "HIGH_CONFIDENCE" ? "AUTO_ACCEPT" : "REVIEW",
});

function typeFor(sectionName: string | undefined, content: ContentBlock[]): QuestionType {
  const value = `${sectionName ?? ""} ${textOf(content)}`;
  const labels = [...value.matchAll(/(?:^|\s)([a-d])[.)](?:\s|$)/giu)].map((match) => match[1].toLowerCase());
  if (/(?:đúng\s*\/\s*sai|đúng\s+hay\s+sai|đúng\s+hoặc\s+sai)/iu.test(value) && new Set(labels).size >= 2) {
    return "TRUE_FALSE";
  }
  if (/trả lời ngắn/iu.test(value)) return "SHORT_ANSWER";
  if (/tự luận/iu.test(value)) return "ESSAY";
  const optionLabels = [...value.matchAll(/([A-H])[.)](?:\s|$)/gu)].map((match) => match[1]);
  return new Set(optionLabels).size >= 2 ? "MULTIPLE_CHOICE" : "UNKNOWN";
}

export function segmentQuestions(document: DocumentIR): DocumentQuestionCandidate[] {
  const candidates: DocumentQuestionCandidate[] = [];
  let current: SegmentationBlock[] = [];
  let currentSection: string | undefined;
  let label: string | undefined;
  let index: number | undefined;
  let starts: QuestionStartCandidate[] = [];

  const flush = (
    endEvidence: BoundaryEvidence[] = [{ kind: "DOCUMENT_END", detail: "ordered document sequence ended" }],
  ) => {
    if (!current.length) return;

    const flat = current.flatMap((block) => block.content);
    const math = flat.flatMap((block): MathNode[] =>
      block.type === "math"
        ? [block.math]
        : block.type === "table"
          ? block.cells.flat().flatMap((cell) => (cell.type === "math" ? [cell.math] : []))
          : [],
    );
    const figures = [
      ...new Set(
        flat.flatMap((block) =>
          block.type === "figure"
            ? [block.figureId]
            : block.type === "table"
              ? block.cells.flatMap((row) => row.flatMap((cell) => (cell.type === "figure" ? [cell.figureId] : [])))
              : [],
        ),
      ),
    ];
    const start = current[0];
    const end = current.at(-1)!;
    const confidence: BoundaryConfidence = starts.some((candidate) => candidate.confidence === "HIGH_CONFIDENCE")
      ? "HIGH_CONFIDENCE"
      : "MEDIUM_CONFIDENCE";

    candidates.push({
      id: `candidate-${candidates.length + 1}`,
      questionIndex: index,
      questionLabel: label,
      section: currentSection,
      // Strip the internal-only segmentationUnitId. Candidate raw blocks still
      // carry the sliced content but expose only canonical DocumentBlock fields.
      rawBlocks: current.map(({ segmentationUnitId: _unit, ...block }) => block),
      textBlocks: flat,
      mathBlocks: math,
      figureAnchors: figures,
      questionTypeCandidate: typeFor(currentSection, flat),
      sourceLocations: current.map((block) => block.sourceLocation),
      parseWarnings: math.flatMap((node) => node.warnings),
      startCandidates: starts,
      semanticRoles: ["QUESTION_STEM"],
      boundary: {
        startObjectId: start.id,
        endObjectId: end.id,
        startAnchor: starts[0]?.sourceAnchor,
        endAnchor: {
          sourceDocumentId: document.sourceDocumentId ?? document.sourceHash,
          partName: "word/document.xml",
          objectIndex: end.order,
        },
        startEvidence: starts.map((candidate) => ({
          kind: candidate.candidateKind,
          detail: candidate.rawEvidence,
          objectId: candidate.sourceObjectId,
        })),
        endEvidence,
        confidence,
        contradictions: [],
        qaStatus: confidence === "HIGH_CONFIDENCE" ? "AUTO_ACCEPT" : "REVIEW",
      },
    });

    current = [];
    starts = [];
  };

  for (const block of segmentationUnits(document)) {
    const value = textOf(block.content).trim();
    const sectionMatch = section.exec(value);

    if (sectionMatch && (block.kind === "SECTION" || !question.test(value))) {
      flush([
        {
          kind: answerSolution.test(value) ? "ANSWER_SOLUTION_TRANSITION" : "SECTION_TRANSITION",
          detail: value,
          objectId: block.id,
        },
      ]);
      currentSection = value;
      continue;
    }

    const marker = question.exec(value);
    const signals: QuestionStartCandidate[] = [];
    if (marker) {
      signals.push(
        evidenceFor(
          block,
          document,
          "TEXTUAL_MARKER",
          marker[0].trim(),
          marker[1] ? "HIGH_CONFIDENCE" : "MEDIUM_CONFIDENCE",
        ),
      );
    }
    if (block.numbering) signals.push(evidenceFor(block, document, "WORD_NUMBERING", block.numbering, "HIGH_CONFIDENCE"));
    if (
      semantic.test(value) &&
      value.length >= 12 &&
      (/[?]|\b(?:tính|tìm|giải|chứng minh|xác định)\b/iu.test(value) || block.kind === "TABLE")
    ) {
      signals.push(evidenceFor(block, document, "SEMANTIC_STEM", value.slice(0, 180), "MEDIUM_CONFIDENCE"));
    }
    if (block.kind === "TABLE") {
      signals.push(evidenceFor(block, document, "TABLE_STRUCTURE", "table contains question-capable content", "MEDIUM_CONFIDENCE"));
    }

    const startsQuestion = signals.some((candidate) => candidate.confidence === "HIGH_CONFIDENCE") || signals.length >= 2;
    if (startsQuestion && current.length) {
      flush([{ kind: "NEXT_QUESTION_START", detail: "global sequence transition", objectId: block.id }]);
    }
    if (startsQuestion) {
      starts = signals;
      label = marker?.[0]?.trim();
      index = marker?.[2] ? Number(marker[2]) : undefined;
    }
    if (current.length || startsQuestion) current.push(block);
  }

  flush();
  return candidates;
}
