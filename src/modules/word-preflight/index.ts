import { createHash } from "node:crypto";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

export const PIMATH_WORD_PREFLIGHT_VERSION = "PIMATH_WORD_PREFLIGHT_SAFE_CLEAN_V1" as const;

const MAX_INPUT_BYTES = 50 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
const MAX_SINGLE_ENTRY_BYTES = 60 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 20_000;

export type WordPreflightSeverity = "INFO" | "WARNING" | "ERROR";
export type WordRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";

export interface WordPreflightIssue {
  code: string;
  severity: WordPreflightSeverity;
  message: string;
  count?: number;
}

export interface WordPreflightMetrics {
  paragraphs: number;
  tables: number;
  ommlEquations: number;
  oleObjects: number;
  drawings: number;
  legacyVmlObjects: number;
  trackedChanges: number;
  comments: number;
  fields: number;
  hyperlinks: number;
  styles: number;
  relationships: number;
  externalRelationships: number;
  mediaParts: number;
  embeddingParts: number;
  macroOrActiveXParts: number;
  repeatedPlainTextWhitespaceRuns: number;
  emptyParagraphs: number;
  proofingMarkers: number;
  zipEntries: number;
  uncompressedBytes: number;
}

export interface WordPreflightReport {
  version: typeof PIMATH_WORD_PREFLIGHT_VERSION;
  fileName: string;
  inputSha256: string;
  healthScore: number;
  riskLevel: WordRiskLevel;
  safeCleanAvailable: boolean;
  metrics: WordPreflightMetrics;
  issues: WordPreflightIssue[];
  protectedFingerprint: string;
}

export interface WordSafeCleanOptions {
  removePersonalMetadata?: boolean;
  normalizePlainTextWhitespace?: boolean;
  removeProofingNoise?: boolean;
  removeRevisionSessionMetadata?: boolean;
}

export interface WordSafeCleanChanges {
  plainTextWhitespaceRunsNormalized: number;
  proofingMarkersRemoved: number;
  revisionSessionAttributesRemoved: number;
  personalMetadataFieldsCleared: number;
  total: number;
}

export interface WordSafeCleanResult {
  version: typeof PIMATH_WORD_PREFLIGHT_VERSION;
  originalFileName: string;
  suggestedOutputFileName: string;
  sourceSha256: string;
  outputSha256: string;
  bytes: Uint8Array;
  before: WordPreflightReport;
  after: WordPreflightReport;
  changes: WordSafeCleanChanges;
  protectedFingerprintMatch: true;
  sourceBytesMutated: false;
  safeCleanQa: "PASS";
}

type PackageParts = Record<string, Uint8Array>;

type ZipDirectoryStats = {
  entries: number;
  totalUncompressedBytes: number;
  largestEntryBytes: number;
};

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function countMatches(value: string, expression: RegExp): number {
  return [...value.matchAll(expression)].length;
}

function readUInt16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function assertSafeZipDirectory(bytes: Uint8Array): ZipDirectoryStats {
  if (!bytes.length || bytes.length > MAX_INPUT_BYTES) {
    throw new Error(`INVALID_DOCUMENT: DOCX input must be between 1 byte and ${MAX_INPUT_BYTES} bytes.`);
  }
  if (bytes.length < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("INVALID_DOCUMENT: File does not have a ZIP/DOCX signature.");
  }

  const minimum = Math.max(0, bytes.length - 65_557);
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (readUInt32LE(bytes, offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("INVALID_DOCUMENT: ZIP central directory was not found.");

  const entryCount = readUInt16LE(bytes, eocd + 10);
  const centralDirectorySize = readUInt32LE(bytes, eocd + 12);
  const centralDirectoryOffset = readUInt32LE(bytes, eocd + 16);
  if (entryCount === 0xffff || centralDirectorySize === 0xffffffff || centralDirectoryOffset === 0xffffffff) {
    throw new Error("INVALID_DOCUMENT: ZIP64 DOCX packages are not accepted by the safe-clean gate.");
  }
  if (entryCount > MAX_ZIP_ENTRIES) {
    throw new Error(`INVALID_DOCUMENT: DOCX contains too many ZIP entries (${entryCount}).`);
  }
  if (centralDirectoryOffset + centralDirectorySize > bytes.length) {
    throw new Error("INVALID_DOCUMENT: ZIP central directory is out of bounds.");
  }

  let cursor = centralDirectoryOffset;
  let totalUncompressedBytes = 0;
  let largestEntryBytes = 0;
  const decoder = new TextDecoder("utf-8", { fatal: false });

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > bytes.length || readUInt32LE(bytes, cursor) !== 0x02014b50) {
      throw new Error("INVALID_DOCUMENT: ZIP central directory entry is malformed.");
    }
    const flags = readUInt16LE(bytes, cursor + 8);
    const uncompressedSize = readUInt32LE(bytes, cursor + 24);
    const fileNameLength = readUInt16LE(bytes, cursor + 28);
    const extraLength = readUInt16LE(bytes, cursor + 30);
    const commentLength = readUInt16LE(bytes, cursor + 32);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + fileNameLength;
    if (nameEnd > bytes.length) throw new Error("INVALID_DOCUMENT: ZIP entry name is out of bounds.");
    const name = decoder.decode(bytes.subarray(nameStart, nameEnd)).replace(/\\/g, "/");

    if ((flags & 0x0001) !== 0) throw new Error("INVALID_DOCUMENT: Encrypted DOCX ZIP entries are not supported.");
    if (uncompressedSize === 0xffffffff) throw new Error("INVALID_DOCUMENT: ZIP64 entry is not supported.");
    if (name.startsWith("/") || name.split("/").some((part) => part === "..")) {
      throw new Error("INVALID_DOCUMENT: Unsafe ZIP entry path detected.");
    }

    totalUncompressedBytes += uncompressedSize;
    largestEntryBytes = Math.max(largestEntryBytes, uncompressedSize);
    if (largestEntryBytes > MAX_SINGLE_ENTRY_BYTES || totalUncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
      throw new Error("INVALID_DOCUMENT: DOCX exceeds safe uncompressed-size limits.");
    }

    cursor = nameEnd + extraLength + commentLength;
  }

  return { entries: entryCount, totalUncompressedBytes, largestEntryBytes };
}

function openDocx(bytes: Uint8Array): { parts: PackageParts; stats: ZipDirectoryStats } {
  const stats = assertSafeZipDirectory(bytes);
  let parts: PackageParts;
  try {
    parts = unzipSync(bytes) as PackageParts;
  } catch (error) {
    throw new Error(`INVALID_DOCUMENT: DOCX ZIP extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parts["[Content_Types].xml"] || !parts["word/document.xml"]) {
    throw new Error("INVALID_DOCUMENT: Required OOXML document parts are missing.");
  }
  return { parts, stats };
}

function partText(parts: PackageParts, name: string): string {
  return parts[name] ? strFromU8(parts[name]) : "";
}

function protectedDocumentFragments(documentXml: string): string[] {
  const patterns = [
    /<m:oMathPara\b[\s\S]*?<\/m:oMathPara>/g,
    /<w:object\b[\s\S]*?<\/w:object>/g,
    /<w:drawing\b[\s\S]*?<\/w:drawing>/g,
    /<w:pict\b[\s\S]*?<\/w:pict>/g,
    /<w:fldSimple\b[\s\S]*?<\/w:fldSimple>/g,
    /<w:hyperlink\b[\s\S]*?<\/w:hyperlink>/g,
    /<w:ins\b[\s\S]*?<\/w:ins>/g,
    /<w:del\b[\s\S]*?<\/w:del>/g,
    /<m:oMath\b[\s\S]*?<\/m:oMath>/g,
    /<w:instrText\b[\s\S]*?<\/w:instrText>/g,
  ];
  const fragments: string[] = [];
  let working = documentXml;
  for (const pattern of patterns) {
    working = working.replace(pattern, (match) => {
      fragments.push(match);
      return `__PIMATH_PROTECTED_FRAGMENT_${fragments.length - 1}__`;
    });
  }
  return fragments;
}

function packageProtectedFingerprint(parts: PackageParts): string {
  const documentXml = partText(parts, "word/document.xml");
  const hasher = createHash("sha256");
  const mutableParts = new Set(["word/document.xml", "docProps/core.xml"]);
  for (const name of Object.keys(parts).sort()) {
    if (mutableParts.has(name)) continue;
    hasher.update(name).update("\0").update(sha256(parts[name])).update("\0");
  }
  for (const fragment of protectedDocumentFragments(documentXml)) {
    hasher.update("protected-document-fragment\0").update(sha256(fragment)).update("\0");
  }
  return hasher.digest("hex");
}

function emptyParagraphCount(documentXml: string): number {
  const paragraphs = documentXml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];
  let count = 0;
  for (const paragraph of paragraphs) {
    if (/<(?:m:oMath|w:drawing|w:pict|w:object|w:br|w:lastRenderedPageBreak|w:sectPr|w:bookmarkStart|w:bookmarkEnd)\b/.test(paragraph)) continue;
    const text = paragraph
      .replace(/<w:pPr\b[\s\S]*?<\/w:pPr>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;|&#160;/gi, " ")
      .trim();
    if (!text) count += 1;
  }
  return count;
}

function repeatedWhitespaceCount(documentXml: string): number {
  let count = 0;
  for (const match of documentXml.matchAll(/<w:t\b([^>]*)>([^<]*)<\/w:t>/g)) {
    if (/xml:space\s*=\s*["']preserve["']/.test(match[1])) continue;
    count += countMatches(match[2], /[ \t]{2,}/g);
  }
  return count;
}

function buildMetrics(parts: PackageParts, stats: ZipDirectoryStats): WordPreflightMetrics {
  const documentXml = partText(parts, "word/document.xml");
  const stylesXml = partText(parts, "word/styles.xml");
  const commentsXml = partText(parts, "word/comments.xml");
  const relationshipXml = Object.entries(parts)
    .filter(([name]) => name.endsWith(".rels"))
    .map(([, value]) => strFromU8(value))
    .join("\n");
  const partNames = Object.keys(parts);

  return {
    paragraphs: countMatches(documentXml, /<w:p\b/g),
    tables: countMatches(documentXml, /<w:tbl\b/g),
    ommlEquations: countMatches(documentXml, /<m:oMath\b/g),
    oleObjects: countMatches(documentXml, /<(?:w:object|o:OLEObject)\b/g),
    drawings: countMatches(documentXml, /<w:drawing\b/g),
    legacyVmlObjects: countMatches(documentXml, /<(?:w:pict|v:shape)\b/g),
    trackedChanges: countMatches(documentXml, /<w:(?:ins|del)\b/g),
    comments: countMatches(commentsXml, /<w:comment\b/g),
    fields: countMatches(documentXml, /<w:(?:fldChar|instrText|fldSimple)\b/g),
    hyperlinks: countMatches(documentXml, /<w:hyperlink\b/g),
    styles: countMatches(stylesXml, /<w:style\b/g),
    relationships: countMatches(relationshipXml, /<Relationship\b/g),
    externalRelationships: countMatches(relationshipXml, /<Relationship\b[^>]*TargetMode=["']External["']/gi),
    mediaParts: partNames.filter((name) => name.startsWith("word/media/") && !name.endsWith("/")).length,
    embeddingParts: partNames.filter((name) => name.startsWith("word/embeddings/") && !name.endsWith("/")).length,
    macroOrActiveXParts: partNames.filter((name) => /(?:vbaProject\.bin|word\/activeX\/)/i.test(name)).length,
    repeatedPlainTextWhitespaceRuns: repeatedWhitespaceCount(documentXml),
    emptyParagraphs: emptyParagraphCount(documentXml),
    proofingMarkers: countMatches(documentXml, /<w:proofErr\b/g),
    zipEntries: stats.entries,
    uncompressedBytes: stats.totalUncompressedBytes,
  };
}

function buildIssues(metrics: WordPreflightMetrics): WordPreflightIssue[] {
  const issues: WordPreflightIssue[] = [];
  const add = (code: string, severity: WordPreflightSeverity, message: string, count?: number) => issues.push({ code, severity, message, ...(count === undefined ? {} : { count }) });

  if (metrics.macroOrActiveXParts > 0) add("WORD_MACRO_OR_ACTIVEX_BLOCKED", "ERROR", "Macro or ActiveX content is not allowed through PiMath safe-clean.", metrics.macroOrActiveXParts);
  if (metrics.trackedChanges > 0) add("WORD_TRACK_CHANGES_PRESENT", "WARNING", "Tracked changes are preserved and require teacher review.", metrics.trackedChanges);
  if (metrics.comments > 0) add("WORD_COMMENTS_PRESENT", "WARNING", "Comments are preserved; PiMath safe-clean does not delete review content automatically.", metrics.comments);
  if (metrics.externalRelationships > 0) add("WORD_EXTERNAL_RELATIONSHIPS_PRESENT", "WARNING", "External OOXML relationships are preserved but flagged for review.", metrics.externalRelationships);
  if (metrics.oleObjects > 0) add("WORD_OLE_PROTECTED", "INFO", "OLE/MathType-compatible objects detected and protected byte-for-byte.", metrics.oleObjects);
  if (metrics.ommlEquations > 0) add("WORD_OMML_PROTECTED", "INFO", "Native Word math (OMML) detected and protected.", metrics.ommlEquations);
  if (metrics.drawings > 0 || metrics.legacyVmlObjects > 0) add("WORD_FIGURE_OBJECTS_PROTECTED", "INFO", "DrawingML/VML figure objects detected and protected.", metrics.drawings + metrics.legacyVmlObjects);
  if (metrics.repeatedPlainTextWhitespaceRuns > 0) add("WORD_PLAIN_TEXT_WHITESPACE_NOISE", "INFO", "Repeated plain-text whitespace can be normalized safely outside protected objects.", metrics.repeatedPlainTextWhitespaceRuns);
  if (metrics.emptyParagraphs > 0) add("WORD_EMPTY_PARAGRAPHS_DETECTED", "INFO", "Empty paragraphs were detected. SAFE mode reports them but does not remove them because they may carry layout intent.", metrics.emptyParagraphs);
  if (metrics.proofingMarkers > 0) add("WORD_PROOFING_NOISE", "INFO", "Word proofing markers can be removed without changing visible content.", metrics.proofingMarkers);
  if (metrics.styles > 80) add("WORD_STYLE_NOISE_HIGH", "WARNING", "The document contains an unusually large style set; SAFE mode will not rewrite styles automatically.", metrics.styles);
  return issues;
}

function healthScore(metrics: WordPreflightMetrics): number {
  if (metrics.macroOrActiveXParts > 0) return 0;
  let score = 100;
  score -= Math.min(8, Math.ceil(metrics.repeatedPlainTextWhitespaceRuns / 10));
  score -= Math.min(8, Math.ceil(metrics.emptyParagraphs / 10));
  score -= Math.min(4, Math.ceil(metrics.proofingMarkers / 25));
  score -= Math.min(6, Math.max(0, Math.ceil((metrics.styles - 60) / 10)));
  if (metrics.comments > 0) score -= 5;
  if (metrics.externalRelationships > 0) score -= 8;
  if (metrics.trackedChanges > 0) score -= 12;
  return Math.max(0, Math.min(100, score));
}

function riskLevel(metrics: WordPreflightMetrics): WordRiskLevel {
  if (metrics.macroOrActiveXParts > 0) return "BLOCKED";
  if (metrics.trackedChanges > 0 || metrics.externalRelationships > 0) return "HIGH";
  if (metrics.comments > 0 || metrics.styles > 80) return "MEDIUM";
  return "LOW";
}

export function preflightDocx(bytes: Uint8Array, fileName = "document.docx"): WordPreflightReport {
  const { parts, stats } = openDocx(bytes);
  const metrics = buildMetrics(parts, stats);
  const issues = buildIssues(metrics);
  return {
    version: PIMATH_WORD_PREFLIGHT_VERSION,
    fileName,
    inputSha256: sha256(bytes),
    healthScore: healthScore(metrics),
    riskLevel: riskLevel(metrics),
    safeCleanAvailable: !issues.some((issue) => issue.severity === "ERROR"),
    metrics,
    issues,
    protectedFingerprint: packageProtectedFingerprint(parts),
  };
}

function maskProtectedDocumentContent(documentXml: string): { masked: string; fragments: string[] } {
  const patterns = [
    /<m:oMathPara\b[\s\S]*?<\/m:oMathPara>/g,
    /<w:object\b[\s\S]*?<\/w:object>/g,
    /<w:drawing\b[\s\S]*?<\/w:drawing>/g,
    /<w:pict\b[\s\S]*?<\/w:pict>/g,
    /<w:fldSimple\b[\s\S]*?<\/w:fldSimple>/g,
    /<w:hyperlink\b[\s\S]*?<\/w:hyperlink>/g,
    /<w:ins\b[\s\S]*?<\/w:ins>/g,
    /<w:del\b[\s\S]*?<\/w:del>/g,
    /<m:oMath\b[\s\S]*?<\/m:oMath>/g,
    /<w:instrText\b[\s\S]*?<\/w:instrText>/g,
  ];
  const fragments: string[] = [];
  let masked = documentXml;
  if (masked.includes("__PIMATH_WORD_PROTECTED_")) throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Reserved protection marker already exists in document XML.");
  for (const pattern of patterns) {
    masked = masked.replace(pattern, (match) => {
      const token = `__PIMATH_WORD_PROTECTED_${fragments.length}__`;
      fragments.push(match);
      return token;
    });
  }
  return { masked, fragments };
}

function restoreProtectedDocumentContent(masked: string, fragments: string[]): string {
  let restored = masked;
  fragments.forEach((fragment, index) => {
    const token = `__PIMATH_WORD_PROTECTED_${index}__`;
    if (!restored.includes(token)) throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Protected document fragment marker was lost.");
    restored = restored.replace(token, fragment);
  });
  if (/__PIMATH_WORD_PROTECTED_\d+__/.test(restored)) throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Unresolved protected document fragment marker remains.");
  return restored;
}

function cleanDocumentXml(documentXml: string, options: Required<WordSafeCleanOptions>, trackedChanges: number): { xml: string; changes: Omit<WordSafeCleanChanges, "personalMetadataFieldsCleared" | "total"> } {
  const protectedContent = maskProtectedDocumentContent(documentXml);
  let xml = protectedContent.masked;
  let plainTextWhitespaceRunsNormalized = 0;
  let proofingMarkersRemoved = 0;
  let revisionSessionAttributesRemoved = 0;

  if (options.normalizePlainTextWhitespace) {
    xml = xml.replace(/<w:t\b([^>]*)>([^<]*)<\/w:t>/g, (full, attributes: string, text: string) => {
      if (/xml:space\s*=\s*["']preserve["']/.test(attributes)) return full;
      const matches = text.match(/[ \t]{2,}/g);
      if (!matches?.length) return full;
      plainTextWhitespaceRunsNormalized += matches.length;
      return `<w:t${attributes}>${text.replace(/[ \t]{2,}/g, " ")}</w:t>`;
    });
  }

  if (options.removeProofingNoise) {
    xml = xml.replace(/<w:proofErr\b[^>]*\/>/g, () => {
      proofingMarkersRemoved += 1;
      return "";
    });
  }

  if (options.removeRevisionSessionMetadata && trackedChanges === 0) {
    xml = xml.replace(/\s+w:rsid(?:RPr|R|Del|P|Sect)=["'][^"']*["']/g, () => {
      revisionSessionAttributesRemoved += 1;
      return "";
    });
  }

  return {
    xml: restoreProtectedDocumentContent(xml, protectedContent.fragments),
    changes: { plainTextWhitespaceRunsNormalized, proofingMarkersRemoved, revisionSessionAttributesRemoved },
  };
}

function clearCoreMetadata(coreXml: string): { xml: string; cleared: number } {
  if (!coreXml) return { xml: coreXml, cleared: 0 };
  let cleared = 0;
  let xml = coreXml;
  for (const tag of ["dc:creator", "cp:lastModifiedBy"]) {
    const expression = new RegExp(`<${tag}([^>]*)>[\\s\\S]*?<\\/${tag}>`, "g");
    xml = xml.replace(expression, (_full, attributes: string) => {
      cleared += 1;
      return `<${tag}${attributes}></${tag}>`;
    });
  }
  return { xml, cleared };
}

function assertCriticalCountsStable(before: WordPreflightMetrics, after: WordPreflightMetrics): void {
  const critical: Array<keyof WordPreflightMetrics> = [
    "paragraphs",
    "tables",
    "ommlEquations",
    "oleObjects",
    "drawings",
    "legacyVmlObjects",
    "trackedChanges",
    "comments",
    "fields",
    "hyperlinks",
    "relationships",
    "externalRelationships",
    "mediaParts",
    "embeddingParts",
    "macroOrActiveXParts",
  ];
  for (const key of critical) {
    if (before[key] !== after[key]) {
      throw new Error(`WORD_SAFE_CLEAN_QA_FAIL: Critical OOXML count changed for ${key}: ${before[key]} -> ${after[key]}.`);
    }
  }
}

function cleanFileName(fileName: string): string {
  return fileName.toLowerCase().endsWith(".docx") ? `${fileName.slice(0, -5)}.PIMATH-CLEAN.docx` : `${fileName}.PIMATH-CLEAN.docx`;
}

export function safeCleanDocx(bytes: Uint8Array, fileName = "document.docx", options: WordSafeCleanOptions = {}): WordSafeCleanResult {
  const sourceSha256 = sha256(bytes);
  const before = preflightDocx(bytes, fileName);
  if (!before.safeCleanAvailable) {
    throw new Error(`WORD_PREFLIGHT_BLOCKED: ${before.issues.filter((issue) => issue.severity === "ERROR").map((issue) => issue.code).join(",")}`);
  }

  const resolved: Required<WordSafeCleanOptions> = {
    removePersonalMetadata: options.removePersonalMetadata ?? true,
    normalizePlainTextWhitespace: options.normalizePlainTextWhitespace ?? true,
    removeProofingNoise: options.removeProofingNoise ?? true,
    removeRevisionSessionMetadata: options.removeRevisionSessionMetadata ?? true,
  };

  const { parts } = openDocx(bytes);
  const cleanedParts: PackageParts = Object.fromEntries(Object.entries(parts).map(([name, value]) => [name, value.slice()]));
  const documentClean = cleanDocumentXml(partText(cleanedParts, "word/document.xml"), resolved, before.metrics.trackedChanges);
  cleanedParts["word/document.xml"] = strToU8(documentClean.xml);

  let personalMetadataFieldsCleared = 0;
  if (resolved.removePersonalMetadata && cleanedParts["docProps/core.xml"]) {
    const coreClean = clearCoreMetadata(partText(cleanedParts, "docProps/core.xml"));
    personalMetadataFieldsCleared = coreClean.cleared;
    cleanedParts["docProps/core.xml"] = strToU8(coreClean.xml);
  }

  const protectedFingerprint = packageProtectedFingerprint(cleanedParts);
  if (protectedFingerprint !== before.protectedFingerprint) {
    throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Protected OOXML fingerprint changed.");
  }

  const output = zipSync(cleanedParts, { level: 6 });
  if (sha256(bytes) !== sourceSha256) throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Source byte array was mutated.");
  const after = preflightDocx(output, cleanFileName(fileName));
  assertCriticalCountsStable(before.metrics, after.metrics);
  if (after.protectedFingerprint !== before.protectedFingerprint) {
    throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Protected fingerprint changed after ZIP round-trip.");
  }

  const changes: WordSafeCleanChanges = {
    ...documentClean.changes,
    personalMetadataFieldsCleared,
    total: documentClean.changes.plainTextWhitespaceRunsNormalized
      + documentClean.changes.proofingMarkersRemoved
      + documentClean.changes.revisionSessionAttributesRemoved
      + personalMetadataFieldsCleared,
  };

  return {
    version: PIMATH_WORD_PREFLIGHT_VERSION,
    originalFileName: fileName,
    suggestedOutputFileName: cleanFileName(fileName),
    sourceSha256,
    outputSha256: sha256(output),
    bytes: output,
    before,
    after,
    changes,
    protectedFingerprintMatch: true,
    sourceBytesMutated: false,
    safeCleanQa: "PASS",
  };
}
