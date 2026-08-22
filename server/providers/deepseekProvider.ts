import { ModelCompletionOptions, ModelProvider } from "./providerInterface.js";

export class DeepSeekProvider implements ModelProvider {
  id = "deepseek" as const;
  name = "DeepSeek-V3 / R1 Reasoner";

  isConfigured(): boolean {
    return Boolean(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim() !== "");
  }

  async generateText(prompt: string, options?: ModelCompletionOptions): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured. Please set DEEPSEEK_API_KEY or use Gemini.");
    }

    const messages: any[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: options?.temperature ?? 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async generateStructuredJSON<T>(prompt: string, schemaDescription: string, options?: ModelCompletionOptions): Promise<T> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured. Please set DEEPSEEK_API_KEY or use Gemini.");
    }

    const messages: any[] = [
      {
        role: "system",
        content: `${options?.systemPrompt || "You are an expert high-school mathematics teacher."}\nYou MUST respond ONLY with pure, valid JSON conforming to this specification:\n${schemaDescription}`,
      },
      { role: "user", content: prompt },
    ];

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        response_format: { type: "json_object" },
        temperature: options?.temperature ?? 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    try {
      return JSON.parse(content) as T;
    } catch {
      const cleaned = content.replace(/```json\s*|\s*```/g, "").trim();
      return JSON.parse(cleaned) as T;
    }
  }
}
