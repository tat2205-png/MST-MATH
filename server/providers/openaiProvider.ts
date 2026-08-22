import { ModelCompletionOptions, ModelProvider } from "./providerInterface.js";

export class OpenAIProvider implements ModelProvider {
  id = "openai" as const;
  name = "OpenAI GPT-4o / o3-mini";

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "");
  }

  async generateText(prompt: string, options?: ModelCompletionOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Please set OPENAI_API_KEY in the environment or use Gemini.");
    }

    const messages: any[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }

    if (options?.imagePart) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${options.imagePart.mimeType};base64,${options.imagePart.data}`,
            },
          },
        ],
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: options?.temperature ?? 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async generateStructuredJSON<T>(prompt: string, schemaDescription: string, options?: ModelCompletionOptions): Promise<T> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Please set OPENAI_API_KEY in the environment or use Gemini.");
    }

    const messages: any[] = [
      {
        role: "system",
        content: `${options?.systemPrompt || "You are an expert high-school mathematics teacher."}\nYou MUST respond ONLY with valid JSON conforming to this specification:\n${schemaDescription}`,
      },
    ];

    if (options?.imagePart) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${options.imagePart.mimeType};base64,${options.imagePart.data}`,
            },
          },
        ],
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: options?.temperature ?? 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content) as T;
  }
}
