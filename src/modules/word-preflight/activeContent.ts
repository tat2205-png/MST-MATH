import { createHash } from "node:crypto";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

export const PIMATH_WORD_ACTIVE_CONTENT_SANITIZER_VERSION = "PIMATH_WORD_ACTIVE_CONTENT_SANITIZER_V1" as const;

type PackageParts = Record<string, Uint8Array>;

export interface WordActiveContentInspection {
  version: typeof PIMATH_WORD_ACTIVE_CONTENT_SANITIZER_VERSION;
  hasVba: boolean;
  hasActiveX: boolean;
  vbaParts: string[];
  activeXParts: string[];
  vbaRelationshipCount: number;
  canSanitizeVba: boolean;
}

export interface WordVbaSanitizationResult {
  version: typeof PIMATH_WORD_ACTIVE_CONTENT_SANITIZER_VERSION;
  originalFileName: string;
  suggestedOutputFileName: string;
  sourceSha256: string;
  outputSha256: string;
  bytes: Uint8Array;
  removedParts: string[];
  changedRelationshipParts: string[];
  removedRelationshipCount: number;
  contentTypeNormalized: boolean;
  documentXmlBytePreserved: true;
  preservedPartQa: "PASS";
  sourceBytesMutated: false;
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeName(name: string): string {
  return name.replace(/\\/g, "/");
}

function isVbaPayloadPart(name: string): boolean {
  const normalized = normalizeName(name);
  return /^word\/(?:vbaProject(?:Signature(?:Agile|V3)?)?\.bin|vbaData\.xml)$/i.test(normalized)
    || /^word\/_rels\/(?:vbaProject(?:Signature(?:Agile|V3)?)?\.bin|vbaData\.xml)\.rels$/i.test(normalized);
}

function isActiveXPart(name: string): boolean {
  return /^word\/activeX\//i.test(normalizeName(name));
}

function openPackage(bytes: Uint8Array): PackageParts {
  try {
    return unzipSync(bytes) as PackageParts;
  } catch (error) {
    throw new Error(`INVALID_DOCUMENT: Word OOXML ZIP extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function relationshipIsVba(tag: string): boolean {
  return /(?:Type|Target)=["'][^"']*(?:vbaProject|vbaData)[^"']*["']/i.test(tag);
}

function countVbaRelationships(parts: PackageParts): number {
  let count = 0;
  for (const [name, bytes] of Object.entries(parts)) {
    if (!name.endsWith(".rels")) continue;
    const xml = strFromU8(bytes);
    for (const match of xml.matchAll(/<Relationship\b[^>]*\/>/gi)) {
      if (relationshipIsVba(match[0])) count += 1;
    }
  }
  return count;
}

export function inspectWordActiveContent(bytes: Uint8Array): WordActiveContentInspection {
  const parts = openPackage(bytes);
  const names = Object.keys(parts);
  const vbaParts = names.filter(isVbaPayloadPart).sort();
  const activeXParts = names.filter(isActiveXPart).sort();
  const vbaRelationshipCount = countVbaRelationships(parts);
  const hasVba = vbaParts.length > 0 || vbaRelationshipCount > 0;
  const hasActiveX = activeXParts.length > 0;
  return {
    version: PIMATH_WORD_ACTIVE_CONTENT_SANITIZER_VERSION,
    hasVba,
    hasActiveX,
    vbaParts,
    activeXParts,
    vbaRelationshipCount,
    canSanitizeVba: hasVba && !hasActiveX,
  };
}

function removeVbaRelationships(xml: string): { xml: string; removed: number } {
  let removed = 0;
  const cleaned = xml.replace(/<Relationship\b[^>]*\/>/gi, (tag) => {
    if (!relationshipIsVba(tag)) return tag;
    removed += 1;
    return "";
  });
  return { xml: cleaned, removed };
}

function normalizeContentTypes(xml: string): { xml: string; normalized: boolean } {
  let normalized = false;
  let next = xml.replace(/<Override\b[^>]*PartName=["']\/word\/(?:vbaProject(?:Signature(?:Agile|V3)?)?\.bin|vbaData\.xml)["'][^>]*\/>/gi, () => {
    normalized = true;
    return "";
  });
  next = next.replace(/application\/vnd\.ms-word\.(?:document\.macroEnabled\.main|template\.macroEnabledTemplate\.main)\+xml/gi, () => {
    normalized = true;
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
  });
  return { xml: next, normalized };
}

function cleanOutputFileName(fileName: string): string {
  const base = fileName.replace(/\.(?:docx|docm|dotm)$/i, "");
  return `${base}.PIMATH-CLEAN.docx`;
}

function assertPreservedParts(
  before: PackageParts,
  after: PackageParts,
  removedParts: ReadonlySet<string>,
  changedParts: ReadonlySet<string>,
): void {
  for (const [name, bytes] of Object.entries(before)) {
    if (removedParts.has(name) || changedParts.has(name)) continue;
    const candidate = after[name];
    if (!candidate || sha256(candidate) !== sha256(bytes)) {
      throw new Error(`WORD_SAFE_CLEAN_QA_FAIL: Non-target Word package part changed during VBA sanitization: ${name}`);
    }
  }
}

export function sanitizeVbaToDocx(bytes: Uint8Array, fileName: string): WordVbaSanitizationResult {
  const sourceSha256 = sha256(bytes);
  const before = openPackage(bytes);
  const inspection = inspectWordActiveContent(bytes);
  if (inspection.hasActiveX) {
    throw new Error("WORD_PREFLIGHT_BLOCKED: WORD_ACTIVEX_BLOCKED");
  }
  if (!inspection.hasVba) {
    throw new Error("WORD_VBA_SANITIZATION_NOT_REQUIRED: No VBA payload was detected.");
  }

  const cleaned: PackageParts = Object.fromEntries(Object.entries(before).map(([name, value]) => [name, value.slice()]));
  const removedParts = new Set<string>();
  for (const name of Object.keys(cleaned)) {
    if (!isVbaPayloadPart(name)) continue;
    delete cleaned[name];
    removedParts.add(name);
  }

  const changedRelationshipParts: string[] = [];
  let removedRelationshipCount = 0;
  for (const [name, value] of Object.entries(cleaned)) {
    if (!name.endsWith(".rels")) continue;
    const original = strFromU8(value);
    const result = removeVbaRelationships(original);
    if (result.removed === 0) continue;
    cleaned[name] = strToU8(result.xml);
    changedRelationshipParts.push(name);
    removedRelationshipCount += result.removed;
  }

  const contentTypeName = "[Content_Types].xml";
  const contentTypes = cleaned[contentTypeName];
  if (!contentTypes) throw new Error("INVALID_DOCUMENT: [Content_Types].xml is missing.");
  const contentTypeResult = normalizeContentTypes(strFromU8(contentTypes));
  cleaned[contentTypeName] = strToU8(contentTypeResult.xml);

  const changedParts = new Set<string>([contentTypeName, ...changedRelationshipParts]);
  assertPreservedParts(before, cleaned, removedParts, changedParts);

  const beforeDocument = before["word/document.xml"];
  const afterDocument = cleaned["word/document.xml"];
  if (!beforeDocument || !afterDocument || sha256(beforeDocument) !== sha256(afterDocument)) {
    throw new Error("WORD_SAFE_CLEAN_QA_FAIL: word/document.xml changed during VBA quarantine.");
  }

  const output = zipSync(cleaned, { level: 6 });
  const afterInspection = inspectWordActiveContent(output);
  if (afterInspection.hasVba || afterInspection.hasActiveX) {
    throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Active Word payload remains after VBA quarantine.");
  }
  const reopened = openPackage(output);
  assertPreservedParts(before, reopened, removedParts, changedParts);
  if (!reopened["word/document.xml"] || sha256(reopened["word/document.xml"]) !== sha256(beforeDocument)) {
    throw new Error("WORD_SAFE_CLEAN_QA_FAIL: document.xml fingerprint changed after VBA quarantine ZIP round-trip.");
  }
  if (sha256(bytes) !== sourceSha256) {
    throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Source byte array was mutated during VBA quarantine.");
  }

  return {
    version: PIMATH_WORD_ACTIVE_CONTENT_SANITIZER_VERSION,
    originalFileName: fileName,
    suggestedOutputFileName: cleanOutputFileName(fileName),
    sourceSha256,
    outputSha256: sha256(output),
    bytes: output,
    removedParts: [...removedParts].sort(),
    changedRelationshipParts: changedRelationshipParts.sort(),
    removedRelationshipCount,
    contentTypeNormalized: contentTypeResult.normalized,
    documentXmlBytePreserved: true,
    preservedPartQa: "PASS",
    sourceBytesMutated: false,
  };
}
