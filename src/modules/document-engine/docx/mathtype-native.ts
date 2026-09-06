import { createHash } from "node:crypto";
import type { MathExpression } from "../../math-ir/index.js";
import { readCfb } from "./cfb.js";
import { decodeMtefV5 } from "./mtef-v5.js";

export interface MathTypeDecodeContext {
  sourceName?: string;
  sourcePath: string;
  relationshipId: string;
  packagePath: string;
}

export type MathTypeDecodeResult =
  | { status: "PASS"; expression: MathExpression; mtefVersion: 5; payloadSha256: string }
  | { status: "UNSUPPORTED" | "FAIL"; code: string; message: string; mtefVersion?: number };

function u32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

export function extractEquationNativePayload(streamBytes: Uint8Array): Uint8Array {
  if (!streamBytes.length) throw new Error("MATHTYPE_EQUATION_NATIVE_EMPTY");
  let offset = 0;
  if (streamBytes.length >= 32 && u32(streamBytes, 0) === 28) offset = 28;
  if (![2, 3, 5].includes(streamBytes[offset] ?? -1) && streamBytes.length > offset + 4 && [2, 3, 5].includes(streamBytes[offset + 4])) offset += 4;
  const payload = streamBytes.subarray(offset);
  if (!payload.length || ![2, 3, 5].includes(payload[0])) throw new Error("MATHTYPE_MTEF_VERSION_NOT_FOUND");
  return payload;
}

export function decodeMathTypeOle(bytes: Uint8Array, context: MathTypeDecodeContext): MathTypeDecodeResult {
  try {
    const stream = readCfb(bytes).find((candidate) => candidate.name.toLowerCase() === "equation native");
    if (!stream) return { status: "UNSUPPORTED", code: "MATHTYPE_EQUATION_NATIVE_MISSING", message: "OLE container has no Equation Native semantic stream." };
    const payload = extractEquationNativePayload(stream.bytes);
    const version = payload[0];
    if (version !== 5) return { status: "UNSUPPORTED", code: "MATHTYPE_MTEF_VERSION_UNSUPPORTED", message: `MTEF version ${version} is not enabled by the current bounded adapter.`, mtefVersion: version };
    const decoded = decodeMtefV5(payload);
    const identitySeed = `${context.sourceName ?? "DOCX"}\0${context.packagePath}\0${context.relationshipId}\0${decoded.payloadSha256}`;
    const id = `expression-mtef5-${createHash("sha256").update(identitySeed).digest("hex").slice(0, 20)}`;
    const expression: MathExpression = {
      id,
      raw: decoded.latex,
      latex: decoded.latex,
      normalized: decoded.latex,
      metadata: {
        sourceEvidence: [{ id: `evidence-${id}`, origin: "imported", sourceType: "docx", sourceId: `${context.packagePath}#${context.relationshipId}`, excerpt: decoded.latex }],
        adapterMetadata: {
          sourceFormat: "MATHTYPE_MTEF_V5",
          decoderVersion: "mst-math-mtef-v5-g4-1",
          sourceDocument: context.sourceName ?? "DOCX",
          sourcePath: context.sourcePath,
          sourceObjectId: context.packagePath,
          relationshipId: context.relationshipId,
          equationNativeStreamName: stream.name,
          mtefVersion: 5,
          payloadSha256: decoded.payloadSha256,
          recordCount: decoded.recordCount,
          characterCount: decoded.characterCount,
          templateSelectors: decoded.templateSelectors,
        },
      },
    };
    return { status: "PASS", expression, mtefVersion: 5, payloadSha256: decoded.payloadSha256 };
  } catch (error) {
    return { status: "FAIL", code: "MATHTYPE_MTEF_DECODE_FAILED", message: error instanceof Error ? error.message : String(error) };
  }
}
