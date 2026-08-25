export interface OCRProvider { recognize(input: Uint8Array, mimeType: string): Promise<{ text: string; confidence?: number }>; }
export interface MathRecognitionProvider { recognizeMath(input: Uint8Array, mimeType: string): Promise<{ latex: string; confidence?: number }>; }
export interface CloudStorageProvider { put(path: string, data: Uint8Array): Promise<{ uri: string }>; get(uri: string): Promise<Uint8Array>; }
