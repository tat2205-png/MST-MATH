import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import type { DocumentIR, FigureRecord } from "../document-engine/document-ir.js";

export * from "./unified.js";
export * from "./mathpix-provider.js";

export type IngestKind = "PDF" | "IMAGE";

export interface IngestSource {
  readonly name: string;
  readonly bytes: Uint8Array;
  readonly mimeType?: string;
}

export interface IngestDiagnostic { readonly code: string; readonly message: string }

export type IngestResult =
  | { readonly ok: true; readonly kind: IngestKind; readonly document: DocumentIR; readonly sourceHash: string; readonly assetIds: string[] }
  | { readonly ok: false; readonly diagnostics: IngestDiagnostic[] };

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const imageTypes = new Map([[".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"]]);

function failure(code: string, message: string): IngestResult { return { ok: false, diagnostics: [{ code, message }] }; }

function extension(name: string): string { const dot = name.lastIndexOf("."); return dot < 0 ? "" : name.slice(dot).toLowerCase(); }

/**
 * Compatibility V1 ingest retained for existing callers.
 * New MST-MATH flows should use ingestUnifiedSource(), which is semantic and fail-closed.
 */
export function ingestApprovedSource(source: IngestSource): IngestResult {
  if (!source || typeof source.name !== "string" || !source.name.trim()) return failure("SOURCE_METADATA_REQUIRED", "A source filename is required.");
  if (!(source.bytes instanceof Uint8Array) || source.bytes.length === 0) return failure("EMPTY_SOURCE", "The source is empty.");
  const ext = extension(source.name);
  if (ext === ".pdf") {
    if (source.bytes.length < 5 || Buffer.from(source.bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") return failure("INVALID_PDF", "The PDF signature is invalid.");
    let text: string;
    try { text = execFileSync("pdftotext", ["-enc", "UTF-8", "-layout", "-", "-"], { input: Buffer.from(source.bytes), encoding: "utf8", windowsHide: true }); }
    catch { return failure("PDF_CONTENT_UNREADABLE", "The supported PDF content could not be extracted."); }
    const sourceHash = hash(source.bytes);
    const document: DocumentIR = { sourceDocument: source.name, sourceHash, blocks: text ? [{ id: "pdf-text-0", kind: "PARAGRAPH", order: 0, content: [{ type: "text", value: text, sourceLocation: `${source.name}:text` }], sourceLocation: `${source.name}:text` }] : [], figures: [], warnings: [] };
    return { ok: true, kind: "PDF", document, sourceHash, assetIds: [] };
  }
  const expectedMime = imageTypes.get(ext);
  if (!expectedMime) return failure("UNSUPPORTED_INPUT", "Only PDF, PNG, and JPEG sources are supported.");
  if (source.mimeType !== undefined && source.mimeType !== expectedMime) return failure("MIME_TYPE_MISMATCH", "The source MIME type does not match its supported extension.");
  const valid = ext === ".png" ? Buffer.from(source.bytes.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : source.bytes[0] === 0xff && source.bytes[1] === 0xd8 && source.bytes[source.bytes.length - 2] === 0xff && source.bytes[source.bytes.length - 1] === 0xd9;
  if (!valid) return failure("INVALID_IMAGE", "The image signature is invalid.");
  const sourceHash = hash(source.bytes), assetId = `asset-${sourceHash.slice(0, 16)}`;
  const figure: FigureRecord = { id: assetId, relationshipId: assetId, mediaPath: source.name, mimeType: expectedMime, bytes: new Uint8Array(source.bytes), sourceLocation: source.name };
  const document: DocumentIR = { sourceDocument: source.name, sourceHash, blocks: [{ id: "image-0", kind: "PARAGRAPH", order: 0, content: [{ type: "figure", figureId: assetId, sourceLocation: source.name }], sourceLocation: source.name }], figures: [figure], warnings: [] };
  return { ok: true, kind: "IMAGE", document, sourceHash, assetIds: [assetId] };
}
