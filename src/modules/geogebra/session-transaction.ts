import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { GeoGebraRuntimeAdapter, SessionState } from "./runtime-adapter.ts";

export class GeoGebraSessionTransaction {
  constructor(private readonly adapter: Pick<GeoGebraRuntimeAdapter, "readSessionState" | "getBase64" | "setBase64" | "validateRecovery" | "newConstruction" | "executeCommand">, private readonly recoveryPath: string) {}
  async run<T>(callback: (disposable: { executeCommand: (command: string) => Promise<boolean> }) => Promise<T> | T): Promise<T> {
    const originalState = await this.adapter.readSessionState();
    const originalBase64 = await this.adapter.getBase64();
    mkdirSync(dirname(this.recoveryPath), { recursive: true });
    writeFileSync(this.recoveryPath, Buffer.from(originalBase64, "base64"));
    if (!(await this.adapter.validateRecovery())) throw new Error("RECOVERY_VALIDATION_FAILED");
    await this.adapter.newConstruction();
    const empty = await this.adapter.readSessionState();
    if (empty.objectCount !== 0 || empty.objectNames.length !== 0) throw new Error("EMPTY_CONSTRUCTION_NOT_STABLE");
    let callbackError: unknown;
    try { return await callback({ executeCommand: command => this.adapter.executeCommand(command) }); }
    catch (error) { callbackError = error; throw error; }
    finally {
      try { await this.adapter.setBase64(originalBase64); const restored = await this.adapter.readSessionState(); if (restored.fingerprint !== originalState.fingerprint || restored.objectCount !== originalState.objectCount) throw new Error("SESSION_RESTORE_VERIFICATION_FAILED"); }
      catch (restoreError) { throw new Error(`CRITICAL_RESTORE_FAILURE:${String(restoreError)}${callbackError ? `; original=${String(callbackError)}` : ""}`); }
    }
  }
}
