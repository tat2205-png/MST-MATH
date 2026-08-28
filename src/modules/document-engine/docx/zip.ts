import { inflateRawSync } from "node:zlib";
import type { DocumentEngineIssue } from "../types.js";

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const MAX_ENTRIES = 5_000;
const MAX_COMPRESSED_BYTES = 25 * 1024 * 1024;
const MAX_ENTRY_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_RATIO = 1_000;

export interface SafeZipPackage {
  entries: Map<string, Uint8Array>;
  issues: DocumentEngineIssue[];
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function safePackagePath(name: string): boolean {
  return name.length > 0 && name.length <= 512 && !name.includes("\\") && !name.startsWith("/") && !/^[a-z]:/i.test(name) && !name.split("/").some((part) => part === ".." || part === "");
}

function findEocd(buffer: Buffer): number {
  const minimum = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimum; offset--) if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;
  return -1;
}

export function readSafeZip(input: Uint8Array): SafeZipPackage {
  const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (buffer.length < 22 || buffer.length > MAX_COMPRESSED_BYTES) throw new Error("INVALID_DOCX_ARCHIVE: archive size is invalid or exceeds the compressed limit.");
  const eocd = findEocd(buffer);
  if (eocd < 0) throw new Error("INVALID_DOCX_ARCHIVE: ZIP end record is missing.");
  const disk = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const diskEntries = buffer.readUInt16LE(eocd + 8);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (disk !== 0 || centralDisk !== 0 || diskEntries !== entryCount) throw new Error("INVALID_DOCX_ARCHIVE: multi-disk ZIP is unsupported.");
  if (entryCount > MAX_ENTRIES || centralOffset + centralSize > eocd) throw new Error("INVALID_DOCX_ARCHIVE: central directory bounds are invalid.");

  const entries = new Map<string, Uint8Array>();
  const issues: DocumentEngineIssue[] = [];
  let cursor = centralOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < entryCount; index++) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) throw new Error("INVALID_DOCX_ARCHIVE: malformed central directory.");
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const expectedCrc = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const end = cursor + 46 + nameLength + extraLength + commentLength;
    if (end > buffer.length) throw new Error("INVALID_DOCX_ARCHIVE: truncated central entry.");
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString((flags & 0x800) ? "utf8" : "utf8");
    cursor = end;
    if (!safePackagePath(name)) throw new Error(`ZIP_PATH_TRAVERSAL: unsafe package path ${name}`);
    if (entries.has(name)) throw new Error(`INVALID_DOCX_ARCHIVE: duplicate package entry ${name}`);
    if (flags & 0x1) throw new Error(`INVALID_DOCX_ARCHIVE: encrypted entry ${name} is unsupported.`);
    if (![0, 8].includes(method)) throw new Error(`INVALID_DOCX_ARCHIVE: compression method ${method} is unsupported.`);
    if (uncompressedSize > MAX_ENTRY_BYTES || totalUncompressed + uncompressedSize > MAX_TOTAL_BYTES) throw new Error("ZIP_BOMB_LIMIT: uncompressed size limit exceeded.");
    if (compressedSize === 0 ? uncompressedSize > 0 : uncompressedSize / compressedSize > MAX_RATIO) throw new Error("ZIP_BOMB_LIMIT: compression ratio limit exceeded.");
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== LOCAL_SIGNATURE) throw new Error(`INVALID_DOCX_ARCHIVE: local entry missing for ${name}.`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > buffer.length) throw new Error(`INVALID_DOCX_ARCHIVE: entry data is truncated for ${name}.`);
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    const output = method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed, { maxOutputLength: MAX_ENTRY_BYTES });
    if (output.length !== uncompressedSize || crc32(output) !== expectedCrc) throw new Error(`INVALID_DOCX_ARCHIVE: integrity check failed for ${name}.`);
    totalUncompressed += output.length;
    if (!name.endsWith("/")) entries.set(name, new Uint8Array(output));
  }
  if (cursor !== centralOffset + centralSize) issues.push({ code: "ZIP_CENTRAL_PADDING", severity: "warning", message: "ZIP central directory contains unparsed padding." });
  return { entries, issues };
}
