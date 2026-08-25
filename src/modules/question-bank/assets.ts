import type { AssetRecord, QuestionRecord } from "./types.js";
export class AssetRegistry {
  private readonly records = new Map<string, AssetRecord>();
  register(asset: AssetRecord): void { if (!asset.assetId || !asset.sourcePath || !asset.hash) throw new Error("Invalid asset record"); this.records.set(asset.assetId, structuredClone(asset)); }
  get(assetId: string): AssetRecord | undefined { const value = this.records.get(assetId); return value && structuredClone(value); }
  validateReferences(question: QuestionRecord): string[] { const blockIds: string[] = []; const walk = (blocks: typeof question.content) => blocks.forEach((b) => { if (b.type === "image") blockIds.push(b.assetId); else if (b.type === "table") b.rows.flat().forEach(walk); }); walk(question.content); return [...new Set([...question.assets, ...blockIds])].filter((id) => !this.records.has(id)); }
}
