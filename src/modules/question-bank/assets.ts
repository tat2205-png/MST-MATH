import type { FigureRecord } from "./types.js";
export class AssetRegistry {
  private readonly records = new Map<string, FigureRecord>();
  register(asset: FigureRecord): void { if (!asset.id || !asset.relationshipId || !asset.sourceLocation) throw new Error("INVALID_FIGURE_RECORD"); this.records.set(asset.id, structuredClone(asset)); }
  get(id: string): FigureRecord | undefined { const value = this.records.get(id); return value && structuredClone(value); }
  all(): FigureRecord[] { return [...this.records.values()].map((value) => structuredClone(value)); }
}
