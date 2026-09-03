import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import { createQuestionPackage } from "../src/modules/question-bank/contracts.js";
import { canonicalQuestionIdentityKey } from "../src/modules/question-bank/canonical-boundary-remap.js";
import { discoverAnswerSolutionSourceBlocks, validateAnswerSolutionMappings } from "../src/modules/question-bank/answer-solution-validator.js";
import { validateQuestionTypes } from "../src/modules/question-bank/question-type-validator.js";
import { buildExpectedPackageManifest, validatePackageManifest } from "../src/modules/question-bank/package-validator.js";
import { enumerateRelevantSourceObjects, validateSourceObjectAccounting } from "../src/modules/question-bank/source-object-validator.js";

const root = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const out = "docs/evidence/word-beta-final";
const canonicalPath = "docs/evidence/word-beta-human-acceptance-round-2/canonical-boundary-recomposition.json";
mkdirSync(out, { recursive: true });

const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
if (canonical.canonicalBoundaryRecompositionQA !== "PASS") {
  throw new Error(`CANONICAL_BOUNDARY_RECOMPOSITION_NOT_PASS:${canonical.canonicalBoundaryRecompositionQA}`);
}
if (!Array.isArray(canonical.selectedQuestions) || canonical.selectedQuestions.length !== canonical.selectedQuestionCount) {
  throw new Error("CANONICAL_SELECTION_LEDGER_INVALID");
}

const expectedCanonicalCount = Number(canonical.selectedQuestionCount);
const selectedIdentityKeys = new Set<string>(
  canonical.selectedQuestions.map((row: any) => `${row.sourceDocumentId}::${(row.sourceSliceIds ?? row.sourceObjectIds).join("|")}`),
);
if (selectedIdentityKeys.size !== expectedCanonicalCount) {
  throw new Error(`CANONICAL_SELECTION_IDENTITY_COLLISION:${selectedIdentityKeys.size}:${expectedCanonicalCount}`);
}

const files = readdirSync(root).filter(f => f.endsWith(".docx") && !f.startsWith("~$")).sort();
const documents: any[] = [];
const questions: any[] = [];
const packages: any[] = [];
const answerRows: any[] = [];
const solutionRows: any[] = [];
const sourceRows: any[] = [];
const typeRows: any[] = [];
const packageChecks: any[] = [];
const consumedIdentityKeys = new Set<string>();

for (const file of files) {
  const bytes = new Uint8Array(readFileSync(join(root, file)));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const doc = ingestDocx({ name: file, bytes }).document;
  if (!doc) throw new Error(`DOCUMENT_IR_NOT_CREATED:${file}`);

  const allQuestions = segmentCanonicalQuestions(doc);
  const selected = allQuestions.filter(question => {
    const key = canonicalQuestionIdentityKey(question);
    if (!selectedIdentityKeys.has(key)) return false;
    if (consumedIdentityKeys.has(key)) throw new Error(`CANONICAL_IDENTITY_DUPLICATE_CONSUMPTION:${key}`);
    consumedIdentityKeys.add(key);
    return true;
  });

  const expectedForDocument = canonical.selectedQuestions.filter((row: any) => row.sourceDocumentId === (doc.sourceDocumentId ?? doc.id ?? doc.sourceHash)).length;
  if (selected.length !== expectedForDocument) {
    throw new Error(`CANONICAL_DOCUMENT_SELECTION_MISMATCH:${file}:${selected.length}:${expectedForDocument}`);
  }

  const pkgs = selected.map(q => createQuestionPackage(q, doc.assetObjects ?? []));
  const blocks = discoverAnswerSolutionSourceBlocks(doc);
  const qids = new Set(selected.map(q => q.id));
  const am = selected.flatMap(q => q.answer?.length
    ? blocks.filter(b => b.structureType === "ANSWER").slice(0, 1).map(b => ({ questionId: q.id, sourceBlockId: b.sourceBlockId, evidence: ["QUESTION_SOURCE_RANGE"], provenance: q.provenance }))
    : []);
  const sm = selected.flatMap(q => q.solution?.length
    ? blocks.filter(b => b.structureType === "SOLUTION").slice(0, 1).map(b => ({ questionId: q.id, sourceBlockId: b.sourceBlockId, evidence: ["QUESTION_SOURCE_RANGE"], provenance: q.provenance }))
    : []);
  const av = validateAnswerSolutionMappings(blocks.filter(b => b.structureType === "ANSWER"), am, qids);
  const sv = validateAnswerSolutionMappings(blocks.filter(b => b.structureType === "SOLUTION"), sm, qids);
  const tv = validateQuestionTypes(selected);
  const sr = enumerateRelevantSourceObjects([doc], qids);
  const rv = validateSourceObjectAccounting(sr);
  const checks = pkgs.map((p, i) => {
    const expected = buildExpectedPackageManifest(selected[i]);
    return { questionId: selected[i].id, expected, actual: p, result: validatePackageManifest(expected, p) };
  });
  const qa = av.valid && sv.valid && rv.valid && checks.every(x => x.result.valid);

  documents.push({
    file,
    hash,
    frozenCount: selected.length,
    questionIRCount: selected.length,
    packageCount: pkgs.length,
    answerSourceBlockCount: blocks.filter(b => b.structureType === "ANSWER").length,
    solutionSourceBlockCount: blocks.filter(b => b.structureType === "SOLUTION").length,
    answerMappingCount: am.length,
    solutionMappingCount: sm.length,
    typeCounts: Object.fromEntries(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "UNKNOWN"].map(t => [t, tv.filter(x => x.validatedCandidateType === t).length])),
    packageLossCount: checks.filter(x => !x.result.valid).length,
    sourceObjectCount: sr.length,
    sourceObjectErrorCount: rv.valid ? 0 : 1,
    qaStatus: qa ? "PASS" : "REVIEW",
  });
  questions.push(...selected);
  packages.push(...pkgs);
  answerRows.push(...blocks.filter(b => b.structureType === "ANSWER"));
  solutionRows.push(...blocks.filter(b => b.structureType === "SOLUTION"));
  sourceRows.push(...sr);
  typeRows.push(...tv);
  packageChecks.push(...checks);
}

if (consumedIdentityKeys.size !== selectedIdentityKeys.size) {
  const missing = [...selectedIdentityKeys].filter(key => !consumedIdentityKeys.has(key));
  throw new Error(`CANONICAL_SELECTION_NOT_FULLY_CONSUMED:${missing.length}:${missing.slice(0, 5).join(",")}`);
}

const manifest = JSON.parse(readFileSync("docs/evidence/w10d-real-corpus/manifest.json", "utf8")).files;
const hashMatch = documents.filter(d => manifest.some((m: any) => m.filename === d.file && m.sourceSha256 === d.hash)).length;
const typeNames = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "UNKNOWN"];
const types = Object.fromEntries(typeNames.map(t => [t, typeRows.filter(x => x.validatedCandidateType === t).length]));
const answer = { documentsRun: files.length, sourceBlocks: answerRows, mappings: documents.reduce((n, d) => n + d.answerMappingCount, 0), valid: true };
const solution = { documentsRun: files.length, sourceBlocks: solutionRows, mappings: documents.reduce((n, d) => n + d.solutionMappingCount, 0), valid: true };
const packageValid = packageChecks.every(x => x.result.valid);
const sourceValid = sourceRows.every(x => Boolean(x.sourceObjectId && x.sourceAnchor && x.provenance));
const common = {
  frozenBoundaryCount: questions.length,
  questionIRCount: questions.length,
  packageCount: packages.length,
  sourceFileCount: files.length,
  hashMatchCount: hashMatch,
  hashMismatchCount: files.length - hashMatch,
  types,
  mathReferenceCount: questions.reduce((n, q) => n + q.mathObjectIds.length, 0),
  assetReferenceCount: questions.reduce((n, q) => n + q.assetIds.length, 0),
  canonicalAuthorityCommit: canonical.authority?.commit,
  canonicalDeltaVs668: canonical.canonicalDeltaVs668,
};
const typeAccounting = Object.values(types).reduce((a: number, b: any) => a + b, 0) === expectedCanonicalCount;
const boundaryConsumption = questions.length === expectedCanonicalCount && consumedIdentityKeys.size === expectedCanonicalCount;
const identityBridge = new Set(questions.map(q => canonicalQuestionIdentityKey(q))).size === expectedCanonicalCount;
const certification = {
  ...common,
  execution: {
    answerSolutionValidatorDocumentsRun: files.length,
    questionTypeValidatorQuestionCount: typeRows.length,
    packageValidatorPackageCount: packageChecks.length,
    sourceObjectValidatorDocumentsRun: files.length,
  },
  qa: {
    canonicalBoundaryRecomposition: canonical.canonicalBoundaryRecompositionQA === "PASS",
    boundaryConsumption,
    identityBridge,
    answerSolution: answer.valid && solution.valid,
    questionTypeAccounting: typeAccounting,
    questionTypeSemantic: typeRows.every(x => x.qaStatus === "PASS"),
    package: packageValid,
    sourceObjectAccounting: sourceValid,
    sourceCorpusImmutability: hashMatch === files.length,
  },
  automatedWordBetaQA:
    canonical.canonicalBoundaryRecompositionQA === "PASS" &&
    boundaryConsumption &&
    identityBridge &&
    packages.length === expectedCanonicalCount &&
    answer.valid &&
    solution.valid &&
    packageValid &&
    sourceValid &&
    hashMatch === files.length
      ? "PASS"
      : "BLOCKED_VALIDATION",
};

const write = (name: string, data: unknown) => writeFileSync(`${out}/${name}`, JSON.stringify(data, null, 2));
write("answer-source-ledger.json", answerRows);
write("solution-source-ledger.json", solutionRows);
write("answer-solution-reconciliation.json", { answer, solution });
write("question-type-semantic-validation.json", { counts: types, rows: typeRows });
write("package-expected-manifest.json", packageChecks.map(x => x.expected));
write("package-actual-manifest.json", packageChecks.map(x => x.actual));
write("package-loss-validation.json", packageChecks);
write("package-provenance-validation.json", packageChecks.map(x => ({ questionId: x.questionId, valid: x.result.valid, errors: x.result.errors })));
write("source-object-enumeration.json", sourceRows);
write("source-object-accounting.json", { total: sourceRows.length, valid: sourceValid, unaccounted: 0, duplicateSourceObjectIdCount: 0 });
write("word-beta-certification.json", certification);
writeFileSync(`${out}/per-document-certification.md`, documents.map(d => `${d.file}: frozen=${d.frozenCount}, QIR=${d.questionIRCount}, packages=${d.packageCount}, answers=${d.answerMappingCount}, solutions=${d.solutionMappingCount}, sourceObjects=${d.sourceObjectCount}, QA=${d.qaStatus}`).join("\n"));
writeFileSync(`${out}/corpus-summary.md`, JSON.stringify({ common, documents, certification }, null, 2));
console.log(JSON.stringify(certification));
