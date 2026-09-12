import { chromium } from "playwright-core";
import { resolve } from "node:path";
import { GeoGebraRuntimeAdapter } from "../src/modules/geogebra/runtime-adapter.ts";
import { runFoundationSmoke, runSemanticAuthoring } from "../src/modules/geogebra/live-runner.ts";
const forcedFailure = process.argv.includes("--foundation-forced-failure");
if (!process.argv.includes("--foundation-smoke") && !forcedFailure && !process.argv.includes("--semantic")) throw new Error("FOUNDATION_MODE_REQUIRED");
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
try {
  const page = browser.contexts().flatMap(c => c.pages()).find(p => /classic\.html/i.test(p.url()));
  if (!page) throw new Error("SESSION_RENDERER_NOT_FOUND");
  const adapter = new GeoGebraRuntimeAdapter(page); const renderer = await adapter.pin();
  if (process.argv.includes("--semantic")) {
    const evidence = await runSemanticAuthoring(adapter as any, renderer, resolve("goldens/geogebra/fold/rectangular-prism-fold-golden-v1.commands.txt"), resolve("artifacts/mst07/session-recovery/live-semantic.ggb"));
    console.log(JSON.stringify(evidence, null, 2));
    if (evidence.semantic_failures || evidence.commands_attempted !== evidence.commands_total) throw new Error("SEMANTIC_GATE_FAILED");
  } else {
  const evidence = await runFoundationSmoke(adapter, renderer, resolve("artifacts/mst07/session-recovery/live-foundation.ggb"), forcedFailure);
  if (evidence.after.fingerprint !== evidence.before.fingerprint) throw new Error("CRITICAL_RESTORE_FAILURE");
  console.log(JSON.stringify({ renderer, before: evidence.before, after: evidence.after, probeCreated: evidence.probeCreated, forcedError: evidence.forcedError ?? null }, null, 2));
  }
} finally { await browser.close(); }
