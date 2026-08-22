/**
 * Configuration for MATH AI VIDEO STUDIO Local Render Bridge (Step 6B)
 * Note: Never hardcode OpenClaw port 18789 or secret credentials here.
 */

export const DEFAULT_LOCAL_BRIDGE_URL = "http://127.0.0.1:8765";

export const LOCAL_BRIDGE_ERRORS = {
  TOKEN_REQUIRED_OR_INVALID: "LOCAL BRIDGE TOKEN REQUIRED / INVALID",
  BROWSER_BLOCKED: "LOCAL_BRIDGE_BROWSER_BLOCKED",
};

export const LOCAL_BRIDGE_CONFIG = {
  defaultUrl: DEFAULT_LOCAL_BRIDGE_URL,
  healthCheckTimeoutMs: 3000,
  requestTimeoutMs: 30000,
  pollIntervalMs: 1500,
  storageKeyToken: "MATH_AI_LOCAL_BRIDGE_TOKEN",
  storageKeyUrl: "MATH_AI_LOCAL_BRIDGE_URL",
  storageKeyStorageType: "MATH_AI_LOCAL_BRIDGE_STORAGE_TYPE", // 'session' (default) or 'local'
};

