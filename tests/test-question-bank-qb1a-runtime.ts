import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { zipSync } from "fflate";

const port = await new Promise<number>((resolve, reject) => { const probe = net.createServer(); probe.once("error", reject); probe.listen(0, "127.0.0.1", () => { const address = probe.address(); if (!address || typeof address === "string") return reject(new Error("No TCP port")); const selected = address.port; probe.close(() => resolve(selected)); }); });
const dataRoot = mkdtempSync(path.join(tmpdir(), "qb-1a-runtime-")); const require = createRequire(import.meta.url); const tsxCli = require.resolve("tsx/cli");
const child = spawn(process.execPath, [tsxCli, "server.ts"], { cwd: process.cwd(), shell: false, env: { ...process.env, PORT: String(port), APP_HOST: "127.0.0.1", QUESTION_BANK_DATA_ROOT: dataRoot, VITE_QUESTION_BANK_DEV: "true" }, stdio: ["ignore", "pipe", "pipe"] });
let logs = ""; child.stdout.on("data", (chunk) => { logs += chunk.toString(); }); child.stderr.on("data", (chunk) => { logs += chunk.toString(); });
const base = `http://127.0.0.1:${port}`;
try {
  let healthy = false; for (let attempt = 0; attempt < 80; attempt += 1) { try { const response = await fetch(`${base}/api/health`); if (response.ok) { healthy = true; break; } } catch { /* server is starting */ } await new Promise((resolve) => setTimeout(resolve, 100)); } assert.ok(healthy, `Real server did not start:\n${logs}`);
  const p = (value: string) => `<w:p><w:r><w:t>${value}</w:t></w:r></w:p>`; const math = `<m:oMath><m:f><m:num><m:r><m:t>a+b</m:t></m:r></m:num><m:den><m:r><m:t>c</m:t></m:r></m:den></m:f></m:oMath>`;
  const xml = `<w:document xmlns:w="w" xmlns:m="m"><w:body>${p("Câu 1. Chọn đáp án đúng.")}${p("A. 1")}${p("B. 2")}${p("C. 3")}${p("D. 4")}${p("Câu 2. Trả lời ngắn, ghi kết quả.")}${p("Câu 3. Tính biểu thức")}${`<w:p>${math}</w:p>`}${p("ĐÁP ÁN")}${p("1. B")}</w:body></w:document>`;
  const docx = zipSync({ "word/document.xml": new TextEncoder().encode(xml) }); const response = await fetch(`${base}/api/question-bank/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalFileName: "runtime-đa-câu.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", dataBase64: Buffer.from(docx).toString("base64") }) }); const imported = await response.json() as { success: boolean; questionsSaved: number }; assert.equal(response.status, 200); assert.equal(imported.success, true); assert.equal(imported.questionsSaved, 3);
  const listedResponse = await fetch(`${base}/api/question-bank/questions`); const listed = await listedResponse.json() as { questions: Array<{ questionType: string; status: string; content: Array<{ type: string; latex?: string }> }> }; assert.equal(listed.questions.length, 3); assert.deepEqual(new Set(listed.questions.map((q) => q.questionType)), new Set(["MCQ", "SHORT_ANSWER", "ESSAY"])); assert.ok(listed.questions.every((q) => q.status === "REVIEW")); assert.ok(listed.questions.some((q) => q.content.some((block) => block.type === "math" && block.latex === "\\frac{a+b}{c}")));
  const page = await fetch(`${base}/dev/question-bank`); assert.equal(page.status, 200); assert.match(await page.text(), /<div id="root"><\/div>/);
  console.log("REAL_MULTI_QUESTION_DOCX_HTTP_QA=PASS\nREPOSITORY_PERSISTENCE_QA=PASS\nDEV_UI_RUNTIME_QA=PASS");
} finally { child.kill(); await new Promise<void>((resolve) => { const timer = setTimeout(resolve, 3000); child.once("exit", () => { clearTimeout(timer); resolve(); }); }); rmSync(dataRoot, { recursive: true, force: true }); }
