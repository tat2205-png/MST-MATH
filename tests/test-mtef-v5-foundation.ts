import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { unwrapAndScanEquationNative } from "../src/modules/document-engine/docx/mtef-v5.js";

const setU16 = (b: Uint8Array, o: number, v: number): void => {
  b[o] = v & 0xff;
  b[o + 1] = (v >>> 8) & 0xff;
};

const setU32 = (b: Uint8Array, o: number, v: number): void => {
  const n = v >>> 0;
  b[o] = n & 0xff;
  b[o + 1] = (n >>> 8) & 0xff;
  b[o + 2] = (n >>> 16) & 0xff;
  b[o + 3] = (n >>> 24) & 0xff;
};

const setI32 = (b: Uint8Array, o: number, v: number): void => setU32(b, o, v);

function writeDirectoryEntry(
  sector: Uint8Array,
  offset: number,
  name: string,
  type: number,
  start: number,
  size: number,
): void {
  const entry = sector.subarray(offset, offset + 128);
  entry.fill(0);

  let p = 0;
  for (const ch of name) {
    const code = ch.charCodeAt(0);
    entry[p++] = code & 0xff;
    entry[p++] = (code >>> 8) & 0xff;
  }
  entry[p++] = 0;
  entry[p++] = 0;

  setU16(entry, 64, p);
  entry[66] = type;
  entry[67] = 1;
  setI32(entry, 68, -1);
  setI32(entry, 72, -1);
  setI32(entry, 76, -1);
  setI32(entry, 116, start);
  setU32(entry, 120, size);
  setU32(entry, 124, 0);
}

function wrapEquationNative(payload: Uint8Array): Uint8Array {
  const sectorSize = 512;
  const bytes = new Uint8Array(512 + 4 * sectorSize);
  const streamSize = 28 + payload.length;
  const miniSectorCount = Math.ceil(streamSize / 64);

  if (streamSize > sectorSize) throw new Error("TEST_FIXTURE_TOO_LARGE");

  bytes.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], 0);
  setU16(bytes, 24, 0x003e);
  setU16(bytes, 26, 0x0003);
  setU16(bytes, 28, 0xfffe);
  setU16(bytes, 30, 9);
  setU16(bytes, 32, 6);
  setU32(bytes, 40, 0);
  setU32(bytes, 44, 1);
  setI32(bytes, 48, 1);
  setU32(bytes, 52, 0);
  setU32(bytes, 56, 4096);
  setI32(bytes, 60, 3);
  setU32(bytes, 64, 1);
  setI32(bytes, 68, -2);
  setU32(bytes, 72, 0);

  for (let i = 0; i < 109; i += 1) setI32(bytes, 76 + i * 4, -1);
  setI32(bytes, 76, 0);

  const fat = bytes.subarray(512, 1024);
  for (let o = 0; o < fat.length; o += 4) setI32(fat, o, -1);
  setI32(fat, 0, -3);
  setI32(fat, 4, -2);
  setI32(fat, 8, -2);
  setI32(fat, 12, -2);

  const directory = bytes.subarray(1024, 1536);
  writeDirectoryEntry(directory, 0, "Root Entry", 5, 2, 512);
  writeDirectoryEntry(directory, 128, "Equation Native", 2, 0, streamSize);

  const rootMiniStream = bytes.subarray(1536, 2048);
  rootMiniStream[0] = 0x1c;
  rootMiniStream[1] = 0x00;
  rootMiniStream.set(payload, 28);

  const miniFat = bytes.subarray(2048, 2560);
  for (let o = 0; o < miniFat.length; o += 4) setI32(miniFat, o, -1);
  for (let i = 0; i < miniSectorCount; i += 1) {
    setI32(miniFat, i * 4, i === miniSectorCount - 1 ? -2 : i + 1);
  }

  return bytes;
}

const expectedPayload = readFileSync("tests/fixtures/mathtype-mtef-v5/G01.bin");
const bytes = wrapEquationNative(expectedPayload);
const result = unwrapAndScanEquationNative(bytes);

assert.equal(result.profile.version, 5);
assert.equal(result.profile.payloadOffset, 28);
assert.equal(result.payload.length, expectedPayload.length);
assert.deepEqual(Buffer.from(result.payload), expectedPayload);
assert(result.scan.records.length > 0);

console.log("MTEF_V5_FOUNDATION_QA=PASS");
