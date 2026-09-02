import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DocumentIR, FigureRecord } from "../document-engine/document-ir.js";
import { ingestDocx } from "../document-engine/docx/ingestion.js";
import { INPUT_DIAGNOSTIC_CODES, INPUT_LIMITS, INPUT_PIPELINE_VERSION, type InputDiagnosticCode } from "./contracts.js";
export { INPUT_DIAGNOSTIC_CODES, INPUT_LIMITS, INPUT_PIPELINE_VERSION } from "./contracts.js";

export type IngestKind = "PDF" | "IMAGE";

export interface IngestSource {
  readonly name: string;
  readonly bytes: Uint8Array;
  readonly mimeType?: string;
}

export interface IngestDiagnostic { readonly code: InputDiagnosticCode; readonly message: string }

export type InputSourceType = "DOCX" | "DOC" | "PDF" | "PNG" | "JPEG" | "UNSUPPORTED";
export type InputQuality = "A" | "B" | "C" | "REVIEW";
export interface InputAcceptanceResult {
  readonly sourceType: InputSourceType; readonly sourceHash?: string; readonly fileIntegrity: "VALID" | "INVALID";
  readonly readability: "READABLE" | "UNREADABLE"; readonly inputQuality: InputQuality;
  readonly autoProcessAllowed: boolean; readonly teacherReviewRequired: boolean;
  readonly issues: readonly IngestDiagnostic[]; readonly provenance?: DocumentIR["provenance"];
}
export interface SourceInput { readonly name: string; readonly bytes: Uint8Array; readonly mimeType?: string }

export interface ImageOrientationEvidence { readonly exifOrientation: number; readonly rotationDegrees: 0 | 90 | 180 | 270; readonly mirrored: boolean }
export function inspectImageOrientation(bytes: Uint8Array): ImageOrientationEvidence {
  let orientation = 1;
  for (let offset = 2; offset + 14 < bytes.length && bytes[0] === 0xff && bytes[1] === 0xd8;) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1], length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xe1 && Buffer.from(bytes.subarray(offset + 4, offset + 10)).toString("ascii") === "Exif\0\0") {
      const tiff = offset + 10, little = bytes[tiff] === 0x49;
      const u16 = (at:number) => little ? bytes[at] | bytes[at + 1] << 8 : bytes[at] << 8 | bytes[at + 1];
      const u32 = (at:number) => little ? (bytes[at] | bytes[at + 1] << 8 | bytes[at + 2] << 16 | bytes[at + 3] << 24) >>> 0 : (bytes[at] << 24 | bytes[at + 1] << 16 | bytes[at + 2] << 8 | bytes[at + 3]) >>> 0;
      const ifd = tiff + u32(tiff + 4), count = u16(ifd);
      for (let i = 0; i < count; i++) { const entry = ifd + 2 + i * 12; if (u16(entry) === 0x0112) orientation = u16(entry + 8); }
      break;
    }
    if (length < 2) break; offset += 2 + length;
  }
  const rotations:Record<number,0|90|180|270>={3:180,4:180,5:90,6:90,7:270,8:270};
  return { exifOrientation: orientation, rotationDegrees: rotations[orientation]??0, mirrored: [2,4,5,7].includes(orientation) };
}

export interface SourceGroupEvidence { readonly name: string; readonly sourceHash: string; readonly role: string; readonly examIdentity?: string }
export function classifySourceGroup(left: SourceGroupEvidence, right: SourceGroupEvidence): "SAME_SOURCE_GROUP" | "DIFFERENT_SOURCE_GROUP" {
  return left.examIdentity !== undefined && left.examIdentity === right.examIdentity ? "SAME_SOURCE_GROUP" : "DIFFERENT_SOURCE_GROUP";
}
export interface ReconciliationEvidence { readonly native?: string; readonly ocr?: string; readonly ai?: string }
export interface ReconciliationDecision { readonly status: "AGREE" | "FORMAT_EQUIVALENT" | "CONFLICT_REVIEW_REQUIRED"; readonly authoritativeValue?: string; readonly automaticWinner: "NATIVE" | "NONE"; readonly disagreements: readonly string[] }
const comparableMath = (value: string) => value.normalize("NFC").replaceAll("<=", "≤").replace(/\s+/g, " ").trim();
export function reconcileExtractionEvidence(evidence: ReconciliationEvidence): ReconciliationDecision {
  const native = evidence.native;
  const comparisons = [["OCR", evidence.ocr], ["AI", evidence.ai]] as const;
  const disagreements = comparisons.filter(([, value]) => value !== undefined && native !== undefined && comparableMath(value) !== comparableMath(native)).map(([provider]) => `${provider}_DISAGREES_WITH_NATIVE`);
  if (native === undefined) return { status: "CONFLICT_REVIEW_REQUIRED", automaticWinner: "NONE", disagreements: comparisons.filter(([, value]) => value !== undefined).map(([provider]) => `${provider}_WITHOUT_NATIVE_AUTHORITY`) };
  if (disagreements.length) return { status: "CONFLICT_REVIEW_REQUIRED", authoritativeValue: native, automaticWinner: "NONE", disagreements };
  const rawDifference = comparisons.some(([, value]) => value !== undefined && value !== native);
  return { status: rawDifference ? "FORMAT_EQUIVALENT" : "AGREE", authoritativeValue: native, automaticWinner: "NATIVE", disagreements: [] };
}

export type IngestResult =
  | { readonly ok: true; readonly kind: IngestKind; readonly document: DocumentIR; readonly sourceHash: string; readonly assetIds: string[] }
  | { readonly ok: false; readonly diagnostics: IngestDiagnostic[] };

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const imageTypes = new Map([[".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"]]);

function failure(code: string, message: string): IngestResult { return { ok: false, diagnostics: [{ code, message }] }; }

function pdfPages(bytes: Uint8Array): number {
  try { const info = execFileSync("pdfinfo", ["-"], { input: Buffer.from(bytes), encoding: "utf8", windowsHide: true }); const match = info.match(/^Pages:\s+(\d+)/m); return match ? Number(match[1]) : 1; } catch { return 1; }
}

function pdfDocument(source: IngestSource, sourceHash: string): DocumentIR {
  const pages = pdfPages(source.bytes); const blocks: DocumentIR["blocks"] = []; const issues: DocumentIR["extractionIssues"] = [];
  const tempRoot = mkdtempSync(join(tmpdir(), "pimath-input-")); const tempPdf = join(tempRoot, "source.pdf"); writeFileSync(tempPdf, Buffer.from(source.bytes));
  try { for (let page = 1; page <= pages; page++) {
    let text = "";
    try { text = execFileSync("pdftotext", ["-f", String(page), "-l", String(page), "-enc", "UTF-8", "-layout", tempPdf, "-"], { encoding: "utf8", windowsHide: true }); } catch { text = ""; }
    if (text.trim()) blocks.push({ id: `pdf-page-${page}`, kind: "PARAGRAPH", order: page - 1, paragraphIndex: page - 1, content: [{ type: "text", value: text, sourceLocation: `${source.name}:page:${page}` }], sourceLocation: `${source.name}:page:${page}` });
    else {
      const sourceLocation = `${source.name}:page:${page}`;
      blocks.push({ id: `pdf-page-${page}`, kind: "SECTION", order: page - 1, style: "PDF_PAGE_EVIDENCE_ONLY", content: [{ type: "text", value: "", sourceLocation }], sourceLocation });
      issues.push({ code: "PDF_PAGE_TEXT_UNAVAILABLE", severity: "WARNING", message: `No native text evidence for page ${page}. OCR/layout review is required.`, status: "REVIEW", sourceAnchor: { sourceDocumentId: sourceHash, objectIndex: page - 1 } });
    }
  } } finally { rmSync(tempRoot, { recursive: true, force: true }); }
  return { sourceDocument: source.name, sourceHash, blocks, figures: [], warnings: issues.length ? ["PDF_READING_ORDER_STATUS=REVIEW_REQUIRED", "PDF_SCAN_REQUIRES_LAYOUT_OCR"] : [], extractionIssues: issues, provenance: { sourceFile: source.name, sourceSha256: sourceHash, sourceKind: "PDF", parser: "native-pdf", parserVersion: "pdftotext-layout", transformationHistory: ["SOURCE_FINGERPRINT", "NATIVE_PAGE_EXTRACTION", "DETERMINISTIC_EVIDENCE_RECONCILIATION"] } };
}

function extension(name: string): string { const dot = name.lastIndexOf("."); return dot < 0 ? "" : name.slice(dot).toLowerCase(); }

const zipSignature = (b: Uint8Array) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5 || b[2] === 7) && (b[3] === 4 || b[3] === 6 || b[3] === 8);
function isDocxPackage(bytes: Uint8Array): boolean {
  if (!zipSignature(bytes)) return false;
  let archiveEntries = 0, embeddedAssets = 0, decompressedBytes = 0;
  for (let offset = 0; offset + 46 <= bytes.length; offset++) {
    if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4b || bytes[offset + 2] !== 0x01 || bytes[offset + 3] !== 0x02) continue;
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, Math.min(46, bytes.length - offset));
    const nameLength = view.getUint16(28, true), extraLength = view.getUint16(30, true), commentLength = view.getUint16(32, true);
    const name = Buffer.from(bytes.subarray(offset + 46, offset + 46 + nameLength)).toString("utf8");
    archiveEntries++; decompressedBytes += view.getUint32(24, true); if (/^word\/(?:media|embeddings)\//i.test(name)) embeddedAssets++;
    if (archiveEntries > INPUT_LIMITS.maxArchiveEntries || decompressedBytes > INPUT_LIMITS.maxDecompressedBytes || embeddedAssets > INPUT_LIMITS.maxEmbeddedAssets) return false;
    offset += 45 + nameLength + extraLength + commentLength;
  }
  const root = mkdtempSync(join(tmpdir(), "pimath-docx-check-")); const path = join(root, "package.docx");
  try { writeFileSync(path, Buffer.from(bytes)); const listing = execFileSync("tar", ["-tf", path], { encoding: "utf8", windowsHide: true, maxBuffer: 2 * 1024 * 1024 }); const entries = listing.split(/\r?\n/).filter(Boolean); return entries.length <= INPUT_LIMITS.maxArchiveEntries && entries.includes("[Content_Types].xml") && entries.includes("word/document.xml") && entries.some(x => x === "_rels/.rels" || x === "word/_rels/document.xml.rels"); } catch { return false; } finally { rmSync(root, { recursive: true, force: true }); }
}
const pdfSignature = (b: Uint8Array) => Buffer.from(b.subarray(0, 5)).toString("ascii") === "%PDF-";
const pngSignature = (b: Uint8Array) => Buffer.from(b.subarray(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10]));
const jpegSignature = (b: Uint8Array) => b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b.at(-2) === 0xff && b.at(-1) === 0xd9;

export function validateInputSource(source: SourceInput): InputAcceptanceResult {
  const ext = source && typeof source.name === "string" ? extension(source.name) : "";
  const bytes = source?.bytes;
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) return { sourceType: "UNSUPPORTED", fileIntegrity: "INVALID", readability: "UNREADABLE", inputQuality: "REVIEW", autoProcessAllowed: false, teacherReviewRequired: true, issues: [{ code: "EMPTY_SOURCE", message: "The source is empty." }] };
  if (bytes.length > INPUT_LIMITS.maxInputBytes) return { sourceType: "UNSUPPORTED", fileIntegrity: "INVALID", readability: "UNREADABLE", inputQuality: "REVIEW", autoProcessAllowed: false, teacherReviewRequired: true, issues: [{ code: "RESOURCE_LIMIT_EXCEEDED", message: "The source exceeds the configured input limit." }] };
  const sig = pdfSignature(bytes) ? "PDF" : pngSignature(bytes) ? "PNG" : jpegSignature(bytes) ? "JPEG" : zipSignature(bytes) ? "ZIP" : "UNKNOWN";
  const byExt: Record<string, InputSourceType> = { ".docx": "DOCX", ".doc": "DOC", ".pdf": "PDF", ".png": "PNG", ".jpg": "JPEG", ".jpeg": "JPEG" };
  const type = byExt[ext] ?? "UNSUPPORTED";
  if (type === "PDF" && /\/Encrypt\b/.test(Buffer.from(bytes).toString("latin1"))) return { sourceType: "PDF", fileIntegrity: "INVALID", readability: "UNREADABLE", inputQuality: "REVIEW", autoProcessAllowed: false, teacherReviewRequired: true, issues: [{ code: "ENCRYPTED_PDF", message: "Encrypted PDF input requires a teacher-supplied decrypted source." }] };
  const expected = type === "DOCX" ? isDocxPackage(bytes) : type === "PDF" ? sig === "PDF" : type === "PNG" ? sig === "PNG" : type === "JPEG" ? sig === "JPEG" : type === "DOC" ? false : false;
  const mismatch = type !== "UNSUPPORTED" && type !== "DOC" && (type === "DOCX" ? sig !== "ZIP" : !expected);
  const detected = sig === "ZIP" ? "DOCX" : sig === "PDF" || sig === "PNG" || sig === "JPEG" ? sig : type;
  const sourceType = type === "UNSUPPORTED" && detected !== "DOCX" && detected !== "PDF" && detected !== "PNG" && detected !== "JPEG" ? "UNSUPPORTED" : type;
  if (mismatch || sourceType === "UNSUPPORTED" || (type === "DOCX" && !expected)) return { sourceType, fileIntegrity: "INVALID", readability: "UNREADABLE", inputQuality: "REVIEW", autoProcessAllowed: false, teacherReviewRequired: true, issues: [{ code: mismatch ? "EXTENSION_SIGNATURE_MISMATCH" : type === "DOCX" ? "CORRUPT_DOCX" : "UNSUPPORTED_INPUT", message: mismatch ? "The extension does not match the file signature." : type === "DOCX" ? "The OOXML package structure is invalid." : "The input type is unsupported." }] };
  if (type === "DOC") return { sourceType: "DOC", fileIntegrity: "VALID", readability: "READABLE", inputQuality: "REVIEW", autoProcessAllowed: false, teacherReviewRequired: true, issues: [{ code: "REQUIRES_LEGACY_CONVERSION", message: "Legacy DOC requires controlled external conversion." }] };
  const sourceHash = hash(bytes);
  let readable = true;
  if (type === "DOCX") { try { ingestDocx({ name: source.name, bytes }); } catch { readable = false; } }
  const issues = readable ? [] : [{ code: "SOURCE_UNREADABLE", message: "The source could not be read by the canonical parser." }];
  return { sourceType: type, sourceHash, fileIntegrity: readable ? "VALID" : "INVALID", readability: readable ? "READABLE" : "UNREADABLE", inputQuality: type === "DOCX" ? "A" : type === "PDF" ? "B" : "C", autoProcessAllowed: readable, teacherReviewRequired: !readable || type === "PDF" || type === "PNG" || type === "JPEG", issues, provenance: { sourceFile: source.name, sourceSha256: sourceHash, sourceKind: type, parser: "document-ingest/acceptance-gate", parserVersion: "1.0", transformationHistory: ["SOURCE_FINGERPRINT", "SIGNATURE_VALIDATION", "READABILITY_CHECK"] } };
}

export function ingestToDocumentIR(source: SourceInput): DocumentIR {
  const accepted = validateInputSource(source);
  if (accepted.sourceType === "DOC") throw new Error("REQUIRES_LEGACY_CONVERSION");
  if (!accepted.sourceHash || !accepted.autoProcessAllowed) throw new Error(accepted.issues[0]?.code ?? "INPUT_REJECTED");
  if (accepted.sourceType === "DOCX") { const result = ingestDocx({ name: source.name, bytes: source.bytes }); if (!result.document) throw new Error("DOCX_UNREADABLE"); return result.document; }
  const result = ingestApprovedSource(source);
  if (result.ok === false) throw new Error(result.diagnostics[0].code);
  return { ...result.document, provenance: accepted.provenance };
}

export function ingestApprovedSource(source: IngestSource): IngestResult {
  if (!source || typeof source.name !== "string" || !source.name.trim()) return failure("SOURCE_METADATA_REQUIRED", "A source filename is required.");
  if (!(source.bytes instanceof Uint8Array) || source.bytes.length === 0) return failure("EMPTY_SOURCE", "The source is empty.");
  const ext = extension(source.name);
  if (ext === ".pdf") {
    if (source.bytes.length < 5 || Buffer.from(source.bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") return failure("INVALID_PDF", "The PDF signature is invalid.");
    const sourceHash = hash(source.bytes);
    const document = pdfDocument(source, sourceHash);
    return { ok: true, kind: "PDF", document, sourceHash, assetIds: [] };
  }
  const expectedMime = imageTypes.get(ext);
  if (!expectedMime) return failure("UNSUPPORTED_INPUT", "Only PDF, PNG, and JPEG sources are supported.");
  if (source.mimeType !== undefined && source.mimeType !== expectedMime) return failure("MIME_TYPE_MISMATCH", "The source MIME type does not match its supported extension.");
  const valid = ext === ".png" ? Buffer.from(source.bytes.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : source.bytes[0] === 0xff && source.bytes[1] === 0xd8 && source.bytes[source.bytes.length - 2] === 0xff && source.bytes[source.bytes.length - 1] === 0xd9;
  if (!valid) return failure("INVALID_IMAGE", "The image signature is invalid.");
  const sourceHash = hash(source.bytes), assetId = `asset-${sourceHash.slice(0, 16)}`;
  const figure: FigureRecord = { id: assetId, relationshipId: assetId, mediaPath: source.name, mimeType: expectedMime, bytes: new Uint8Array(source.bytes), sourceLocation: source.name };
  const issue = { code: "IMAGE_SEMANTIC_RECONSTRUCTION_UNAVAILABLE", severity: "WARNING" as const, message: "Raster text/math requires approved layout/OCR evidence; the source image remains authoritative.", status: "REVIEW" as const, sourceAnchor: { sourceDocumentId: sourceHash, objectIndex: 0 } };
  figure.provenance = { sourceFile: source.name, sourceSha256: sourceHash, sourceKind: ext.slice(1).toUpperCase(), parser: "native-image", parserVersion: "1.0", transformationHistory: ["SOURCE_FINGERPRINT", "FIGURE_IDENTITY_PRESERVED"] };
  figure.status = "REVIEW"; figure.issues = [issue];
  const document: DocumentIR = { sourceDocument: source.name, sourceHash, blocks: [{ id: "image-0", kind: "PARAGRAPH", order: 0, content: [{ type: "figure", figureId: assetId, sourceLocation: `${source.name}:region:full` }], sourceLocation: `${source.name}:region:full` }], figures: [figure], warnings: ["IMAGE_SEMANTIC_RECONSTRUCTION=REVIEW_REQUIRED"], extractionIssues: [issue], provenance: { sourceFile: source.name, sourceSha256: sourceHash, sourceKind: ext.slice(1).toUpperCase(), parser: "native-image", parserVersion: "1.0", transformationHistory: ["SOURCE_FINGERPRINT", "FIGURE_IDENTITY_PRESERVED", "DETERMINISTIC_EVIDENCE_RECONCILIATION"] } };
  return { ok: true, kind: "IMAGE", document, sourceHash, assetIds: [assetId] };
}
