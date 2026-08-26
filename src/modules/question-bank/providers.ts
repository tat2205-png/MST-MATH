export type { MathRecognitionProvider, PageOCRProvider, RecognitionInput, RecognitionResult } from "./recognition/types.js";
export interface CloudStorageProvider { put(path: string, data: Uint8Array): Promise<{ uri: string }>; get(uri: string): Promise<Uint8Array>; }
