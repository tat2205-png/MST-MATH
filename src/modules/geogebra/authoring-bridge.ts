import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

export interface GeoGebraAuthoringApi {
  evalCommand(command: string): boolean;
  exists(label: string): boolean;
  getCommandString(label: string, localized?: boolean): string;
  getVersion(): string;
  getBase64(): string;
  setValue?(label: string, value: number): void;
}

/** Adapter for the official GeoGebra Apps API object exposed by an embedded app. */
export function createOfficialGeoGebraApi(applet: Pick<GeoGebraAuthoringApi, "evalCommand" | "exists" | "getCommandString" | "getVersion" | "getBase64">): GeoGebraAuthoringApi {
  return applet;
}

export interface GeoGebraCommandBlock { id: string; commands: string[] }
export interface CommandExecution { block: string; command_index: number; command_text: string; engine_version: string; success: boolean; error_context: string | null }

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

export function executeCanonicalBlocks(api: GeoGebraAuthoringApi, blocks: GeoGebraCommandBlock[]): { records: CommandExecution[]; firstFailure: CommandExecution | null } {
  const records: CommandExecution[] = [];
  const engine_version = api.getVersion();
  for (const block of blocks) for (let i = 0; i < block.commands.length; i++) {
    const command_text = block.commands[i];
    let success = false; let error_context: string | null = null;
    try { success = api.evalCommand(command_text) === true; if (!success) error_context = "GeoGebra evalCommand returned false"; }
    catch (error) { error_context = error instanceof Error ? error.message : String(error); }
    const record = { block: block.id, command_index: i + 1, command_text, engine_version, success, error_context };
    records.push(record);
    if (!success) return { records, firstFailure: record };
  }
  return { records, firstFailure: null };
}

export function verifyRequiredObjects(api: GeoGebraAuthoringApi, labels: string[]) {
  const missing = labels.filter((label) => !api.exists(label));
  return { required: labels, verified: labels.filter((label) => !missing.includes(label)), missing };
}

export function exportCandidateGgb(api: GeoGebraAuthoringApi, candidatePath: string, writeFile: (path: string, data: Buffer) => void) {
  const encoded = api.getBase64();
  if (!encoded) return { status: "FAIL", reason: "GEOGEBRA_EXPORT_EMPTY" } as const;
  if (/goldens[\\/]geogebra[\\/]fold[\\/].*\.ggb$/i.test(candidatePath)) throw new Error("REFUSING_CANONICAL_GGB_OVERWRITE");
  const data = Buffer.from(encoded, "base64");
  if (data.length === 0) return { status: "FAIL", reason: "GEOGEBRA_EXPORT_INVALID_BASE64" } as const;
  writeFile(candidatePath, data);
  return { status: "PASS", path: candidatePath, bytes: data.length } as const;
}

export function createAuthoringEvidence(source: string, golden_id: string, blocks: GeoGebraCommandBlock[], api: GeoGebraAuthoringApi, execution: ReturnType<typeof executeCanonicalBlocks>, objects: ReturnType<typeof verifyRequiredObjects>, exportStatus: { status: string; path?: string }) {
  return { evidence_type: "AUTOMATED_AUTHORING_ENGINE", engine_version: api.getVersion(), golden_id, source_hash: createHash("sha256").update(source, "utf8").digest("hex"), block_count: blocks.length, command_count: blocks.reduce((n, b) => n + b.commands.length, 0), per_command: execution.records, first_failure: execution.firstFailure, objects_verified: objects, export: exportStatus };
}

export function runAuthoringBridge(options: { source: string; golden_id: string; api: GeoGebraAuthoringApi; requiredObjects: string[]; candidatePath: string; writeFile: (path: string, data: Buffer) => void }) {
  const blocks = parseCanonicalBlocks(options.source);
  const execution = executeCanonicalBlocks(options.api, blocks);
  if (execution.firstFailure) return { evidence: createAuthoringEvidence(options.source, options.golden_id, blocks, options.api, execution, { required: options.requiredObjects, verified: [], missing: options.requiredObjects }, { status: "NOT_RUN" }), candidate: null };
  const objects = verifyRequiredObjects(options.api, options.requiredObjects);
  if (objects.missing.length) return { evidence: createAuthoringEvidence(options.source, options.golden_id, blocks, options.api, execution, objects, { status: "NOT_RUN" }), candidate: null };
  const candidate = exportCandidateGgb(options.api, options.candidatePath, options.writeFile);
  return { evidence: createAuthoringEvidence(options.source, options.golden_id, blocks, options.api, execution, objects, candidate), candidate };
}

export function writeAuthoringEvidence(path: string, evidence: ReturnType<typeof createAuthoringEvidence>) {
  writeFileSync(path, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}
