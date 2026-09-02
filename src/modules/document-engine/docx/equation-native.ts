import { readCfb, type CfbStream } from "./cfb.js";
export interface EquationNativeProfile { stream: string; payloadOffset: number; payloadLength: number; version: number; product?: string; }
export function findEquationNative(bytes: Uint8Array): EquationNativeProfile | undefined {
  const stream = readCfb(bytes).find(s => s.name.toLowerCase() === "equation native");
  if (!stream || stream.bytes.length < 4) return undefined;
  const headerSize = stream.bytes[0] === 0x1c && stream.bytes[1] === 0 ? 28 : 0;
  const payload = stream.bytes.subarray(headerSize);
  const version = payload[0];
  const product = new TextDecoder("latin1").decode(stream.bytes).match(/DSMT\d+/)?.[0];
  return { stream: stream.name, payloadOffset: headerSize, payloadLength: payload.length, version, ...(product ? { product } : {}) };
}
export function equationNativeStream(bytes: Uint8Array): CfbStream | undefined { return readCfb(bytes).find(s => s.name.toLowerCase() === "equation native"); }
