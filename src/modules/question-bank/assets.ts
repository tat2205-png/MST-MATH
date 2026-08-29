import type { FigureRecord } from "./types.js";
import { createHash } from "node:crypto";
export class AssetRegistry {
  private readonly records = new Map<string, FigureRecord>();
  private readonly hashes = new Map<string, string>();
  register(asset: FigureRecord): string { if (!asset.id || !asset.relationshipId || !asset.sourceLocation) throw new Error("INVALID_FIGURE_RECORD"); const hash = asset.bytes ? createHash("sha256").update(asset.bytes).digest("hex") : `${asset.mediaPath}:${asset.relationshipId}`; const existing = this.hashes.get(hash); if (existing) return existing; this.records.set(asset.id, structuredClone(asset)); this.hashes.set(hash, asset.id); return asset.id; }
  get(id: string): FigureRecord | undefined { const value = this.records.get(id); return value && structuredClone(value); }
  all(): FigureRecord[] { return [...this.records.values()].map((value) => structuredClone(value)); }
}
