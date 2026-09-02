import type { Express, Request, Response } from "express";
import { preflightDocx, safeCleanDocx, type WordSafeCleanOptions } from "../../src/modules/word-preflight/index.js";

const MAX_BASE64_CHARS = 70_000_000;

type WordPreflightBody = {
  fileName?: unknown;
  base64?: unknown;
  options?: unknown;
};

function parseBase64Document(body: WordPreflightBody): { fileName: string; bytes: Uint8Array; options?: WordSafeCleanOptions } {
  if (typeof body.fileName !== "string" || !body.fileName.trim().toLowerCase().endsWith(".docx")) {
    throw new Error("INVALID_DOCUMENT: A .docx fileName is required.");
  }
  if (typeof body.base64 !== "string" || !body.base64.length || body.base64.length > MAX_BASE64_CHARS) {
    throw new Error("INVALID_DOCUMENT: A bounded base64 DOCX payload is required.");
  }
  const compact = body.base64.replace(/\s+/g, "");
  if (compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new Error("INVALID_DOCUMENT: DOCX payload is not valid base64.");
  }
  const decoded = Buffer.from(compact, "base64");
  const canonical = decoded.toString("base64").replace(/=+$/, "");
  if (canonical !== compact.replace(/=+$/, "")) {
    throw new Error("INVALID_DOCUMENT: DOCX base64 payload failed canonical validation.");
  }
  const options = body.options && typeof body.options === "object" && !Array.isArray(body.options)
    ? body.options as WordSafeCleanOptions
    : undefined;
  return { fileName: body.fileName.trim(), bytes: new Uint8Array(decoded), options };
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
      modes: ["PREFLIGHT", "SAFE_CLEAN"],
      sourceOverwrite: false,
      protectedContent: ["OMML", "OLE_MATHTYPE", "DRAWINGML", "VML", "RELATIONSHIPS", "MEDIA", "EMBEDDINGS", "FIELDS", "TRACKED_CHANGES"],
    });
  });

  app.post("/api/word-preflight/analyze", (request: Request, response: Response) => {
    noStore(response);
    try {
      const { fileName, bytes } = parseBase64Document(request.body || {});
      response.json({ success: true, result: preflightDocx(bytes, fileName) });
    } catch (error) {
      sendWordError(response, error);
    }
  });

  app.post("/api/word-preflight/safe-clean", (request: Request, response: Response) => {
    noStore(response);
    try {
      const { fileName, bytes, options } = parseBase64Document(request.body || {});
      const result = safeCleanDocx(bytes, fileName, options);
      const { bytes: cleanedBytes, ...report } = result;
      response.json({
        success: true,
        result: {
          ...report,
          cleanedBase64: Buffer.from(cleanedBytes).toString("base64"),
        },
      });
    } catch (error) {
      sendWordError(response, error);
    }
  });
}
