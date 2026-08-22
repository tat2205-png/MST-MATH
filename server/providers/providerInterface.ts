/**
 * Model Provider Abstraction Interface
 * Enables uniform communication with Gemini, OpenAI, and DeepSeek backends
 */

export interface ModelCompletionOptions {
  systemPrompt?: string;
  temperature?: number;
  responseFormatJson?: boolean;
  imagePart?: {
    mimeType: string;
    data: string; // base64
  };
}

export interface ModelProvider {
  id: "gemini" | "openai" | "deepseek";
  name: string;
  isConfigured(): boolean;
  generateText(prompt: string, options?: ModelCompletionOptions): Promise<string>;
  generateStructuredJSON<T>(prompt: string, schemaDescription: string, options?: ModelCompletionOptions): Promise<T>;
}
