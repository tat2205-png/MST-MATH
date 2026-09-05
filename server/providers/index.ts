import { GeminiProvider } from "./geminiProvider.js";
import { ModelProvider } from "./providerInterface.js";

export const geminiProvider = new GeminiProvider();

export function getProvider(_preferredId?: string): ModelProvider {
  // For V1: strictly activeProvider = GEMINI
  return geminiProvider;
}

export function listProvidersStatus() {
  const geminiStatus = geminiProvider.getConnectionStatus();
  const configured = geminiProvider.isConfigured();
  const connected = geminiStatus.status === "CONNECTED";
  const badge = connected
    ? "Connected / V1 Core"
    : configured
      ? geminiStatus.status === "GEMINI_CONNECTION_ERROR"
        ? "Connection Error"
        : "Configured / Not Checked"
      : "Not Configured";

  return [
    {
      id: "gemini",
      name: "Google Gemini (AI Studio)",
      badge,
      // Preserve legacy consumer meaning while exposing truthful dimensions below.
      isAvailable: configured,
      configured,
      connected,
      status: geminiStatus.status,
      model: geminiStatus.model,
      notes: "Server-side integration via @google/genai with explicit configured-vs-connected runtime semantics",
    },
    {
      id: "openai",
      name: "OpenAI GPT-4o",
      badge: "V1 Placeholder",
      isAvailable: false,
      configured: false,
      connected: false,
      status: "NOT_CONFIGURED",
      notes: "Disabled in V1 (Gemini-only architecture)",
    },
    {
      id: "deepseek",
      name: "DeepSeek V3 / R1",
      badge: "V1 Placeholder",
      isAvailable: false,
      configured: false,
      connected: false,
      status: "NOT_CONFIGURED",
      notes: "Disabled in V1 (Gemini-only architecture)",
    },
  ];
}
