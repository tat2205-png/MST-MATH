import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import type { ContentBlock, DocumentBlock } from "../src/modules/document-engine/document-ir.js";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";

const CORPUS_ROOT = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const SOURCE_QUERY = process.env.PIMATH_DIAG_SOURCE ?? "NK TEST APP.docx";
const TARGET_ORDINAL = Number(process.env.PIMATH_DIAG_CANDIDATE ?? "41");
const OUT = "docs/evidence/word-beta-human-acceptance-round-2/R2-36-embedded-boundary-diagnostic.json";

const markerPattern = /\b(Câu|Bài|Question)\s*(\d+)\s*[:.)]/giu;

type MarkerHit = {
  sourcePath: string;
  blockId: string;
  blockKind: string;
  marker: string;
  number: number;
  index: number;
  preview: string;
};

function scanText(value: string, sourcePath: string, block: DocumentBlock): MarkerHit[] {
  return [...value.matchAll(markerPattern)].map((match) => ({
    sourcePath,
    blockId: block.id,
    blockKind: block.kind,
    marker: match[0],
    number: Number(match[2]),
    index: match.index ?? -1,
    preview: value.slice(Math.max(0, (match.index ?? 0) - 80), Math.min(value.length, (match.index ?? 0) + 220)).replace(/\s+/g, " ").trim(),
  }));
}

function scanContent(blocks: ContentBlock[], sourcePath: string, owner: DocumentBlock): MarkerHit[] {
  const hits: MarkerHit[] = [];
  blocks.forEach((block, i) => {
    const path = `${sourcePath}/content[${i}]`;
    if (block.type === "text") {
      hits.push(...scanText(block.value, path, owner));
      return;
    }
    if (block.type === "table") {
      block.cells.forEach((cell, cellIndex) => {
        hits.push(...scanContent(cell, `${path}/cell[${cellIndex}]`, owner));
      });
    }
  });
  return hits;
}

function visibleText(blocks: ContentBlock[]): string {
  return blocks.map((block) => {
    if (block.type === "text") return block.value;
    if (block.type === "math") return `[MATH:${block.math.id ?? block.math.sourceType}]`;
    if (block.type === "figure") return `[FIGURE:${block.figureId}]`;
    return block.cells.map((cell) => visibleText(cell)).join(" | ");
  }).join(" ").replace(/\s+/g, " ").trim();
}

const files = readdirSync(CORPUS_ROOT).filter((name) => name.endsWith(".docx") && !name.startsWith("~$")).sort();
const source = files.find((name) => name === SOURCE_QUERY) ?? files.find((name) => name.includes(SOURCE_QUERY));
if (!source) throw new Error(`SOURCE_NOT_FOUND:${SOURCE_QUERY}`);

const result = ingestDocx({ name: source, bytes: new Uint8Array(readFileSync(join(CORPUS_ROOT, source))) });
if (!result.document) throw new Error(`DOCUMENT_IR_NOT_CREATED:${source}`);
const document = result.document;
const candidates = segmentQuestions(document);
const target = candidates[TARGET_ORDINAL - 1];
if (!target) throw new Error(`TARGET_CANDIDATE_NOT_FOUND:${TARGET_ORDINAL}:TOTAL=${candidates.length}`);

const blockDiagnostics = target.rawBlocks.map((block, offset) => {
  const hits = scanContent(block.content, block.sourceLocation, block);
  return {
    offset,
    blockId: block.id,
    blockKind: block.kind,
    order: block.order,
    paragraphIndex: block.paragraphIndex ?? null,
    sourceLocation: block.sourceLocation,
    markerCount: hits.length,
    markers: hits,
    preview: visibleText(block.content).slice(0, 1200),
  };
});

const markerHits = blockDiagnostics.flatMap((entry) => entry.markers);
const distinctNumbers = [...new Set(markerHits.map((hit) => hit.number))].sort((a, b) => a - b);
const blocksWithMultipleMarkers = blockDiagnostics.filter((entry) => entry.markerCount > 1);
const tableMarkerCount = markerHits.filter((hit) => hit.sourcePath.includes("/cell[")).length;
const embeddedMarkerCount = markerHits.filter((hit) => hit.index > 0 || hit.sourcePath.includes("/cell[")).length;

const evidence = {
  schemaVersion: "PIMATH_EMBEDDED_QUESTION_BOUNDARY_DIAGNOSTIC_V1",
  sourceDocument: source,
  sourceHash: document.sourceHash,
  totalCandidates: candidates.length,
  targetOrdinal: TARGET_ORDINAL,
  targetCandidateId: target.id,
  targetQuestionTypeCandidate: target.questionTypeCandidate,
  targetBlockCount: target.rawBlocks.length,
  markerHitCount: markerHits.length,
  distinctMarkerNumbers: distinctNumbers,
  distinctMarkerCount: distinctNumbers.length,
  embeddedMarkerCount,
  tableMarkerCount,
  blocksWithMultipleMarkersCount: blocksWithMultipleMarkers.length,
  markerHits,
  blockDiagnostics,
  diagnosis: distinctNumbers.length >= 2 ? "EMBEDDED_BOUNDARY_CONTAMINATION_REPRODUCED" : "NO_EMBEDDED_MULTI_QUESTION_MARKERS",
};

writeFileSync(OUT, JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify({
  sourceDocument: source,
  sourceHash: document.sourceHash,
  totalCandidates: candidates.length,
  targetOrdinal: TARGET_ORDINAL,
  targetQuestionTypeCandidate: target.questionTypeCandidate,
  targetBlockCount: target.rawBlocks.length,
  markerHitCount: markerHits.length,
  distinctMarkerNumbers: distinctNumbers,
  distinctMarkerCount: distinctNumbers.length,
  embeddedMarkerCount,
  tableMarkerCount,
  blocksWithMultipleMarkersCount: blocksWithMultipleMarkers.length,
  diagnosis: evidence.diagnosis,
  evidencePath: OUT,
}));
