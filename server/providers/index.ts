import { GeminiProvider } from "./geminiProvider.js";
import { ModelProvider } from "./providerInterface.js";

export const geminiProvider = new GeminiProvider();

export function getProvider(_preferredId?: string): ModelProvider {
  // For V1: strictly activeProvider = GEMINI
  return geminiProvider;
}

export function listProvidersStatus() {
  const geminiStatus = geminiProvider.getConnectionStatus();
  return [
    {
      id: "gemini",
      name: "Google Gemini (AI Studio)",
      badge: "Active / V1 Core",
      isAvailable: geminiProvider.isConfigured(),
      status: geminiStatus.status,
      model: geminiStatus.model,
      notes: "Server-side integration via @google/genai with math reasoning and structured output",
    },
    {
      id: "openai",
      name: "OpenAI GPT-4o",
      badge: "V1 Placeholder",
      isAvailable: false,
      status: "NOT CONFIGURED",
      notes: "Disabled in V1 (Gemini-only architecture)",
    },
    {
      id: "deepseek",
      name: "DeepSeek V3 / R1",
      badge: "V1 Placeholder",
      isAvailable: false,
      status: "NOT CONFIGURED",
      notes: "Disabled in V1 (Gemini-only architecture)",
    },
  ];
}

