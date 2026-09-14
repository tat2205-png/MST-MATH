import { createHash } from "node:crypto";
import type { RenderManifest } from "./types.js";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => [key, canonicalize(record[key])]),
    );
  }
  return value;
}

/** Stable byte representation used by golden/regression QA. */
export function serializeRenderManifest(manifest: RenderManifest): string {
  return JSON.stringify(canonicalize(manifest));
}

/** Content fingerprint; metadata ordering cannot change the result. */
export function fingerprintRenderManifest(manifest: RenderManifest): string {
  return createHash("sha256").update(serializeRenderManifest(manifest), "utf8").digest("hex");
}
