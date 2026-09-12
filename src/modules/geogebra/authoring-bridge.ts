import { writeFileSync } from "node:fs";
import { unzipSync } from "fflate";

export interface GeoGebraAuthoringApi {
  evalCommand(command: string): boolean;
  exists(label: string): boolean;
  getCommandString(label: string, localized?: boolean): string;
  getVersion(): string;
  getBase64(): string;
  getColor?(label: string): string;
  getFilling?(label: string): number;
  getLineThickness?(label: string): number;
  getXML?(label: string): string;
  setValue?(label: string, value: number): void;
  getObjectNumber?(): number;
  getAllObjectNames?(): string[];
  newConstruction?(): void;
  setBase64?(base64: string): void;
}

/** Adapter for the official GeoGebra Apps API object exposed by an embedded app. */
export function createOfficialGeoGebraApi(applet: Pick<GeoGebraAuthoringApi, "evalCommand" | "exists" | "getCommandString" | "getVersion" | "getBase64">): GeoGebraAuthoringApi {
  return applet;
}

export interface GeoGebraCommandBlock { id: string; commands: string[] }
export interface CanonicalCommand { global_index: number; block_id: string; block_index: number; command_family: string; exact_text: string }
export interface CommandExecution { global_index?: number; block: string; command_index: number; command_text: string; engine_version: string; success: boolean; error_context: string | null; raw_eval_result?: boolean; verification_method?: string; postcondition_result?: { getter: string; expected: string; actual: string | null; pass: boolean } }

const SETFILLING_TOLERANCE = 1e-9;

function commandFamily(command: string) { return /^(SetColor|SetFilling|SetLineThickness|SetConditionToShowObject)\s*\(/.exec(command)?.[1] ?? "Ordinary"; }
export function createCanonicalCommandMap(blocks: GeoGebraCommandBlock[]): CanonicalCommand[] {
  let global_index = 0;
  return blocks.flatMap((block) => block.commands.map((exact_text, offset) => ({ global_index: ++global_index, block_id: block.id, block_index: offset + 1, command_family: commandFamily(exact_text), exact_text })));
}

function normalizeCondition(value: string) { return value.replace(/&amp;/g, "&").replace(/∧/g, "&&").replace(/\s+/g, "").replace(/^\((.*)\)$/, "$1"); }
export function verifyVisibilityCondition(api: GeoGebraAuthoringApi, target: string, expected: string) {
  if (!api.getXML || !api.exists(target)) return { getter: "getXML", expected, actual: null, pass: false };
  const xml = api.getXML(target); const match = /<condition\b[^>]*\bshowObject\s*=\s*["']([^"']+)["'][^>]*\/?\s*>/i.exec(xml);
  const actual = match?.[1] ?? null;
  return { getter: "getXML", expected, actual, pass: actual !== null && normalizeCondition(actual) === normalizeCondition(expected) };
}

export function verifyLineThickness(api: GeoGebraAuthoringApi, target: string, expectedText: string) {
  const expected = Number(expectedText);
  const actual = api.getLineThickness?.(target) ?? null;
  return { getter: "getLineThickness", expected: expectedText, actual: actual === null || !Number.isFinite(actual) ? null : String(actual), pass: api.exists(target) && Number.isFinite(expected) && actual !== null && Number.isFinite(actual) && actual === expected };
}

export function parseCanonicalBlocks(source: string): GeoGebraCommandBlock[] {
  const lines = source.split(/\r?\n/);
  const blocks: GeoGebraCommandBlock[] = [];
  let current: GeoGebraCommandBlock | undefined;
  for (const line of lines) {
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) { current = { id: header[1], commands: [] }; blocks.push(current); continue; }
    if (!current || /^\s*$/.test(line) || /^\s*#/.test(line)) continue;
    current.commands.push(line);
  }
  if (blocks.length === 0) throw new Error("CANONICAL_COMMAND_BLOCKS_EMPTY");
  return blocks;
}

export function verifyRequiredObjects(api: GeoGebraAuthoringApi, labels: string[]) {
  const missing = labels.filter((label) => !api.exists(label));
  return { required: labels, verified: labels.filter((label) => !missing.includes(label)), missing };
}
