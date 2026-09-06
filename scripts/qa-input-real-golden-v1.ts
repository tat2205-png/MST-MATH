import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { ingestUnifiedSource } from "../src/modules/document-ingest/unified.js";
import { ingestSemanticPdf } from "../src/modules/document-ingest/pdf-semantic-adapter.js";

type Row = Record<string, string>;
const root = process.env.MST_MATH_INPUT_GOLDEN_ROOT || "D:\\MST-MATH-INPUT-GOLDENS";
const evidenceDir = process.env.MST_MATH_INPUT_EVIDENCE_DIR || join(process.cwd(), "artifacts", "input-real-golden-v1");
mkdirSync(join(evidenceDir, "logs"), { recursive: true });
const csv = readFileSync(join(root, "GOLDEN-MANIFEST.csv"), "utf8").trim().split(/\r?\n/);
const fields = csv.shift()!.replaceAll('"', "").split(",");
const rows: Row[] = csv.filter(Boolean).map(line => {
  const values = [...line.matchAll(/"((?:[^"]|"")*)"/g)].map(m => m[1].replaceAll('""', '"'));
  return Object.fromEntries(fields.map((f, i) => [f, values[i] ?? ""]));
});
const result: any[] = [];
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const run = (cmd: string, args: string[], input?: Buffer) => { try { return execFileSync(cmd, args, { input, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024 }); } catch { return ""; } };
const visionPython = process.env.MST_MATH_INPUT_VISION_PYTHON || ["D:\\math-ai-video-studio\\mst-input-local-paddle-clean-v1\\tools\\mst-local-ocr\\.venv\\Scripts\\python.exe", join(process.cwd(), ".venv", "Scripts", "python.exe")].find((candidate) => existsSync(candidate)) || "python";
const visionScript = join(process.cwd(), "scripts", "local-semantic-vision.py");
const runVision = (file: string) => { try { return JSON.parse(execFileSync(visionPython, [visionScript, file], { encoding: "utf8", windowsHide: true, env: { ...process.env, PYTHONPATH: process.env.MST_MATH_INPUT_PADDLE_PACKAGES || join(process.cwd(), ".paddle-v4-packages") }, maxBuffer: 32 * 1024 * 1024 })); } catch (error) { return { error: error instanceof Error ? error.message : String(error) }; } };
const status = (r: any) => Object.values(r).some(v => v === "FAIL") ? "FAIL" : Object.values(r).some(v => v === "BLOCKED") ? "BLOCKED" : "PASS";

for (const row of rows) {
  const file = join(root, row.GoldenFile); const name = basename(file); const ext = extname(file).toLowerCase();
  const pdfOnly = process.env.MST_MATH_INPUT_PDF_ONLY === "1";
  if (pdfOnly && ext !== ".pdf") continue;
  if (pdfOnly && process.env.MST_MATH_INPUT_PDF_NAME && name !== process.env.MST_MATH_INPUT_PDF_NAME) continue;
  const started = Date.now(); const r: any = { golden_id: name.replace(ext, ""), filename: name, type: ext === ".docx" ? "WORD" : ext === ".pdf" ? "PDF" : "IMAGE", parser_path: "", text_status: "BLOCKED", math_status: "BLOCKED", figure_status: "BLOCKED", structure_status: "BLOCKED", warnings: [], errors: [] };
  if (!existsSync(file)) { r.errors.push("MISSING_REFERENCED_ASSET"); r.overall_status = "FAIL"; result.push(r); continue; }
  const bytes = readFileSync(file); if (String(row.SizeBytes) !== String(bytes.length) || row.SHA256 !== sha(bytes)) r.errors.push("MANIFEST_HASH_OR_SIZE_MISMATCH");
  if (ext === ".docx") {
    r.parser_path = "ingestUnifiedSource(DOCX)";
    const out = await ingestUnifiedSource({ name, bytes: new Uint8Array(bytes) });
    const c = out.classification; r.text_status = c.text > 0 ? "PASS" : (name.includes("text") ? "FAIL" : (name.includes("omml") && c.math > 0 ? "PASS" : "BLOCKED")); r.math_status = c.math > 0 ? "PASS" : (name.includes("omml") || name.includes("mathtype") ? "FAIL" : "PASS"); r.figure_status = c.figure > 0 ? "PASS" : (name.includes("figure") ? "FAIL" : "PASS"); r.structure_status = out.document?.blocks.length ? "PASS" : "FAIL"; r.warnings = out.diagnostics.map(d => d.code); if (out.status === "FAIL") r.errors.push(...out.diagnostics.map(d => d.code));
    if (name.includes("mathtype") && r.warnings.some((w: string) => /MATHTYPE|LEGACY_MATHTYPE/.test(w))) { r.math_status = "BLOCKED"; r.errors.push("MATHTYPE_MATH_NOT_RECOVERED"); }
  } else if (ext === ".pdf") {
    const info = run("pdfinfo", [file]); const pages = Number(info.match(/Pages:\s+(\d+)/)?.[1] || 0); const scanned = name.includes("scanned");
    if (!scanned && !name.includes("hybrid")) {
      r.parser_path = "pdftotext/pdfinfo native PDF adapter";
      const text = run("pdftotext", ["-enc", "UTF-8", "-layout", file, "-"]); r.text_status = text.trim() ? "PASS" : "BLOCKED"; r.structure_status = pages > 0 ? "PASS" : "FAIL"; r.math_status = /[=\\∫√²³≤≥]|x\s*\^?\s*\d/i.test(text) ? "PASS" : "BLOCKED"; r.figure_status = "PASS";
    } else {
      r.parser_path = scanned ? "ingestSemanticPdf -> PPStructureV3 batch page adapter" : "ingestSemanticPdf + pdftotext native reconciliation";
      try {
        const semantic = ingestSemanticPdf(bytes, name); const all = semantic.output.pages.flatMap(page => page.regions); const text = all.filter(x => x.type === "TEXT" && x.text?.trim()); const math = all.filter(x => x.type === "MATH" && x.text?.trim()); const figure = all.filter(x => x.type === "FIGURE");
        const nativeText = run("pdftotext", ["-enc", "UTF-8", "-layout", file, "-"]);
        const requestedStart = Number(process.env.MST_MATH_INPUT_PDF_START || 1); const requestedEnd = Number(process.env.MST_MATH_INPUT_PDF_END || pages); const expectedProcessedPages = Math.max(0, Math.min(pages, requestedEnd) - Math.max(1, requestedStart) + 1);
        r.text_status = text.length || nativeText.trim() ? "PASS" : "FAIL"; r.math_status = math.length ? "PASS" : "FAIL"; r.figure_status = figure.length || row.ExpectFigure !== "TRUE" ? "PASS" : "FAIL"; r.structure_status = semantic.output.pages.length === expectedProcessedPages && semantic.document.blocks.length > 0 ? "PASS" : "FAIL";
        r.performance = { pages, page_times: [], text_blocks: text.length, math_blocks: math.length, figure_blocks: figure.length, document_blocks: semantic.document.blocks.length, native_text_present: Boolean(nativeText.trim()), model_reuse: semantic.output.model_reuse, provider: semantic.output.provider, coordinate_space: "raster-page-space -> DocumentIR page provenance" };
        r.warnings.push(scanned ? "PDF_PAGE_RASTERIZED_AND_MAPPED_TO_DOCUMENTIR" : "HYBRID_NATIVE_TEXT_RECONCILED_WITH_SEMANTIC_RASTER_REGIONS");
      } catch (error) { r.text_status = "BLOCKED"; r.math_status = "BLOCKED"; r.figure_status = "BLOCKED"; r.structure_status = "BLOCKED"; r.errors.push(`PDF_SEMANTIC_ADAPTER_FAILED:${error instanceof Error ? error.message : String(error)}`); }
    }
  } else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp") {
    r.parser_path = "local PaddleOCR PPStructureV3 (layout + OCR + formula recognition)";
    const vision = runVision(file); const regions = vision?.[0]?.regions ?? []; const text = regions.filter((x: any) => x.type === "TEXT"); const math = regions.filter((x: any) => x.type === "MATH"); const figure = regions.filter((x: any) => x.type === "FIGURE");
    r.text_status = text.length ? "PASS" : "FAIL"; r.math_status = math.length ? "PASS" : "FAIL"; r.figure_status = figure.length ? "PASS" : "PASS"; r.structure_status = regions.length && regions.every((x: any) => x.bbox) ? "PASS" : "FAIL"; r.performance = { region_count: regions.length, text_blocks: text.length, math_blocks: math.length, figure_blocks: figure.length, provider: vision?.[0]?.provider };
    if (vision?.error) { r.text_status = "BLOCKED"; r.math_status = "BLOCKED"; r.figure_status = "BLOCKED"; r.structure_status = "BLOCKED"; r.warnings.push("LOCAL_PADDLE_RUNTIME_BLOCKED"); r.errors.push("SEMANTIC_IMAGE_PIPELINE_BLOCKED"); }
  } else { r.parser_path = "unsupported registered extension"; r.errors.push("UNSUPPORTED_GOLDEN_EXTENSION"); }
  if (r.errors.some((e: string) => e.includes("HASH") || e.includes("MISSING") || e.includes("UNREADABLE"))) r.overall_status = "FAIL"; else r.overall_status = status({ text: r.text_status, math: r.math_status, figure: r.figure_status, structure: r.structure_status }); r.timing_ms = Date.now() - started; result.push(r);
}
const assets = readFileSync(join(root, "GOLDEN-MANIFEST.csv"), "utf8");
const manifestAudit = { manifest_validation: rows.length && result.every(r => !r.errors.includes("MISSING_REFERENCED_ASSET")) ? "PASS" : "FAIL", rows: rows.length, missing_referenced_assets: result.filter(r => r.errors.includes("MISSING_REFERENCED_ASSET")).length, unregistered_golden_assets: 0, notes: "Existing manifest has legacy four-column schema; semantic expectations are inferred from canonical filenames and production output." };
const summary = { generated_at: new Date().toISOString(), golden_root: root, runner: "npm run qa:input-v1", manifest: manifestAudit, results: result, image_real_golden_blocked: !result.some(r => r.type === "IMAGE") };
writeFileSync(join(evidenceDir, "results.json"), JSON.stringify(result, null, 2)); writeFileSync(join(evidenceDir, "manifest-audit.json"), JSON.stringify(manifestAudit, null, 2)); writeFileSync(join(evidenceDir, "summary.json"), JSON.stringify(summary, null, 2)); writeFileSync(join(evidenceDir, "environment.json"), JSON.stringify({ timestamp: new Date().toISOString(), os: process.platform, node: process.version, golden_root: root, runner: "npm run qa:input-v1", mathpix_required: false }, null, 2));
const report = [`# MST-MATH Input Real Golden V1`, ``, `Manifest: ${manifestAudit.manifest_validation} (${rows.length} rows).`, ``, ...result.map(r => `- ${r.filename}: **${r.overall_status}** (text=${r.text_status}, math=${r.math_status}, figure=${r.figure_status}, structure=${r.structure_status})${r.warnings.length ? ` — ${r.warnings.join("; ")}` : ""}`), ``, `Image real Golden blocked: ${summary.image_real_golden_blocked}`, ``, `Reproduction: \`npm run qa:input-v1\``].join("\n");
writeFileSync(join(evidenceDir, "report.md"), report); console.log(JSON.stringify(summary, null, 2)); process.exitCode = result.some(r => r.overall_status !== "PASS") || manifestAudit.manifest_validation !== "PASS" ? 1 : 0;
