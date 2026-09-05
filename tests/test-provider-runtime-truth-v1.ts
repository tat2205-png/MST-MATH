import assert from "node:assert/strict";
import { GeminiProvider } from "../server/providers/geminiProvider.ts";
import { readFileSync } from "node:fs";

const originalKey = process.env.GEMINI_API_KEY;

try {
  delete process.env.GEMINI_API_KEY;
  const unconfigured = new GeminiProvider();
  assert.equal(unconfigured.isConfigured(), false);
  assert.equal(unconfigured.getConnectionStatus().status, "NOT_CONFIGURED");

  process.env.GEMINI_API_KEY = "test-only-nonempty-key";
  const configuredNotChecked = new GeminiProvider();
  assert.equal(configuredNotChecked.isConfigured(), true);
  assert.equal(
    configuredNotChecked.getConnectionStatus().status,
    "NOT_CHECKED",
    "configuration must not imply connectivity",
  );

  const headerSource = readFileSync("src/components/Header.tsx", "utf8");
  assert.equal(headerSource.includes("Gemini (Active V1)"), false, "static active provider label must be removed");
  assert.equal(headerSource.includes('data.provider_status === "CONNECTED"'), true);
  assert.equal(headerSource.includes('data.provider_status === "NOT_CHECKED"'), true);

  const providerIndexSource = readFileSync("server/providers/index.ts", "utf8");
  assert.equal(providerIndexSource.includes('badge: "Active / V1 Core"'), false);
  assert.equal(providerIndexSource.includes("configured,"), true);
  assert.equal(providerIndexSource.includes("connected,"), true);

  console.log("PROVIDER_STATUS_CONTRADICTION_COUNT=0");
  console.log("CONFIGURED_NE_CONNECTED_SEMANTICS=EXPLICIT");
  console.log("STATIC_ACTIVE_LABEL_COUNT=0");
  console.log("PROVIDER_STATUS_CONSUMER_REGRESSION=PASS");
} finally {
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
}
