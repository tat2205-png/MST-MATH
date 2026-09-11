import type { GeoGebraRuntimeAdapter, PinnedRenderer, SessionState } from "./runtime-adapter.ts";
import { GeoGebraSessionTransaction } from "./session-transaction.ts";
export interface FoundationEvidence { mode: "normal" | "forced-failure"; renderer: PinnedRenderer; before: SessionState; after: SessionState; probeCreated: boolean; forcedError?: string }
type Adapter = Pick<GeoGebraRuntimeAdapter, "readSessionState" | "getBase64" | "setBase64" | "validateRecovery" | "newConstruction" | "executeCommand" | "exists" | "readCommandString">;
export async function runFoundationSmoke(adapter: Adapter, renderer: PinnedRenderer, recoveryPath: string, forcedFailure = false): Promise<FoundationEvidence> {
  const before = await adapter.readSessionState(); const tx = new GeoGebraSessionTransaction(adapter, recoveryPath); let probeCreated = false; let forcedError: string | undefined;
  try { await tx.run(async session => { probeCreated = await session.executeCommand("mst07_foundation_probe=6"); if (!probeCreated || !(await adapter.exists("mst07_foundation_probe")) || (await adapter.readCommandString("mst07_foundation_probe")) !== "6") throw new Error("FOUNDATION_PROBE_VERIFICATION_FAILED"); if (forcedFailure) { await session.executeCommand("mst07_foundation_probe_2=7"); await session.executeCommand("mst07_foundation_probe_3=8"); throw new Error("MST07_FOUNDATION_FORCED_FAILURE"); } }); }
  catch (error) { if (!forcedFailure) throw error; forcedError = error instanceof Error ? error.message : String(error); }
  const after = await adapter.readSessionState(); return { mode: forcedFailure ? "forced-failure" : "normal", renderer, before, after, probeCreated, forcedError };
}
