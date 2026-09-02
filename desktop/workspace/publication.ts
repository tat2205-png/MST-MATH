import { promises as fs } from "node:fs";
import path from "node:path";
export async function versionedPath(root: string, fileName: string) { const ext = path.extname(fileName); const stem = path.basename(fileName, ext); for (let n = 1; ; n++) { const candidate = path.join(root, `${stem}_v${String(n).padStart(3, "0")}${ext}`); try { await fs.access(candidate); } catch { return candidate; } } }
export async function publishAtomically(stagedPath: string, outputRoot: string, fileName = path.basename(stagedPath)) { await fs.mkdir(outputRoot, { recursive: true }); const target = await versionedPath(outputRoot, fileName); const temp = `${target}.part-${process.pid}-${Date.now()}`; await fs.copyFile(stagedPath, temp); await fs.rename(temp, target); return target; }
