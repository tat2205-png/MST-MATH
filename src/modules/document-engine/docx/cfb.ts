export interface CfbStream {
  name: string;
  type: number;
  size: number;
  bytes: Uint8Array;
}

const CFB_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] as const;
const FREE_SECTOR = 0xffffffff;
const END_OF_CHAIN = 0xfffffffe;
const FAT_SECTOR = 0xfffffffd;
const DIFAT_SECTOR = 0xfffffffc;
const MAX_CHAIN_SECTORS = 100_000;

const u16 = (bytes: Uint8Array, offset: number) => bytes[offset] | (bytes[offset + 1] << 8);
const u32 = (bytes: Uint8Array, offset: number) => (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;

function assertRange(bytes: Uint8Array, offset: number, length: number, label: string): void {
  if (offset < 0 || length < 0 || offset + length > bytes.length) throw new Error(`INVALID_CFB_${label}_BOUNDS`);
}

function isRegularSector(value: number): boolean {
  return value !== FREE_SECTOR && value !== END_OF_CHAIN && value !== FAT_SECTOR && value !== DIFAT_SECTOR;
}

function chain(table: number[], start: number, maxSectors: number, label: string): number[] {
  if (start === FREE_SECTOR || start === END_OF_CHAIN) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  let current = start >>> 0;
  const limit = Math.min(Math.max(maxSectors, 0), MAX_CHAIN_SECTORS);
  while (isRegularSector(current)) {
    if (out.length >= limit) throw new Error(`INVALID_CFB_${label}_CHAIN_LIMIT`);
    if (seen.has(current)) throw new Error(`INVALID_CFB_${label}_CHAIN_CYCLE`);
    if (current >= table.length) throw new Error(`INVALID_CFB_${label}_CHAIN_BOUNDS`);
    seen.add(current);
    out.push(current);
    current = table[current] >>> 0;
  }
  if (current !== END_OF_CHAIN && current !== FREE_SECTOR) throw new Error(`INVALID_CFB_${label}_CHAIN_TERMINATOR`);
  return out;
}

export function readCfb(bytes: Uint8Array): CfbStream[] {
  if (bytes.length < 512 || CFB_SIGNATURE.some((value, index) => bytes[index] !== value)) throw new Error("INVALID_CFB_SIGNATURE");
  const byteOrder = u16(bytes, 28);
  const sectorShift = u16(bytes, 30);
  const miniSectorShift = u16(bytes, 32);
  if (byteOrder !== 0xfffe || ![9, 12].includes(sectorShift) || miniSectorShift !== 6) throw new Error("INVALID_CFB_HEADER");

  const sectorSize = 1 << sectorShift;
  const miniSectorSize = 1 << miniSectorShift;
  const sectorCount = Math.floor((bytes.length - 512) / sectorSize);
  if (sectorCount <= 0 || 512 + sectorCount * sectorSize > bytes.length) throw new Error("INVALID_CFB_SECTOR_LAYOUT");

  const sectorAt = (index: number): Uint8Array => {
    if (!Number.isInteger(index) || index < 0 || index >= sectorCount) throw new Error("INVALID_CFB_SECTOR_INDEX");
    const offset = 512 + index * sectorSize;
    assertRange(bytes, offset, sectorSize, "SECTOR");
    return bytes.subarray(offset, offset + sectorSize);
  };

  const fatSectorCount = u32(bytes, 44);
  const firstDirectorySector = u32(bytes, 48);
  const miniStreamCutoff = u32(bytes, 56);
  const firstMiniFatSector = u32(bytes, 60);
  const miniFatSectorCount = u32(bytes, 64);
  const firstDifatSector = u32(bytes, 68);
  const difatSectorCount = u32(bytes, 72);

  const difat: number[] = [];
  for (let index = 0; index < 109; index += 1) {
    const value = u32(bytes, 76 + index * 4);
    if (isRegularSector(value)) difat.push(value);
  }
  let nextDifat = firstDifatSector;
  const difatEntriesPerSector = sectorSize / 4 - 1;
  const seenDifat = new Set<number>();
  for (let count = 0; count < difatSectorCount; count += 1) {
    if (!isRegularSector(nextDifat) || nextDifat >= sectorCount || seenDifat.has(nextDifat)) throw new Error("INVALID_CFB_DIFAT_CHAIN");
    seenDifat.add(nextDifat);
    const sector = sectorAt(nextDifat);
    for (let index = 0; index < difatEntriesPerSector; index += 1) {
      const value = u32(sector, index * 4);
      if (isRegularSector(value)) difat.push(value);
    }
    nextDifat = u32(sector, difatEntriesPerSector * 4);
  }
  if (difat.length < fatSectorCount) throw new Error("INVALID_CFB_FAT_INVENTORY");

  const fat: number[] = [];
  for (const fatSector of difat.slice(0, fatSectorCount)) {
    const sector = sectorAt(fatSector);
    for (let offset = 0; offset < sectorSize; offset += 4) fat.push(u32(sector, offset));
  }

  const readChainBytes = (start: number, label: string, maxSectors = sectorCount): Uint8Array => {
    const ids = chain(fat, start, maxSectors, label);
    const out = new Uint8Array(ids.length * sectorSize);
    ids.forEach((sectorId, index) => out.set(sectorAt(sectorId), index * sectorSize));
    return out;
  };
  const readNormalStream = (start: number, size: number, label: string): Uint8Array => {
    if (!size) return new Uint8Array();
    const out = readChainBytes(start, label, Math.ceil(size / sectorSize) + 1);
    if (size > out.length) throw new Error(`INVALID_CFB_${label}_SIZE`);
    return out.subarray(0, size);
  };

  const directoryBytes = readChainBytes(firstDirectorySector, "DIRECTORY");
  const entries: Array<{ name: string; type: number; start: number; size: number }> = [];
  for (let offset = 0; offset + 128 <= directoryBytes.length; offset += 128) {
    const nameLength = u16(directoryBytes, offset + 64);
    const type = directoryBytes[offset + 66];
    if (type === 0) continue;
    if (nameLength < 2 || nameLength > 64 || nameLength % 2 !== 0) throw new Error("INVALID_CFB_DIRECTORY_NAME");
    const rawName = directoryBytes.subarray(offset, offset + nameLength - 2);
    let name = "";
    for (let index = 0; index < rawName.length; index += 2) name += String.fromCharCode(u16(rawName, index));
    const start = u32(directoryBytes, offset + 116);
    const low = u32(directoryBytes, offset + 120);
    const high = sectorShift === 12 ? u32(directoryBytes, offset + 124) : 0;
    const size = high * 0x1_0000_0000 + low;
    if (!Number.isSafeInteger(size)) throw new Error("INVALID_CFB_STREAM_SIZE");
    entries.push({ name, type, start, size });
  }

  const root = entries.find((entry) => entry.type === 5);
  const rootBytes = root ? readNormalStream(root.start, root.size, "MINI_STREAM") : new Uint8Array();
  const miniFatBytes = miniFatSectorCount ? readNormalStream(firstMiniFatSector, miniFatSectorCount * sectorSize, "MINIFAT") : new Uint8Array();
  const miniFat: number[] = [];
  for (let offset = 0; offset + 4 <= miniFatBytes.length; offset += 4) miniFat.push(u32(miniFatBytes, offset));

  const readMiniStream = (start: number, size: number): Uint8Array => {
    if (!size) return new Uint8Array();
    if (!root || !miniFat.length) throw new Error("INVALID_CFB_MINI_STREAM_MISSING");
    const ids = chain(miniFat, start, Math.ceil(size / miniSectorSize) + 1, "MINI");
    const out = new Uint8Array(ids.length * miniSectorSize);
    ids.forEach((miniSectorId, index) => {
      const offset = miniSectorId * miniSectorSize;
      if (offset + miniSectorSize > rootBytes.length) throw new Error("INVALID_CFB_MINI_STREAM_BOUNDS");
      out.set(rootBytes.subarray(offset, offset + miniSectorSize), index * miniSectorSize);
    });
    if (size > out.length) throw new Error("INVALID_CFB_MINI_STREAM_SIZE");
    return out.subarray(0, size);
  };

  return entries.filter((entry) => entry.type === 2).map((entry) => ({
    name: entry.name,
    type: entry.type,
    size: entry.size,
    bytes: entry.size < miniStreamCutoff ? readMiniStream(entry.start, entry.size) : readNormalStream(entry.start, entry.size, "STREAM"),
  }));
}
