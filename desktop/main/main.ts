import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, readConfiguration, writeConfiguration, appDataRoot, detectInputType } from "../workspace/storage.js";
import { JobManager } from "../jobs/jobManager.js";
import { openWindowsPath } from "../platform/windows/open.js";
let win: BrowserWindow | undefined;
const workspace = appDataRoot();
const jobManager = new JobManager(workspace);
function registerIpc() {
  ipcMain.handle("select-input-files", async () => (await dialog.showOpenDialog(win!, { properties: ["openFile", "multiSelections"], filters: [{ name: "PiMath input", extensions: ["docx", "doc", "pdf", "png", "jpg", "jpeg"] }] })).filePaths);
  ipcMain.handle("select-output-root", async () => { const result = await dialog.showOpenDialog(win!, { properties: ["openDirectory", "createDirectory"] }); if (result.canceled || !result.filePaths[0]) return null; return writeConfiguration({ schemaVersion: 1, outputRoot: result.filePaths[0], updatedAt: new Date().toISOString() }, workspace).then(() => result.filePaths[0]); });
  ipcMain.handle("get-configuration", () => readConfiguration(workspace));
  ipcMain.handle("open-output-folder", async () => { const config = await readConfiguration(workspace); if (config.outputRoot) await openWindowsPath(config.outputRoot); });
  ipcMain.handle("open-result", (_event, resultPath: unknown) => typeof resultPath === "string" ? openWindowsPath(resultPath) : Promise.resolve());
  ipcMain.handle("process-job", async (_event, sourcePath: unknown, outputProfile: unknown) => { if (typeof sourcePath !== "string" || !detectInputType(sourcePath)) throw new Error("UNSUPPORTED_FILE"); return jobManager.create(sourcePath, typeof outputProfile === "string" ? outputProfile : undefined); });
}
async function createWindow() { await ensureWorkspace(workspace); win = new BrowserWindow({ width: 1280, height: 850, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, "../preload/preload.cjs") } }); await win.loadURL(process.env.PIMATH_DESKTOP_URL || "http://127.0.0.1:3000"); }
app.whenReady().then(() => { registerIpc(); return createWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
