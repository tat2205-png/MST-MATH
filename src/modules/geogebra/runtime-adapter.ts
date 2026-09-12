import { createHash } from "node:crypto";

export interface SessionState { version: string; objectCount: number; objectNames: string[]; fingerprint: string }
export interface ApiError { name: string; message: string }
export interface PinnedRenderer { targetId?: string; title: string; url: string; version: string; pageIdentity?: object }
type PageLike = { evaluate: <T, A>(fn: (arg: A) => T, arg?: A) => Promise<T>; title(): Promise<string>; url(): string };

export function normalizeSessionState(raw: { version: unknown; objectCount: unknown; objectNames: unknown }): SessionState {
  const names = Array.from((raw.objectNames ?? []) as ArrayLike<unknown>, value => String(value));
  const objectCount = Number(raw.objectCount);
  const version = String(raw.version ?? "");
  const fingerprint = createHash("sha256").update(JSON.stringify({ version, objectCount, objectNames: names })).digest("hex");
  return { version, objectCount, objectNames: names, fingerprint };
}

export function normalizeApiError(error: unknown): ApiError { const e = error as { name?: unknown; message?: unknown }; return { name: String(e?.name ?? "Error"), message: String(e?.message ?? error) }; }
export function assertJsonSafe(value: unknown, seen = new WeakSet<object>()): void {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) { if (typeof value === "number" && !Number.isFinite(value)) throw new Error("not JSON-safe"); return; }
  if (typeof value !== "object") throw new Error("not JSON-safe");
  if (seen.has(value)) throw new Error("not JSON-safe: cyclic reference"); seen.add(value);
  if (Array.isArray(value)) value.forEach(v => assertJsonSafe(v, seen)); else Object.values(value).forEach(v => assertJsonSafe(v, seen));
}

export class GeoGebraRuntimeAdapter {
  constructor(public readonly page: PageLike, public readonly renderer?: PinnedRenderer) {}
  async readSessionState(): Promise<SessionState> { return this.page.evaluate(() => { const api = (window as any).ggbApplet; return { version: String(api.getVersion() ?? ""), objectCount: Number(api.getObjectNumber()), objectNames: Array.from(api.getAllObjectNames() ?? [], (value: unknown) => String(value)) }; }).then(normalizeSessionState); }
  async executeCommand(command: string): Promise<boolean> { return this.page.evaluate((c) => Boolean((window as any).ggbApplet.evalCommand(c)), command); }
  async exists(label: string): Promise<boolean> { return this.page.evaluate((l) => Boolean((window as any).ggbApplet.exists(l)), label); }
  async readCommandString(label: string): Promise<string> { return this.page.evaluate((l) => String((window as any).ggbApplet.getCommandString(l, false) ?? ""), label); }
  async readObjectXml(label: string): Promise<string> { return this.page.evaluate((l) => String((window as any).ggbApplet.getXML(l) ?? ""), label); }
  async readColor(label: string): Promise<string> { return this.page.evaluate((l) => String((window as any).ggbApplet.getColor(l) ?? ""), label); }
  async readFilling(label: string): Promise<number> { return this.page.evaluate((l) => Number((window as any).ggbApplet.getFilling(l)), label); }
  async readLineThickness(label: string): Promise<number> { return this.page.evaluate((l) => Number((window as any).ggbApplet.getLineThickness(l)), label); }
  async getBase64(): Promise<string> { return this.page.evaluate(() => String((window as any).ggbApplet.getBase64() ?? "")); }
  async setBase64(base64: string): Promise<void> { await this.page.evaluate((b) => { (window as any).ggbApplet.setBase64(b); }, base64); }
  async newConstruction(): Promise<void> { await this.page.evaluate(() => { (window as any).ggbApplet.newConstruction(); }); }
  async validateRecovery(): Promise<boolean> { const b = await this.getBase64(); return Boolean(b && b.length > 20); }
  async pin(): Promise<PinnedRenderer> { return { title: await this.page.title(), url: this.page.url(), version: (await this.readSessionState()).version, pageIdentity: this.page }; }
  async waitUntilReady(): Promise<void> { await this.page.evaluate(async () => { await new Promise((resolve) => setTimeout(resolve, 1000)); }); }
  async assertPinnedRenderer(renderer: PinnedRenderer): Promise<void> { try { if (renderer.pageIdentity && renderer.pageIdentity !== this.page || this.page.url() !== renderer.url || await this.page.title() !== renderer.title || (await this.readSessionState()).version !== renderer.version) throw new Error("SESSION_RENDERER_CHANGED"); } catch (error) { if (error instanceof Error && error.message === "SESSION_RENDERER_CHANGED") throw error; throw new Error("SESSION_RENDERER_CHANGED"); } }
}
