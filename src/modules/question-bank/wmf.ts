import { createHash } from "node:crypto";
import { Canvas, Image, createCanvas, loadImage } from "canvas";
import { convertEmfToDataUrl, convertWmfToDataUrl } from "emf-converter";
import type { DocumentIR, FigureRecord } from "./types.js";

const PNG = Buffer.from("89504e470d0a1a0a", "hex");
let adapterQueue: Promise<void> = Promise.resolve();

async function withCanvasAdapter<T>(work: () => Promise<T>): Promise<T> {
  const previous = adapterQueue; let release!: () => void;
  adapterQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  const globals = globalThis as Record<string, unknown>;
  const saved = new Map<string, { own: boolean; value: unknown }>();
  for (const key of ["document", "HTMLCanvasElement", "Image"]) saved.set(key, { own: Object.prototype.hasOwnProperty.call(globals, key), value: globals[key] });
  try {
    globals.document = { createElement: (tag: string) => { if (tag !== "canvas") throw new Error(`UNSUPPORTED_ADAPTER_ELEMENT:${tag}`); return createCanvas(1, 1); } };
    globals.HTMLCanvasElement = Canvas; globals.Image = Image;
    return await work();
  } finally {
    for (const [key, state] of saved) state.own ? globals[key] = state.value : delete globals[key];
    release();
  }
}

function pngBytes(dataUrl: string | null): Uint8Array {
  if (!dataUrl?.startsWith("data:image/png;base64,")) throw new Error("WMF_CONVERSION_NO_PNG");
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG)) throw new Error("WMF_CONVERSION_INVALID_PNG");
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width <= 0 || height <= 0) throw new Error("WMF_CONVERSION_INVALID_DIMENSIONS");
  return bytes;
}

async function deriveComponent(source: FigureRecord): Promise<FigureRecord> {
  if (source.semanticRole !== "REAL_FIGURE" || !source.bytes || !source.mediaPath?.match(/\.(?:wmf|emf)$/i)) return source;
  const format = source.mediaPath.toLowerCase().endsWith(".emf") ? "EMF" : "WMF";
  try {
    const input = source.bytes.buffer.slice(source.bytes.byteOffset, source.bytes.byteOffset + source.bytes.byteLength);
    const url = await (format === "EMF" ? convertEmfToDataUrl(input) : convertWmfToDataUrl(input));
    const bytes = pngBytes(url); const hash = createHash("sha256").update(bytes).digest("hex");
    return { ...source, mimeType: "image/png", bytes, derivation: { ...source.derivation!, converter: { name: "emf-converter", version: "2.0.2", canvasVersion: "3.2.3" }, derivedAssetId: `${source.id}-png-${hash.slice(0, 12)}`, derivedFormat: "PNG", derivedMime: "image/png", derivedSha256: hash, status: "DERIVED" } };
  } catch (error) {
    return { ...source, bytes: undefined, mimeType: undefined, derivation: { ...source.derivation!, converter: { name: "emf-converter", version: "2.0.2", canvasVersion: "3.2.3" }, status: "FAILED", error: error instanceof Error ? error.message : String(error) } };
  }
}

const styleNumber = (style: string, name: string) => Number.parseFloat(new RegExp(`(?:^|;)${name}:([^;]+)`, "i").exec(style)?.[1] ?? "0");
type VmlElement = { tag: "shape" | "oval" | "line" | "rect" | "arc"; attrs: string; body: string; order: number };
const vmlElements = (xml: string): VmlElement[] => [...xml.matchAll(/<v:(shape|oval|line|rect|arc)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/v:\1>)/gi)]
  .map((match) => ({ tag: match[1].toLowerCase() as VmlElement["tag"], attrs: match[2], body: match[3] ?? "", order: match.index }))
  .sort((left, right) => left.order - right.order);
const pair = (values: string[], offset: number) => [Number(values[offset] || 0), Number(values[offset + 1] || 0)] as const;
function drawVmlPath(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, path: string, attrs: string, rect: { x: number; y: number; w: number; h: number }): boolean {
  const coord = (/\bcoordsize="([^"]+)"/i.exec(attrs)?.[1] ?? `${Math.abs(rect.w)},${Math.abs(rect.h)}`).split(",").map(Number);
  const flip = /(?:^|;)flip:([^;]+)/i.exec(/\bstyle="([^"]*)"/i.exec(attrs)?.[1] ?? "")?.[1] ?? "";
  const point = (x: number, y: number) => ({ x: rect.x + (flip.includes("x") ? coord[0] - x : x) / (coord[0] || 1) * rect.w, y: rect.y + (flip.includes("y") ? coord[1] - y : y) / (coord[1] || 1) * rect.h });
  let drew = false;
  for (const command of path.matchAll(/([mlc])([^mlce]*)/gi)) {
    const values = command[2].trim().split(/[ ,]/).filter((_, index, all) => index < all.length).map((value) => value.trim());
    if (command[1].toLowerCase() === "m" && values.length >= 2) { const p = point(...pair(values, 0)); ctx.moveTo(p.x, p.y); drew = true; }
    else if (command[1].toLowerCase() === "l" && values.length >= 2) { const p = point(...pair(values, 0)); ctx.lineTo(p.x, p.y); drew = true; }
    else if (command[1].toLowerCase() === "c" && values.length >= 6) { const a = point(...pair(values, 0)), b = point(...pair(values, 2)), c = point(...pair(values, 4)); ctx.bezierCurveTo(a.x, a.y, b.x, b.y, c.x, c.y); drew = true; }
  }
  return drew;
}
async function composeGroup(source: FigureRecord, components: Map<string, FigureRecord>): Promise<FigureRecord> {
  if (!source.componentIds?.length || !source.layout || !source.vmlGroupXml) return source;
  const width = source.dimensions?.widthPx ?? 800, height = source.dimensions?.heightPx ?? 600;
  const canvas = createCanvas(width, height), ctx = canvas.getContext("2d");
  ctx.fillStyle = "white"; ctx.fillRect(0, 0, width, height); ctx.strokeStyle = "#000099"; ctx.fillStyle = "white";
  const sx = width / source.layout.width, sy = height / source.layout.height, ox = source.layout.x, oy = source.layout.y;
  const xywh = (attrs: string) => { const style = /\bstyle="([^"]*)"/i.exec(attrs)?.[1] ?? ""; return { x: (styleNumber(style,"left")-ox)*sx, y:(styleNumber(style,"top")-oy)*sy, w:styleNumber(style,"width")*sx, h:styleNumber(style,"height")*sy, flip: /(?:^|;)flip:([^;]+)/i.exec(style)?.[1] ?? "" }; };
  for (const element of vmlElements(source.vmlGroupXml)) {
    const r = xywh(element.attrs), imageRid = /<v:imagedata\b[^>]*r:id="([^"]+)"/i.exec(element.body)?.[1];
    if (imageRid) {
      const item = components.get(`figure-${imageRid}`); if (!item?.bytes || !isValidPng(item.bytes)) continue;
      const image = await loadImage(Buffer.from(item.bytes)); ctx.save(); ctx.translate(r.x + (r.flip.includes("x") ? r.w : 0), r.y + (r.flip.includes("y") ? r.h : 0)); ctx.scale(r.flip.includes("x") ? -1 : 1, r.flip.includes("y") ? -1 : 1); ctx.drawImage(image, 0, 0, r.w, r.h); ctx.restore(); continue;
    }
    ctx.beginPath();
    if (element.tag === "oval" || element.tag === "arc") ctx.ellipse(r.x+r.w/2,r.y+r.h/2,Math.abs(r.w/2),Math.abs(r.h/2),0,0,Math.PI*2);
    else if (element.tag === "rect") ctx.rect(r.x, r.y, r.w, r.h);
    else { const path=/\bpath="([^"]+)"/i.exec(element.attrs)?.[1]; if (!path || !drawVmlPath(ctx, path, element.attrs, r)) { ctx.moveTo(r.x,r.y); ctx.lineTo(r.x+r.w,r.y+r.h); } }
    if (!/\bfilled="f"/i.test(element.attrs)) ctx.fill(); if (!/\bstroked="f"/i.test(element.attrs)) ctx.stroke();
  }
  const bytes=canvas.toBuffer("image/png"); if(!isValidPng(bytes)) throw new Error("VML_COMPOSITE_INVALID_PNG"); const hash=createHash("sha256").update(bytes).digest("hex");
  return { ...source, mimeType:"image/png", bytes, dimensions:{...source.dimensions,widthPx:width,heightPx:height}, derivation:{ sourceAssetId:source.id, sourceFormat:"VML_GROUP", sourceMime:"application/vnd.openxmlformats-officedocument.vmlDrawing", semanticRole:"REAL_FIGURE", converter:{name:"emf-converter",version:"2.0.2",canvasVersion:"3.2.3"},derivedAssetId:`${source.id}-png-${hash.slice(0,12)}`,derivedFormat:"PNG",derivedMime:"image/png",derivedSha256:hash,status:"DERIVED" } };
}

export async function deriveBrowserSafeFigures(document: DocumentIR): Promise<DocumentIR> {
  return withCanvasAdapter(async () => {
    const derived = new Map<string, FigureRecord>();
    for (const figure of document.figures) derived.set(figure.id, await deriveComponent(figure));
    const figures: FigureRecord[] = []; for (const figure of document.figures) figures.push(figure.componentIds ? await composeGroup(figure, derived) : derived.get(figure.id)!);
    return { ...document, figures };
  });
}

export const isValidPng = (bytes?: Uint8Array) => Boolean(bytes && bytes.length >= 24 && Buffer.from(bytes.subarray(0, 8)).equals(PNG));
export const inspectVmlElements = (xml: string) => vmlElements(xml).map(({ order: _order, ...element }) => element);
