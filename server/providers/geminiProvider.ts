import { GoogleGenAI } from "@google/genai";
import { ModelCompletionOptions, ModelProvider } from "./providerInterface.js";

export class GeminiProvider implements ModelProvider {
  id = "gemini" as const;
  name = "Google Gemini (AI Studio)";
  private client: GoogleGenAI | null = null;
  private candidateModels = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];
  private lastSuccessfulModel: string = "gemini-3.7-flash";
  private lastConnectionStatus: "CONNECTED" | "GEMINI_CONNECTION_ERROR" = "CONNECTED";
  private lastErrorMessage: string | null = null;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error("GEMINI_CONNECTION_ERROR: GEMINI_API_KEY is missing or invalid in server environment.");
      }
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return this.client;
  }

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  }

  async testConnection(): Promise<{ connected: boolean; model: string; error?: string }> {
    try {
      const result = await this.generateText("ping", { temperature: 0.1 });
      this.lastConnectionStatus = "CONNECTED";
      this.lastErrorMessage = null;
      return { connected: true, model: this.lastSuccessfulModel };
    } catch (err: any) {
      this.lastConnectionStatus = "GEMINI_CONNECTION_ERROR";
      this.lastErrorMessage = err.message || "Cannot connect to Gemini API.";
      return {
        connected: false,
        model: this.lastSuccessfulModel,
        error: `GEMINI_CONNECTION_ERROR: ${this.lastErrorMessage}`,
      };
    }
  }

  getConnectionStatus() {
    return {
      status: this.lastConnectionStatus,
      model: this.lastSuccessfulModel,
      error: this.lastErrorMessage,
    };
  }

  async generateText(prompt: string, options?: ModelCompletionOptions): Promise<string> {
    const ai = this.getClient();
    const contents: any[] = [];

    if (options?.imagePart) {
      contents.push({
        inlineData: {
          mimeType: options.imagePart.mimeType,
          data: options.imagePart.data,
        },
      });
    }

    contents.push({ text: prompt });

    let lastErr: any = null;
    const modelsToTry = [
      this.lastSuccessfulModel,
      ...this.candidateModels.filter((m) => m !== this.lastSuccessfulModel),
    ];

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: { parts: contents },
          config: {
            systemInstruction: options?.systemPrompt || "You are an expert high-school mathematics teacher and LaTeX specialist.",
            temperature: options?.temperature ?? 0.2,
          },
        });

        this.lastSuccessfulModel = model;
        this.lastConnectionStatus = "CONNECTED";
        this.lastErrorMessage = null;
        return response.text || "";
      } catch (err: any) {
        lastErr = err;
        console.warn(`[GeminiProvider] Model ${model} failed: ${err.message}. Trying next candidate...`);
      }
    }

    this.lastConnectionStatus = "GEMINI_CONNECTION_ERROR";
    this.lastErrorMessage = lastErr?.message || "All Gemini candidate models failed.";
    throw new Error(`GEMINI_RESPONSE_ERROR: ${this.lastErrorMessage}`);
  }

  async generateStructuredJSON<T>(prompt: string, schemaDescription: string, options?: ModelCompletionOptions): Promise<T> {
    const ai = this.getClient();
    const contents: any[] = [];

    if (options?.imagePart) {
      contents.push({
        inlineData: {
          mimeType: options.imagePart.mimeType,
          data: options.imagePart.data,
        },
      });
    }

    const enhancedPrompt = `${prompt}\n\nYou MUST return a single, strictly valid JSON object conforming to this schema specification:\n${schemaDescription}\nEnsure all backslashes in LaTeX expressions are properly escaped (e.g. \\\\frac, \\\\sqrt, \\\\alpha, \\\\in). Return pure JSON.`;
    contents.push({ text: enhancedPrompt });

    let lastErr: any = null;
    const modelsToTry = [
      this.lastSuccessfulModel,
      ...this.candidateModels.filter((m) => m !== this.lastSuccessfulModel),
    ];

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: { parts: contents },
          config: {
            systemInstruction:
              (options?.systemPrompt ? `${options.systemPrompt}\n` : "") +
              "Always output pure, valid JSON conforming to the schema. Ensure mathematical rigor and properly escaped LaTeX backslashes.",
            responseMimeType: "application/json",
            temperature: options?.temperature ?? 0.1,
          },
        });

        const rawText = response.text || "{}";
        this.lastSuccessfulModel = model;
        this.lastConnectionStatus = "CONNECTED";
        this.lastErrorMessage = null;

        try {
          return JSON.parse(rawText) as T;
        } catch (parseErr) {
          // Clean potential markdown code blocks or trailing commas
          const cleaned = rawText
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();
          try {
            return JSON.parse(cleaned) as T;
          } catch (secondaryErr: any) {
            throw new Error(`PARSE_ERROR: Failed to parse Gemini response as JSON: ${secondaryErr.message}. Raw output: ${rawText.slice(0, 300)}`);
          }
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[GeminiProvider] generateStructuredJSON on ${model} failed: ${err.message}`);
        // If it was already a PARSE_ERROR, try next model or throw
      }
    }

    this.lastConnectionStatus = "GEMINI_CONNECTION_ERROR";
    this.lastErrorMessage = lastErr?.message || "Failed to generate structured JSON from Gemini.";
    throw new Error(lastErr?.message?.startsWith("PARSE_ERROR") ? lastErr.message : `GEMINI_RESPONSE_ERROR: ${this.lastErrorMessage}`);
  }
}

