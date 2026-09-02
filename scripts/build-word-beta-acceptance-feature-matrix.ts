import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";

const root = "/Users/mac/PiMath-Acceptance/word-real";
const out = "docs/evidence/word-beta-human-acceptance-round-2";
const files = readdirSync(root).filter(x => x.endsWith(".docx") && !x.startsWith("~$")).sort();
const snapshot = JSON.parse(readFileSync("docs/evidence/question-boundary-final/corpus-recomposition.json", "utf8"));
const confirmed = new Set(snapshot.candidates.filter((x: any) => x.state === "CONFIRMED").map((x: any) => x.candidateId));
const rows: any[] = [];
for (const file of files) {
  const d = ingestDocx({ name: file, bytes: new Uint8Array(readFileSync(`${root}/${file}`)) }).document;
  if (!d) throw new Error(`MISSING_DOCUMENT_IR:${file}`);
  for (const [index, q] of segmentCanonicalQuestions(d).entries()) {
    if (!confirmed.has(`${file}::candidate-${index + 1}`)) continue;
    const questionId = `${d.sourceHash.slice(0, 12)}-qcandidate-${index + 1}`;
    const blocks = [...q.stem, ...q.options.flatMap((x: any) => x.content), ...(q.subitems ?? []).flatMap((x: any) => x.content), ...(q.answer ?? []), ...(q.solution ?? [])];
    const math = blocks.filter((x: any) => x.type === "math");
    const formats = [...new Set(math.map((x: any) => String(x.math.id ?? "").startsWith("mtef-") ? "MTEF_V5" : "MODERN_MATH"))];
    const roles = new Set<string>();
    if (q.stem.some((x: any) => x.type === "math")) roles.add("MATH_IN_STEM");
    if (q.options.some((o: any) => o.content.some((x: any) => x.type === "math"))) roles.add("MATH_IN_OPTIONS");
    if ((q.subitems ?? []).some((o: any) => o.content.some((x: any) => x.type === "math"))) roles.add("MATH_IN_TRUE_FALSE_SUBITEMS");
    if (q.answer?.some((x: any) => x.type === "math")) roles.add("MATH_IN_ANSWER");
    if (q.solution?.some((x: any) => x.type === "math")) roles.add("MATH_IN_SOLUTION");
    if ((q.contextIds ?? []).length) roles.add("SHARED_CONTEXT_MATH");
    const assets = q.assetIds ?? [];
    rows.push({ questionId, sourceDocumentId: q.sourceDocumentId, sourceAnchor: q.provenance, questionType: q.questionType, mathFormats: formats, mathRoles: [...roles].sort(), mathObjectIds: [...new Set(q.mathObjectIds)], mathObjectCount: new Set(q.mathObjectIds).size, assetIds: [...new Set(assets)].sort(), assetCount: new Set(assets).size, riskTags: [...new Set([...formats, ...roles, ...(assets.length ? ["ASSET_BEARING"] : [])])].sort(), evidenceRefs: ["current DocumentIR", "current QuestionIR", "current canonical source identities"] });
  }
}
rows.sort((a, b) => a.questionId.localeCompare(b.questionId));
mkdirSync(out, { recursive: true });
writeFileSync(`${out}/acceptance-feature-matrix.json`, JSON.stringify({ schemaVersion: "PIMATH_WORD_BETA_ACCEPTANCE_FEATURE_MATRIX_V1", canonicalBoundaryCount: 668, featureMatrixQuestionCount: rows.length, featureMatrixUniqueQuestionIdCount: new Set(rows.map(x => x.questionId)).size, rows }, null, 2));
console.log(JSON.stringify({ count: rows.length, unique: new Set(rows.map(x => x.questionId)).size, modern: rows.filter(x => x.mathFormats.includes("MODERN_MATH")).length, v5: rows.filter(x => x.mathFormats.includes("MTEF_V5")).length, v3: rows.filter(x => x.mathFormats.includes("MTEF_V3")).length, qa: rows.length === 668 && new Set(rows.map(x => x.questionId)).size === 668 ? "PASS" : "FAIL" }));
