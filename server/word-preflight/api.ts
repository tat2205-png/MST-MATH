import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import { preflightDocx, safeCleanDocx, type WordPreflightReport, type WordSafeCleanOptions } from "../../src/modules/word-preflight/index.js";
import { analyzeLegacyExamDocument, type LegacyExamAnalysis } from "../../src/modules/word-preflight/legacyExam.js";
import {
  inspectWordActiveContent,
  sanitizeVbaToDocx,
  type WordActiveContentInspection,
  type WordVbaSanitizationResult,
} from "../../src/modules/word-preflight/activeContent.js";

const MAX_BASE64_CHARS = 70_000_000;
const ACCEPTED_WORD_EXTENSION = /\.(?:docx|docm|dotm)$/i;

type WordPreflightBody = {
  fileName?: unknown;
  base64?: unknown;
  options?: unknown;
};

type AugmentedWordPreflightReport = WordPreflightReport & {
  legacyExam: LegacyExamAnalysis;
  activeContent: WordActiveContentInspection;
};

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function cleanOutputFileName(fileName: string): string {
  return `${fileName.replace(ACCEPTED_WORD_EXTENSION, "")}.PIMATH-CLEAN.docx`;
}

function parseBase64Document(body: WordPreflightBody): { fileName: string; bytes: Uint8Array; options?: WordSafeCleanOptions } {
  if (typeof body.fileName !== "string" || !ACCEPTED_WORD_EXTENSION.test(body.fileName.trim())) {
    throw new Error("INVALID_DOCUMENT: A .docx, .docm, or .dotm fileName is required.");
  }
  if (typeof body.base64 !== "string" || !body.base64.length || body.base64.length > MAX_BASE64_CHARS) {
    throw new Error("INVALID_DOCUMENT: A bounded base64 Word OOXML payload is required.");
  }
  const compact = body.base64.replace(/\s+/g, "");
  if (compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new Error("INVALID_DOCUMENT: Word payload is not valid base64.");
  }
  const decoded = Buffer.from(compact, "base64");
  const canonical = decoded.toString("base64").replace(/=+$/, "");
  if (canonical !== compact.replace(/=+$/, "")) {
    throw new Error("INVALID_DOCUMENT: Word base64 payload failed canonical validation.");
  }
  const options = body.options && typeof body.options === "object" && !Array.isArray(body.options)
    ? body.options as WordSafeCleanOptions
    : undefined;
  return { fileName: body.fileName.trim(), bytes: new Uint8Array(decoded), options };
}

function augmentReport(report: WordPreflightReport, bytes: Uint8Array): AugmentedWordPreflightReport {
  const activeContent = inspectWordActiveContent(bytes);
  const legacyExam = analyzeLegacyExamDocument(bytes);
  let issues = [...report.issues];

  if (activeContent.hasVba && !activeContent.hasActiveX) {
    issues = issues.filter((issue) => issue.code !== "WORD_MACRO_OR_ACTIVEX_BLOCKED");
    issues.unshift({
      code: "WORD_VBA_QUARANTINE_AVAILABLE",
      severity: "WARNING",
      message: "VBA payload detected. PiMath will never execute it; SAFE CLEAN can quarantine VBA and emit a macro-free .docx while preserving document.xml and non-target package parts.",
      count: activeContent.vbaParts.length || activeContent.vbaRelationshipCount,
    });
  }

  for (const issue of legacyExam.issues) {
    issues.push({ code: issue.code, severity: issue.severity, message: issue.message, ...(issue.count === undefined ? {} : { count: issue.count }) });
  }

  const blockingErrors = issues.some((issue) => issue.severity === "ERROR");
  return {
    ...report,
    riskLevel: activeContent.hasActiveX ? "BLOCKED" : activeContent.hasVba ? "HIGH" : report.riskLevel,
    safeCleanAvailable: !activeContent.hasActiveX && !blockingErrors,
    issues,
    legacyExam,
    activeContent,
  };
}

function sanitizationSummary(result: WordVbaSanitizationResult | null) {
  if (!result) return null;
  const { bytes: _bytes, ...summary } = result;
  return summary;
}

function sendWordError(response: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const status = message.startsWith("INVALID_DOCUMENT") ? 400
    : message.startsWith("WORD_PREFLIGHT_BLOCKED") || message.startsWith("WORD_SAFE_CLEAN_QA_FAIL") ? 422
      : 500;
  const code = message.split(":", 1)[0] || "WORD_PREFLIGHT_FAILED";
  response.status(status).json({ success: false, code, error: message.replace(`${code}:`, "").trim() });
}

function noStore(response: Response): void {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

export function registerWordPreflightRoutes(app: Pick<Express, "get" | "post">): void {
  app.get("/api/word-preflight/status", (_request: Request, response: Response) => {
    noStore(response);
    response.json({
      success: true,
      version: "PIMATH_WORD_PREFLIGHT_SAFE_CLEAN_V1",
      modes: ["PREFLIGHT", "SAFE_CLEAN", "LEGACY_EXAM_ANALYSIS", "VBA_QUARANTINE"],
      acceptedExtensions: [".docx", ".docm", ".dotm"],
      sourceOverwrite: false,
      vbaExecution: false,
      activeXPolicy: "BLOCK",
      protectedContent: ["OMML", "OLE_MATHTYPE", "DRAWINGML", "VML", "RELATIONSHIPS", "MEDIA", "EMBEDDINGS", "FIELDS", "TRACKED_CHANGES"],
      legacyHints: ["SMARTTEST_HASH", "SMARTTEST_GROUP", "ANSWER_COLOR", "ANSWER_HIGHLIGHT", "ANSWER_UNDERLINE", "LEGACY_ID4_ID5_ID6"],
    });
  });

  app.post("/api/word-preflight/analyze", (request: Request, response: Response) => {
    noStore(response);
    try {
      const { fileName, bytes } = parseBase64Document(request.body || {});
      response.json({ success: true, result: augmentReport(preflightDocx(bytes, fileName), bytes) });
    } catch (error) {
      sendWordError(response, error);
    }
  });

  app.post("/api/word-preflight/safe-clean", (request: Request, response: Response) => {
    noStore(response);
    try {
      const { fileName, bytes, options } = parseBase64Document(request.body || {});
      const originalSha256 = sha256(bytes);
      const before = augmentReport(preflightDocx(bytes, fileName), bytes);
      if (!before.safeCleanAvailable) {
        throw new Error(`WORD_PREFLIGHT_BLOCKED: ${before.issues.filter((issue) => issue.severity === "ERROR").map((issue) => issue.code).join(",")}`);
      }

      let workingBytes = bytes;
      let workingFileName = fileName;
      let vbaSanitization: WordVbaSanitizationResult | null = null;
      if (before.activeContent.hasVba) {
        vbaSanitization = sanitizeVbaToDocx(bytes, fileName);
        workingBytes = vbaSanitization.bytes;
        workingFileName = vbaSanitization.suggestedOutputFileName;
      }

      const cleaned = safeCleanDocx(workingBytes, workingFileName, options);
      if (sha256(bytes) !== originalSha256) throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Original source bytes changed during safe-clean orchestration.");
      const after = augmentReport(cleaned.after, cleaned.bytes);
      if (after.activeContent.hasVba || after.activeContent.hasActiveX) {
        throw new Error("WORD_SAFE_CLEAN_QA_FAIL: Active content survived the final PiMath clean artifact.");
      }

      const { bytes: cleanedBytes, ...coreReport } = cleaned;
      response.json({
        success: true,
        result: {
          ...coreReport,
          originalFileName: fileName,
          suggestedOutputFileName: cleanOutputFileName(fileName),
          sourceSha256: originalSha256,
          before,
          after,
          vbaSanitization: sanitizationSummary(vbaSanitization),
          sourceBytesMutated: false,
          cleanedBase64: Buffer.from(cleanedBytes).toString("base64"),
        },
      });
    } catch (error) {
      sendWordError(response, error);
    }
  });
}
