import type { GeoGebraRuntimeAdapter, PinnedRenderer, SessionState } from "./runtime-adapter.ts";
import { GeoGebraSessionTransaction } from "./session-transaction.ts";
import { createCanonicalCommandMap, parseCanonicalBlocks, type CanonicalCommand } from "./authoring-bridge.ts";
import { readFileSync } from "node:fs";
export interface FoundationEvidence { mode: "normal" | "forced-failure"; renderer: PinnedRenderer; before: SessionState; after: SessionState; probeCreated: boolean; forcedError?: string }
type Adapter = Pick<GeoGebraRuntimeAdapter, "readSessionState" | "getBase64" | "setBase64" | "validateRecovery" | "newConstruction" | "executeCommand" | "exists" | "readCommandString">;
export async function runFoundationSmoke(adapter: Adapter, renderer: PinnedRenderer, recoveryPath: string, forcedFailure = false): Promise<FoundationEvidence> {
  const before = await adapter.readSessionState(); const tx = new GeoGebraSessionTransaction(adapter, recoveryPath, async () => {}); let probeCreated = false; let forcedError: string | undefined;
  try { await tx.run(async session => { probeCreated = await session.executeCommand("mst07_foundation_probe=6"); if (!probeCreated || !(await adapter.exists("mst07_foundation_probe")) || (await adapter.readCommandString("mst07_foundation_probe")) !== "6") throw new Error("FOUNDATION_PROBE_VERIFICATION_FAILED"); if (forcedFailure) { await session.executeCommand("mst07_foundation_probe_2=7"); await session.executeCommand("mst07_foundation_probe_3=8"); throw new Error("MST07_FOUNDATION_FORCED_FAILURE"); } }); }
  catch (error) { if (!forcedFailure) throw error; forcedError = error instanceof Error ? error.message : String(error); }
  const after = await adapter.readSessionState(); return { mode: forcedFailure ? "forced-failure" : "normal", renderer, before, after, probeCreated, forcedError };
}

export type SemanticStatus = "PASS_EVAL" | "PASS_POSTCONDITION" | "FAIL";
export interface SemanticExecutionRecord { global_index: number; block_id: string; block_index: number; command_family: string; exact_text: string; raw_eval: boolean; semantic_status: SemanticStatus; target?: string; expected?: string; actual?: string | number | null; }
export interface SemanticEvidence { renderer: PinnedRenderer; before: SessionState; after: SessionState; records: SemanticExecutionRecord[]; commands_total: number; commands_attempted: number; semantic_passed: number; semantic_failures: number; missing_indices: number[]; duplicate_indices: number[]; first_failure: SemanticExecutionRecord | null; }
type SemanticAdapter = Adapter & { readColor(label: string): Promise<string>; readFilling(label: string): Promise<number>; readLineThickness(label: string): Promise<number>; readObjectXml(label: string): Promise<string>; waitUntilReady?(): Promise<void>; assertPinnedRenderer?(renderer: PinnedRenderer): Promise<void>; };

function parseSetter(command: string, family: string) {
  const prefix = `${family}(`; if (!command.startsWith(prefix) || !command.endsWith(")")) return null;
  const body = command.slice(prefix.length, -1); const comma = body.indexOf(","); if (comma < 0) return null;
  return { target: body.slice(0, comma).trim(), expected: body.slice(comma + 1).trim() };
}
export function validateSemanticAccounting(map: CanonicalCommand[], records: SemanticExecutionRecord[]) {
  const total = map.length; const indices = records.map((r) => r.global_index); const duplicates = indices.filter((n, i) => indices.indexOf(n) !== i); const missing = Array.from({ length: records.length }, (_, i) => i + 1).filter((n) => !indices.includes(n));
  const invalidIndices = indices.some((n, i) => n !== i + 1 || n > total); const passed = records.filter((r) => r.semantic_status !== "FAIL").length; const failures = records.filter((r) => r.semantic_status === "FAIL").length;
  const identityMismatch = Boolean(map && records.some((r, i) => { const c = map[i]; return !c || r.global_index !== c.global_index || r.block_id !== c.block_id || r.block_index !== c.block_index || r.command_family !== c.command_family || r.exact_text !== c.exact_text; }));
  const invalidState = records.some((r) => !["PASS_EVAL", "PASS_POSTCONDITION", "FAIL"].includes(r.semantic_status));
  const partialWithoutTerminalFailure = records.length < total && records.at(-1)?.semantic_status !== "FAIL";
  if (duplicates.length || missing.length || invalidIndices || identityMismatch || invalidState || partialWithoutTerminalFailure || records.length > total || records.length !== passed + failures) throw new Error("SEMANTIC_ACCOUNTING_INVARIANT_FAILED");
  return { attempted: records.length, passed, failures, missing, duplicates, total };
}
export async function runSemanticAuthoring(adapter: SemanticAdapter, renderer: PinnedRenderer, sourcePath: string, recoveryPath: string): Promise<SemanticEvidence> {
  const source = readFileSync(sourcePath, "utf8"); const map = createCanonicalCommandMap(parseCanonicalBlocks(source)); const before = await adapter.readSessionState(); let records: SemanticExecutionRecord[] = [];
  await adapter.waitUntilReady?.();
  const tx = new GeoGebraSessionTransaction(adapter, recoveryPath, adapter.assertPinnedRenderer ? () => adapter.assertPinnedRenderer!(renderer) : async () => { throw new Error("SESSION_RENDERER_GUARD_REQUIRED"); });
  await tx.run(async session => { for (const command of map) { const raw = await session.executeCommand(command.exact_text); let status: SemanticStatus = raw ? "PASS_EVAL" : "FAIL"; let actual: string | number | null = null; const parsed = parseSetter(command.exact_text, command.command_family);
      if (!raw && parsed && command.command_family === "SetColor" && await adapter.exists(parsed.target)) { actual = (await adapter.readColor(parsed.target)).toUpperCase(); status = actual === parsed.expected.replace(/^"|"$/g, "").toUpperCase() ? "PASS_POSTCONDITION" : "FAIL"; }
      else if (!raw && parsed && command.command_family === "SetFilling" && await adapter.exists(parsed.target)) { actual = await adapter.readFilling(parsed.target); status = Math.abs(Number(actual) - Number(parsed.expected)) <= 1e-9 ? "PASS_POSTCONDITION" : "FAIL"; }
      else if (parsed && command.command_family === "SetLineThickness") { if (!await adapter.exists(parsed.target)) status = "FAIL"; else { actual = await adapter.readLineThickness(parsed.target); if (!Number.isFinite(Number(parsed.expected)) || Number(actual) !== Number(parsed.expected)) status = "FAIL"; else if (!raw) status = "PASS_POSTCONDITION"; } }
      else if (parsed && command.command_family === "SetConditionToShowObject") { if (!await adapter.exists(parsed.target)) status = "FAIL"; else { const xml = await adapter.readObjectXml(parsed.target); const match = /<condition[^>]*showObject\s*=\s*["']([^"']+)["'][^>]*>/i.exec(xml); actual = match?.[1] ?? null; const normalized = (v: string) => v.replace(/&amp;/g, "&").replace(/∧/g, "&&").replace(/\s+/g, "").replace(/^\((.*)\)$/, "$1"); if (actual === null || normalized(String(actual)) !== normalized(parsed.expected)) status = "FAIL"; else if (!raw) status = "PASS_POSTCONDITION"; } }
      const record = { global_index: command.global_index, block_id: command.block_id, block_index: command.block_index, command_family: command.command_family, exact_text: command.exact_text, raw_eval: raw, semantic_status: status, ...(parsed ?? {}), actual }; records.push(record); if (status === "FAIL") break; } });
  const after = await adapter.readSessionState(); const a = validateSemanticAccounting(map, records); return { renderer, before, after, records, commands_total: a.total, commands_attempted: a.attempted, semantic_passed: a.passed, semantic_failures: a.failures, missing_indices: a.missing, duplicate_indices: a.duplicates, first_failure: records.find((r) => r.semantic_status === "FAIL") ?? null };
}
