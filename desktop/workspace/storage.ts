import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { DesktopConfiguration, DesktopInputType } from "./types.js";

export const SUPPORTED_INPUTS = [".docx", ".doc", ".pdf", ".png", ".jpg", ".jpeg"] as const;
export function detectInputType(filePath: string): DesktopInputType | null { const ext = path.extname(filePath).toLowerCase().slice(1); return (SUPPORTED_INPUTS as readonly string[]).includes(`.${ext}`) ? ext as DesktopInputType : null; }
export function appDataRoot(platform = process.platform, env: NodeJS.ProcessEnv = process.env): string { if (platform === "win32") return path.join(env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "PiMath"); if (platform === "darwin") return path.join(os.homedir(), "Library", "Application Support", "PiMath"); return path.join(env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"), "PiMath"); }
export function workspacePaths(root = appDataRoot()) { return { root, jobs: path.join(root, "JOBS"), temp: path.join(root, "TEMP"), cache: path.join(root, "CACHE"), logs: path.join(root, "LOGS"), config: path.join(root, "config.json") }; }
export async function ensureWorkspace(root = appDataRoot()) { const p = workspacePaths(root); await Promise.all([p.jobs, p.temp, p.cache, p.logs].map((dir) => fs.mkdir(dir, { recursive: true }))); return p; }
export async function hashSource(sourcePath: string) { const hash = createHash("sha256"); hash.update(await fs.readFile(sourcePath)); return hash.digest("hex"); }
export async function readConfiguration(root = appDataRoot()): Promise<DesktopConfiguration> { const p = await ensureWorkspace(root); try { return JSON.parse(await fs.readFile(p.config, "utf8")) as DesktopConfiguration; } catch { return { schemaVersion: 1, updatedAt: new Date().toISOString() }; } }
export async function writeConfiguration(config: DesktopConfiguration, root = appDataRoot()) { const p = await ensureWorkspace(root); await fs.writeFile(p.config, JSON.stringify(config, null, 2), "utf8"); return config; }
