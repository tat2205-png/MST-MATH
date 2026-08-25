import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { importDocxDetailed } from "../../src/modules/question-bank/importers/docx.js";
import { importPdf } from "../../src/modules/question-bank/importers/pdf.js";
import { contentToSearchText } from "../../src/modules/question-bank/normalization.js";
import { validateQuestion } from "../../src/modules/question-bank/schema.js";
import { SqliteQuestionBankRepository } from "../../src/modules/question-bank/sqliteRepository.js";
import type { ImportCandidate, QuestionBankImportResult, QuestionBankUploadRequest, QuestionRecord } from "../../src/modules/question-bank/types.js";

const MIME_BY_EXTENSION = new Map([[".docx", new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream", ""])], [".pdf", new Set(["application/pdf", "application/octet-stream", ""])]]);

export class QuestionBankImportError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) { super(message); }
}

export interface QuestionBankImportServiceOptions { dataRoot: string; databasePath?: string }

function validateFileName(name: string): string {
  if (!name || name !== path.basename(name) || name.includes("..") || /[\\/:*?"<>|]/.test(name)) throw new QuestionBankImportError("UNSAFE_FILENAME", "Unsafe source filename");
  const clean = name.replace(/[\u0000-\u001f]/g, "_").trim();
  if (!clean) throw new QuestionBankImportError("UNSAFE_FILENAME", "Source filename is empty after sanitization");
  return clean;
}

function validateUpload(payload: QuestionBankUploadRequest): { name: string; extension: ".docx" | ".pdf"; bytes: Uint8Array } {
  const name = validateFileName(payload.originalFileName);
  const extension = path.extname(name).toLowerCase();
  if (extension !== ".docx" && extension !== ".pdf") throw new QuestionBankImportError("UNSUPPORTED_FILE_TYPE", "Only DOCX and PDF files are supported", 415);
  if (!MIME_BY_EXTENSION.get(extension)?.has(payload.mimeType || "")) throw new QuestionBankImportError("MIME_MISMATCH", "File MIME type does not match its extension", 415);
  if (!payload.dataBase64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload.dataBase64)) throw new QuestionBankImportError("INVALID_UPLOAD", "Document payload is not valid base64");
  const bytes = Buffer.from(payload.dataBase64, "base64");
  if (!bytes.length || bytes.length > 50 * 1024 * 1024) throw new QuestionBankImportError("INVALID_UPLOAD_SIZE", "Document must be between 1 byte and 50 MB", 413);
  const magicValid = extension === ".pdf" ? bytes.subarray(0, 5).toString("latin1") === "%PDF-" : bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!magicValid) throw new QuestionBankImportError("SIGNATURE_MISMATCH", "File signature does not match its extension", 415);
  return { name, extension, bytes };
}

function candidateToQuestion(candidate: ImportCandidate, index: number): QuestionRecord {
  const base = Number.parseInt(candidate.source.sourceHash.slice(0, 8), 16) % 900000 + 100000;
  const sequence = ((base + index - 100000) % 900000) + 100000;
  const now = new Date().toISOString();
  const type = candidate.questionType ?? "ESSAY"; const typeCode = type === "TRUE_FALSE" ? "TF" : type === "SHORT_ANSWER" ? "SA" : type; const searchText = contentToSearchText(candidate.content); const metadata = /oxyz/iu.test(searchText) ? { chapter: "Hình học giải tích", topic: "Oxyz", knowledgeUnit: "Chờ phân loại chi tiết" } : /hàm số/iu.test(searchText) ? { chapter: "Hàm số", topic: "Khảo sát hàm số", knowledgeUnit: "Chờ phân loại chi tiết" } : /hình chóp|hình lăng trụ/iu.test(searchText) ? { chapter: "Hình học không gian", topic: "Khối đa diện", knowledgeUnit: "Chờ phân loại chi tiết" } : { chapter: "Chưa phân loại", topic: "Chưa phân loại", knowledgeUnit: "Chờ giáo viên phân loại" };
  return { id: `NA-M12-IMPORT-SOURCE-${typeCode}-L1-${String(sequence).padStart(6, "0")}`, grade: 12, subject: "MATH", curriculum: "GDPT_2018", chapter: metadata.chapter, lesson: "Chưa phân loại", topic: metadata.topic, knowledgeUnit: metadata.knowledgeUnit, questionType: type, cognitiveLevel: "RECOGNITION", difficulty: 1, content: candidate.content, options: candidate.options, statements: candidate.statements, answer: candidate.answer ?? (type === "ESSAY" ? { type: "ESSAY" } : undefined), solution: candidate.solution, assets: candidate.assetIds, tags: ["imported", type.toLocaleLowerCase()], searchText, source: candidate.source, status: candidate.status === "QUARANTINED" ? "QUARANTINED" : "REVIEW", createdAt: now, updatedAt: now, importMetadata: candidate.confidence && candidate.sourcePosition ? { confidence: candidate.confidence, evidence: candidate.evidence ?? [], warnings: candidate.notes, sourcePosition: candidate.sourcePosition } : undefined };
}

export class QuestionBankImportService {
  readonly repository: SqliteQuestionBankRepository;
  constructor(private readonly options: QuestionBankImportServiceOptions) {
    mkdirSync(options.dataRoot, { recursive: true });
    this.repository = new SqliteQuestionBankRepository(options.databasePath ?? path.join(options.dataRoot, "question-bank.db"));
  }
  importUpload(payload: QuestionBankUploadRequest): QuestionBankImportResult {
    const upload = validateUpload(payload);
    const docx = upload.extension === ".docx" ? importDocxDetailed(upload.bytes, upload.name) : undefined;
    const imported = docx ? { kind: "DOCX" as const, candidates: docx.candidates, warnings: docx.document.warnings, diagnostics: docx.diagnostics as unknown as Record<string, number> } : (() => { const result = importPdf(upload.bytes, upload.name); return { kind: result.classification, candidates: result.candidates, warnings: result.routing ? [result.routing] : [], diagnostics: undefined }; })();
    const source = imported.candidates[0]?.source;
    if (!source) throw new QuestionBankImportError("NO_CANDIDATES", "No question candidates were extracted", 422);
    const existing = this.repository.searchQuestions({});
    if (existing.some((q) => q.source.sourceHash === source.sourceHash)) return { success: true, duplicate: true, source, sourceKind: imported.kind, candidatesCreated: imported.candidates.length, questionsSaved: 0, reviewRequired: 0, quarantined: 0, warnings: ["DUPLICATE_SOURCE"], diagnostics: imported.diagnostics };
    const sourceDir = path.join(this.options.dataRoot, "source", upload.extension === ".docx" ? "word" : "pdf"); mkdirSync(sourceDir, { recursive: true });
    const storedName = `${path.parse(upload.name).name.replace(/[^\p{L}\p{N}._-]+/gu, "_")}-${source.sourceHash.slice(0, 12)}${upload.extension}`; const destination = path.join(sourceDir, storedName);
    try { writeFileSync(destination, upload.bytes, { flag: "wx" }); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    if (docx?.assets.length) { const assetDir = path.join(this.options.dataRoot, "assets", "image"); mkdirSync(assetDir, { recursive: true }); for (const asset of docx.assets) { const extension = path.extname(asset.target).replace(/[^.a-z0-9]/gi, "") || ".bin"; const assetPath = path.join(assetDir, `${asset.assetId}${extension}`); try { writeFileSync(assetPath, asset.bytes, { flag: "wx" }); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; } } }
    let saved = 0; const warnings = [...imported.warnings];
    imported.candidates.forEach((candidate, index) => { const question = candidateToQuestion(candidate, index); const failures = validateQuestion(question).filter((q) => q.level === "FAIL"); if (failures.length) { warnings.push(...failures.map((q) => q.code)); return; } if (question.status === "APPROVED") throw new Error("AUTO_APPROVAL_GUARD"); try { this.repository.saveQuestion(question); saved += 1; } catch (error) { warnings.push((error as Error).message.includes("UNIQUE") ? "QUESTION_ID_COLLISION" : "PERSISTENCE_ERROR"); } });
    return { success: true, duplicate: false, source, sourceKind: imported.kind, candidatesCreated: imported.candidates.length, questionsSaved: saved, reviewRequired: imported.candidates.filter((c) => c.status !== "QUARANTINED").length, quarantined: imported.candidates.filter((c) => c.status === "QUARANTINED").length, warnings: [...new Set([...warnings, ...imported.candidates.flatMap((c) => c.notes)])], diagnostics: imported.diagnostics };
  }
  listQuestions(): QuestionRecord[] { return this.repository.searchQuestions({}); }
  close(): void { this.repository.close(); }
}
