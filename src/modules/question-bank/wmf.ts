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
async function composeGroup(source: FigureRecord, components: Map<string, FigureRecord>): Promise<FigureRecord> {
  if (!source.componentIds?.length || !source.layout || !source.vmlGroupXml) return source;
  const width = source.dimensions?.widthPx ?? 800, height = source.dimensions?.heightPx ?? 600;
  const canvas = createCanvas(width, height), ctx = canvas.getContext("2d");
  ctx.fillStyle = "white"; ctx.fillRect(0, 0, width, height); ctx.strokeStyle = "#000099"; ctx.fillStyle = "white";
  const sx = width / source.layout.width, sy = height / source.layout.height, ox = source.layout.x, oy = source.layout.y;
  const xywh = (attrs: string) => { const style = /\bstyle="([^"]*)"/i.exec(attrs)?.[1] ?? ""; return { x: (styleNumber(style,"left")-ox)*sx, y:(styleNumber(style,"top")-oy)*sy, w:styleNumber(style,"width")*sx, h:styleNumber(style,"height")*sy }; };
  for (const oval of source.vmlGroupXml.matchAll(/<v:oval\b([^>]*)\/?>(?:[\s\S]*?<\/v:oval>)?/gi)) { const r=xywh(oval[1]); ctx.beginPath(); ctx.ellipse(r.x+r.w/2,r.y+r.h/2,Math.abs(r.w/2),Math.abs(r.h/2),0,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
  for (const shape of source.vmlGroupXml.matchAll(/<v:shape\b([^>]*)>([\s\S]*?)<\/v:shape>|<v:shape\b([^>]*)\/>/gi)) { const attrs=shape[1]??shape[3]??""; if (/type="#_x0000_t75"/i.test(attrs)) continue; const r=xywh(attrs); const path=/\bpath="([^"]+)"/i.exec(attrs)?.[1]; ctx.beginPath(); if (path) { const nums=(path.match(/-?\d+(?:\.\d+)?/g)??[]).map(Number); if(nums.length>=2)ctx.moveTo(r.x+nums[0]/1796*r.w,r.y+nums[1]/827*r.h); if(/c/i.test(path)&&nums.length>=8)ctx.bezierCurveTo(r.x+nums[2]/1796*r.w,r.y+nums[3]/827*r.h,r.x+nums[4]/1796*r.w,r.y+nums[5]/827*r.h,r.x+nums[6]/1796*r.w,r.y+nums[7]/827*r.h); else ctx.lineTo(r.x+r.w,r.y+r.h); } else { ctx.moveTo(r.x,r.y); ctx.lineTo(r.x+r.w,r.y+r.h); } ctx.stroke(); }
  for (const shape of source.vmlGroupXml.matchAll(/<v:shape\b([^>]*)>[\s\S]*?<v:imagedata\b([^>]*)\/?>(?:[\s\S]*?<\/v:shape>)?/gi)) { const rid=/r:id="([^"]+)"/i.exec(shape[2])?.[1]; const item=rid?components.get(`figure-${rid}`):undefined; if(!item?.bytes||!isValidPng(item.bytes))continue; const image=await loadImage(Buffer.from(item.bytes)); const r=xywh(shape[1]); ctx.drawImage(image,r.x,r.y,r.w,r.h); }
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
