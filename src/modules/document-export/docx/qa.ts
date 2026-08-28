import { createHash } from "node:crypto";
import { unzipSync } from "fflate";

export interface DocxPackageAudit {
  status: "PASS" | "FAIL";
  checks: Record<string, "PASS" | "FAIL">;
  errors: string[];
  semanticFingerprint: string;
  parts: string[];
}

const requiredParts = ["[Content_Types].xml", "_rels/.rels", "word/document.xml", "word/_rels/document.xml.rels", "word/styles.xml", "word/settings.xml"];
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
const normalizeXml = (value: string) => value.replace(/<dcterms:created[^>]*>.*?<\/dcterms:created>/g, "<dcterms:created/>").replace(/>\s+</g, "><").trim();

export function auditDocxPackage(bytes: Uint8Array): DocxPackageAudit {
  const files = unzipSync(bytes);
  const parts = Object.keys(files).sort();
  const errors: string[] = [];
  const missing = requiredParts.filter((part) => !files[part]);
  if (missing.length) errors.push(`MISSING_REQUIRED_PARTS:${missing.join(",")}`);
  const forbiddenParts = parts.filter((part) => /(?:vbaProject|macros|embeddings\/|activeX\/|\.bin$|\.js$)/i.test(part));
  if (forbiddenParts.length) errors.push(`FORBIDDEN_EXECUTABLE_PARTS:${forbiddenParts.join(",")}`);
  const relationshipParts = parts.filter((part) => part.endsWith(".rels"));
  const external = relationshipParts.flatMap((part) => {
    const xml = decode(files[part]);
    return [...xml.matchAll(/<Relationship\b[^>]*>/g)].filter(([tag]) => /TargetMode="External"/i.test(tag) || /Target="(?:https?:|file:|\\\\)/i.test(tag)).map(([tag]) => `${part}:${tag}`);
  });
  if (external.length) errors.push(`EXTERNAL_RELATIONSHIPS:${external.join("|")}`);
  const relevant = parts.filter((part) => /^(?:word\/(?:document|styles|settings|header\d+|footer\d+)\.xml|word\/_rels\/document\.xml\.rels|word\/media\/|docProps\/(?:core|app)\.xml)$/.test(part));
  const fingerprintSource = relevant.map((part) => {
    const data = part.endsWith(".xml") || part.endsWith(".rels") ? new TextEncoder().encode(normalizeXml(decode(files[part]))) : files[part];
    return `${part}\0${createHash("sha256").update(data).digest("hex")}\n`;
  }).join("");
  const semanticFingerprint = createHash("sha256").update(fingerprintSource).digest("hex");
  return {
    status: errors.length ? "FAIL" : "PASS",
    checks: { DOCX_PACKAGE_QA: missing.length ? "FAIL" : "PASS", OOXML_STRUCTURE_QA: missing.length ? "FAIL" : "PASS", DOCX_EXTERNAL_RELATIONSHIP_QA: external.length ? "FAIL" : "PASS", DOCX_EXECUTABLE_CONTENT_QA: forbiddenParts.length ? "FAIL" : "PASS" },
    errors, semanticFingerprint, parts,
  };
}
