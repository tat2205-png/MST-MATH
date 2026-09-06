import { createHash } from "node:crypto";

export interface MtefV5DecodeResult {
  latex: string;
  payloadSha256: string;
  recordCount: number;
  characterCount: number;
  templateSelectors: number[];
}

type MtefNode =
  | { type: "LINE"; options: number; children: MtefNode[] }
  | { type: "CHAR"; options: number; typeface: number; mtCode: number; fontPosition?: number }
  | { type: "TMPL"; options: number; selector: number; variation: number; templateOptions: number; children: MtefNode[] }
  | { type: "IGNORED"; recordType: number };

class Cursor {
  constructor(readonly bytes: Uint8Array, public offset = 0) {}
  private need(length: number): void { if (length < 0 || this.offset + length > this.bytes.length) throw new Error(`MTEF_V5_OUT_OF_BOUNDS@${this.offset}:need=${length}`); }
  u8(): number { this.need(1); return this.bytes[this.offset++]; }
  u16(): number { this.need(2); const value = this.bytes[this.offset] | (this.bytes[this.offset + 1] << 8); this.offset += 2; return value; }
  bytesView(length: number): Uint8Array { this.need(length); const value = this.bytes.subarray(this.offset, this.offset + length); this.offset += length; return value; }
  unsigned(): number { const value = this.u8(); return value === 0xff ? this.u16() : value; }
  signed(): number { const value = this.u8(); return value === 0xff ? this.u16() - 32768 : value - 128; }
  stringZ(): string { const values: number[] = []; while (this.offset < this.bytes.length) { const value = this.u8(); if (value === 0) return new TextDecoder("latin1").decode(new Uint8Array(values)); values.push(value); } throw new Error("MTEF_V5_UNTERMINATED_STRING"); }
}

function skipNudge(cursor: Cursor): void {
  const rawX = cursor.u8(), rawY = cursor.u8();
  if (rawX === 128 && rawY === 128) { cursor.u16(); cursor.u16(); }
}

function skipRuler(cursor: Cursor): void {
  const stopCount = cursor.signed();
  if (stopCount < 0 || stopCount > 64) throw new Error(`MTEF_V5_INVALID_RULER_COUNT:${stopCount}`);
  for (let index = 0; index < stopCount; index += 1) { cursor.signed(); cursor.u16(); }
}

function skipDimensionArray(cursor: Cursor, count: number): void {
  if (count > 64) throw new Error(`MTEF_V5_DIMENSION_ARRAY_TOO_LARGE:${count}`);
  for (let index = 0; index < count; index += 1) {
    let groups = 0;
    while (true) {
      const value = cursor.u8(); groups += 1;
      if ((value & 0x0f) === 0x0f || (value >> 4) === 0x0f) break;
      if (groups > 64) throw new Error("MTEF_V5_DIMENSION_ARRAY_UNBOUNDED");
    }
  }
}

function readVariation(cursor: Cursor): number {
  const first = cursor.u8();
  return (first & 0x80) !== 0 ? (first & 0x7f) | (cursor.u8() << 8) : first;
}

function parseHeader(cursor: Cursor): void {
  if (cursor.u8() !== 5) throw new Error("MTEF_V5_EXPECTED_VERSION_5");
  cursor.u8(); cursor.u8(); cursor.u8(); cursor.u8();
  cursor.stringZ();
  cursor.u8();
}

function parseList(cursor: Cursor, depth: number, counters: { records: number; chars: number; selectors: Set<number> }, topLine = false): MtefNode[] {
  if (depth > 128) throw new Error("MTEF_V5_NESTING_LIMIT");
  const nodes: MtefNode[] = [];
  while (cursor.offset < cursor.bytes.length) {
    const recordType = cursor.u8();
    counters.records += 1;
    if (recordType === 0) return nodes;
    const hasOptions = [1, 2, 3, 4, 5, 6, 16, 18].includes(recordType);
    const options = hasOptions ? cursor.u8() : 0;
    if ((options & 0x08) !== 0 && [1, 2, 3, 4, 5, 6].includes(recordType)) skipNudge(cursor);

    if (recordType === 1) {
      if ((options & 0x04) !== 0) cursor.u16();
      if ((options & 0x02) !== 0) skipRuler(cursor);
      const isNull = (options & 0x01) !== 0 && !topLine;
      nodes.push({ type: "LINE", options, children: isNull ? [] : parseList(cursor, depth + 1, counters, true) });
      continue;
    }
    if (recordType === 2) {
      if ((options & 0x01) !== 0) throw new Error("MTEF_V5_UNSUPPORTED_CHAR_EMBELLISHMENT");
      const typeface = cursor.signed();
      if ((options & 0x20) !== 0) throw new Error("MTEF_V5_CHAR_WITHOUT_MTCODE_UNSUPPORTED");
      const mtCode = cursor.u16();
      let fontPosition: number | undefined;
      if ((options & 0x04) !== 0) fontPosition = cursor.u8();
      else if ((options & 0x10) !== 0) fontPosition = cursor.u16();
      counters.chars += 1;
      nodes.push({ type: "CHAR", options, typeface, mtCode, ...(fontPosition === undefined ? {} : { fontPosition }) });
      continue;
    }
    if (recordType === 3) {
      const selector = cursor.u8();
      const variation = readVariation(cursor);
      const templateOptions = cursor.u8();
      counters.selectors.add(selector);
      nodes.push({ type: "TMPL", options, selector, variation, templateOptions, children: parseList(cursor, depth + 1, counters) });
      continue;
    }
    if ([4, 5, 6].includes(recordType)) throw new Error(`MTEF_V5_UNSUPPORTED_STRUCTURE_RECORD:${recordType}`);
    if (recordType === 7) { skipRuler(cursor); nodes.push({ type: "IGNORED", recordType }); continue; }
    if (recordType === 8) { cursor.unsigned(); cursor.u8(); nodes.push({ type: "IGNORED", recordType }); continue; }
    if (recordType === 9) {
      const sizeCode = cursor.signed();
      if (sizeCode === 101) cursor.u16();
      else if (sizeCode === 100) { cursor.u8(); cursor.u16(); }
      else cursor.u8();
      nodes.push({ type: "IGNORED", recordType }); continue;
    }
    if ([10, 11, 12, 13, 14].includes(recordType)) { nodes.push({ type: "IGNORED", recordType }); continue; }
    if (recordType === 15) { cursor.unsigned(); nodes.push({ type: "IGNORED", recordType }); continue; }
    if (recordType === 16) {
      cursor.u16(); cursor.u16(); cursor.u16();
      if ((options & 0x04) !== 0) cursor.stringZ();
      nodes.push({ type: "IGNORED", recordType }); continue;
    }
    if (recordType === 17) { cursor.unsigned(); cursor.stringZ(); nodes.push({ type: "IGNORED", recordType }); continue; }
    if (recordType === 18) {
      skipDimensionArray(cursor, cursor.u8());
      skipDimensionArray(cursor, cursor.u8());
      const styleCount = cursor.u8();
      if (styleCount > 64) throw new Error(`MTEF_V5_STYLE_COUNT_TOO_LARGE:${styleCount}`);
      for (let index = 0; index < styleCount; index += 1) { const present = cursor.u8(); if (present) cursor.u8(); }
      nodes.push({ type: "IGNORED", recordType }); continue;
    }
    if (recordType === 19) { cursor.stringZ(); nodes.push({ type: "IGNORED", recordType }); continue; }
    if (recordType >= 100) { cursor.bytesView(cursor.unsigned()); nodes.push({ type: "IGNORED", recordType }); continue; }
    throw new Error(`MTEF_V5_UNKNOWN_RECORD:${recordType}`);
  }
  throw new Error("MTEF_V5_MISSING_END");
}

const CHAR_LATEX = new Map<number, string>([
  [0x03a9, "\\Omega"],
  [0x2205, "\\varnothing"],
  [0x2209, "\\notin"],
  [0x2212, "-"],
  [0x2229, "\\cap"],
  [0x222a, "\\cup"],
  [0x2260, "\\ne"],
]);
const SPACE_MTCODES = new Set([0xeb01, 0xeb02, 0xeb04, 0xeb05, 0xeb08, 0xef02, 0xef04, 0xef05]);
const ESCAPED_ASCII = new Map<string, string>([["{", "\\{"], ["}", "\\}"], ["%", "\\%"], ["#", "\\#"], ["&", "\\&"], ["_", "\\_"], ["$", "\\$"]]);

function renderChar(node: Extract<MtefNode, { type: "CHAR" }>): string {
  if (node.typeface === 24 || SPACE_MTCODES.has(node.mtCode)) return " ";
  const mapped = CHAR_LATEX.get(node.mtCode);
  if (mapped) return mapped;
  if (node.mtCode >= 32 && node.mtCode <= 126) {
    const value = String.fromCharCode(node.mtCode);
    return ESCAPED_ASCII.get(value) ?? value;
  }
  throw new Error(`MTEF_V5_UNSUPPORTED_MTCODE:0x${node.mtCode.toString(16).toUpperCase()}`);
}

function structural(nodes: MtefNode[]): MtefNode[] { return nodes.filter((node) => node.type === "LINE" || node.type === "CHAR" || node.type === "TMPL"); }
function lines(nodes: MtefNode[]): Array<Extract<MtefNode, { type: "LINE" }>> { return structural(nodes).filter((node): node is Extract<MtefNode, { type: "LINE" }> => node.type === "LINE"); }
function renderNodes(nodes: MtefNode[]): string { return nodes.map(renderNode).join(""); }
function renderLine(node: Extract<MtefNode, { type: "LINE" }>): string { return renderNodes(node.children); }

function renderTemplate(node: Extract<MtefNode, { type: "TMPL" }>): string {
  const slotLines = lines(node.children);
  if (node.templateOptions !== 0) throw new Error(`MTEF_V5_UNSUPPORTED_TEMPLATE_OPTIONS:${node.selector}:${node.templateOptions}`);
  if (node.selector === 1 || node.selector === 2) {
    if (node.variation !== 3 || slotLines.length < 1) throw new Error(`MTEF_V5_UNSUPPORTED_FENCE_VARIATION:${node.selector}:${node.variation}`);
    const main = renderLine(slotLines[0]);
    return node.selector === 1 ? `\\left(${main}\\right)` : `\\left\\{${main}\\right\\}`;
  }
  if (node.selector === 11) {
    if (node.variation !== 0 || slotLines.length !== 2) throw new Error(`MTEF_V5_UNSUPPORTED_FRACTION_SHAPE:${node.variation}:${slotLines.length}`);
    return `\\frac{${renderLine(slotLines[0])}}{${renderLine(slotLines[1])}}`;
  }
  if (node.selector === 13) {
    if (node.variation !== 0 || slotLines.length < 1) throw new Error(`MTEF_V5_UNSUPPORTED_OVERBAR_SHAPE:${node.variation}:${slotLines.length}`);
    return `\\overline{${renderLine(slotLines[0])}}`;
  }
  if (node.selector === 29) {
    if (node.variation !== 0 || slotLines.length !== 2) throw new Error(`MTEF_V5_UNSUPPORTED_SUBSUP_SHAPE:${node.variation}:${slotLines.length}`);
    return `_{${renderLine(slotLines[0])}}^{${renderLine(slotLines[1])}}`;
  }
  throw new Error(`MTEF_V5_UNSUPPORTED_TEMPLATE_SELECTOR:${node.selector}`);
}

function renderNode(node: MtefNode): string {
  if (node.type === "CHAR") return renderChar(node);
  if (node.type === "LINE") return renderLine(node);
  if (node.type === "TMPL") return renderTemplate(node);
  return "";
}

export function decodeMtefV5(payload: Uint8Array): MtefV5DecodeResult {
  const cursor = new Cursor(payload);
  parseHeader(cursor);
  const counters = { records: 0, chars: 0, selectors: new Set<number>() };
  const nodes = parseList(cursor, 0, counters, true);
  if (cursor.offset !== payload.length) throw new Error(`MTEF_V5_TRAILING_BYTES:${payload.length - cursor.offset}`);
  const latex = renderNodes(nodes).trim();
  if (!latex) throw new Error("MTEF_V5_EMPTY_SEMANTIC_OUTPUT");
  return {
    latex,
    payloadSha256: createHash("sha256").update(payload).digest("hex"),
    recordCount: counters.records,
    characterCount: counters.chars,
    templateSelectors: [...counters.selectors].sort((left, right) => left - right),
  };
}
