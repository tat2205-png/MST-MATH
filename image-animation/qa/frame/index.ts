import { createHash } from "node:crypto";
import type { FrameEvidence, FrameQaIssue, FrameQaResult } from "./types.ts";

export * from "./types.ts";

function validDimension(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function createFrameEvidence(
  frameIndex: number,
  width: number,
  height: number,
  rgbaPixels: Uint8Array,
): FrameEvidence {
  if (!Number.isSafeInteger(frameIndex) || frameIndex < 0) {
    throw new TypeError("Frame index must be a non-negative safe integer.");
  }
  if (!validDimension(width) || !validDimension(height)) {
    throw new TypeError("Frame dimensions must be positive safe integers.");
  }
  const expectedLength = width * height * 4;
  if (!Number.isSafeInteger(expectedLength) || rgbaPixels.byteLength !== expectedLength) {
    throw new TypeError(`RGBA frame byte length must equal width * height * 4 (${expectedLength}).`);
  }
  const bytes = Buffer.from(rgbaPixels.buffer, rgbaPixels.byteOffset, rgbaPixels.byteLength);
  return Object.freeze({
    version: 1 as const,
    frameIndex,
    width,
    height,
    pixelFormat: "rgba8" as const,
    byteLength: rgbaPixels.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

function isValidEvidence(value: FrameEvidence): boolean {
  return value.version === 1 && Number.isSafeInteger(value.frameIndex) && value.frameIndex >= 0 &&
    validDimension(value.width) && validDimension(value.height) && value.pixelFormat === "rgba8" &&
    value.byteLength === value.width * value.height * 4 && /^[a-f0-9]{64}$/.test(value.sha256);
}

export function evaluateFrameQa(
  evidence: readonly FrameEvidence[],
  requiredFrameIndexes: readonly number[],
): FrameQaResult {
  const canonicalEvidence = [...evidence].sort((left, right) => left.frameIndex - right.frameIndex);
  const issues: FrameQaIssue[] = [];
  if (canonicalEvidence.length === 0) {
    issues.push({ code: "NO_FRAME_EVIDENCE", message: "Frame QA requires pixel-backed frame evidence." });
  }

  const seen = new Set<number>();
  for (const item of canonicalEvidence) {
    if (!isValidEvidence(item)) {
      issues.push({ code: "INVALID_FRAME_EVIDENCE", frameIndex: item.frameIndex, message: `Frame ${item.frameIndex} evidence is invalid.` });
    }
    if (seen.has(item.frameIndex)) {
      issues.push({ code: "DUPLICATE_FRAME", frameIndex: item.frameIndex, message: `Frame ${item.frameIndex} has duplicate evidence.` });
    }
    seen.add(item.frameIndex);
  }

  const required = [...new Set(requiredFrameIndexes)].sort((left, right) => left - right);
  for (const frameIndex of required) {
    if (!Number.isSafeInteger(frameIndex) || frameIndex < 0) {
      throw new TypeError("Required frame indexes must be non-negative safe integers.");
    }
    if (!seen.has(frameIndex)) {
      issues.push({ code: "MISSING_FRAME", frameIndex, message: `Frame ${frameIndex} has no evidence.` });
    }
  }
  issues.sort((left, right) =>
    (left.frameIndex ?? -1) - (right.frameIndex ?? -1) || left.code.localeCompare(right.code, "en"));
  return Object.freeze({
    passed: issues.length === 0 && canonicalEvidence.length > 0,
    evidence: Object.freeze(canonicalEvidence),
    issues: Object.freeze(issues),
  });
}

export const validateFrameQa = evaluateFrameQa;
