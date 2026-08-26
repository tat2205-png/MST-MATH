import type { AssetRecord, QuestionRecord } from "./types.js";
export class AssetRegistry {
  private readonly records = new Map<string, AssetRecord>();
  register(asset: AssetRecord): void { if (!asset.assetId || !asset.sourcePath || !asset.hash) throw new Error("Invalid asset record"); this.records.set(asset.assetId, structuredClone(asset)); }
  get(assetId: string): AssetRecord | undefined { const value = this.records.get(assetId); return value && structuredClone(value); }
  registerDerived(asset: AssetRecord): void { if (!asset.derivedFromAssetId || !this.records.has(asset.derivedFromAssetId) || !asset.derivation) throw new Error("Derived asset requires registered parent and derivation evidence"); this.register(asset); }
  lineage(assetId: string): AssetRecord[] { const lineage: AssetRecord[] = []; const seen = new Set<string>(); let current = this.records.get(assetId); while (current) { if (seen.has(current.assetId)) throw new Error("Asset lineage cycle"); seen.add(current.assetId); lineage.push(structuredClone(current)); current = current.derivedFromAssetId ? this.records.get(current.derivedFromAssetId) : undefined; } return lineage; }
  validateReferences(question: QuestionRecord): string[] { const blockIds: string[] = []; const walk = (blocks: typeof question.content) => blocks.forEach((b) => { if (b.type === "image") blockIds.push(b.assetId); else if (b.type === "table") b.rows.flat().forEach(walk); }); walk(question.content); return [...new Set([...question.assets, ...blockIds])].filter((id) => !this.records.has(id)); }
}
