import { createHash } from "node:crypto";
import type { RecognitionCache, RecognitionInput, RecognitionResult } from "./types.js";

export function recognitionCacheKey(input: RecognitionInput, provider: string, providerVersion: string): string {
  const settings = Object.entries(input.settings ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return createHash("sha256").update(JSON.stringify([input.sourceHash, provider, providerVersion, settings])).digest("hex");
}
export class MemoryRecognitionCache implements RecognitionCache {
  private readonly values = new Map<string, RecognitionResult>();
  get(key: string): RecognitionResult | undefined { const value = this.values.get(key); return value && structuredClone(value); }
  set(key: string, result: RecognitionResult): void { this.values.set(key, structuredClone(result)); }
}

