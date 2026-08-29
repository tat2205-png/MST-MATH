import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  NarrationCue,
  DEFAULT_TTS_VOICE,
  DEFAULT_TTS_RATE,
  DEFAULT_TTS_VOLUME,
  DEFAULT_TTS_PITCH,
} from "../../src/types/narrationTypes.js";

const execFileAsync = promisify(execFile);

export interface EdgeTtsOptions {
  voice?: string;
  rate?: string;
  volume?: string;
  pitch?: string;
}

export interface TtsGenerationResult {
  ok: boolean;
  cueId: string;
  audioPath?: string;
  duration?: number;
  fileSizeBytes?: number;
  audioBase64?: string;
  error?: string;
  cached?: boolean;
}

export class EdgeTtsEngine {
  private outputDir: string;
  private audioCache: Map<string, { duration: number; fileSizeBytes: number; audioBase64: string }> = new Map();

  constructor() {
    this.outputDir = path.join(process.cwd(), "audio");
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generates a SHA-256 fingerprint for TTS cache key (Rule 19)
   */
  public generateFingerprint(text: string, voice: string, rate: string, pitch: string): string {
    return crypto
      .createHash("sha256")
      .update(`${text}::${voice}::${rate}::${pitch}`)
      .digest("hex");
  }

  /**
   * Generates actual audio MP3 using Edge TTS via safe argument array execution (Rule 7, 8)
   */
  public async generateCueAudio(
    cueId: string,
    ttsText: string,
    options: EdgeTtsOptions = {}
  ): Promise<TtsGenerationResult> {
    // 1. Path & Cue ID Security Validation (Rule 8)
    if (!cueId || /[^a-zA-Z0-9_-]/.test(cueId) || cueId.includes("..")) {
      return {
        ok: false,
        cueId,
        error: `Invalid cueId "${cueId}". Must be alphanumeric identifier without path traversal.`,
      };
    }

    if (!ttsText || ttsText.trim() === "") {
      return {
        ok: false,
        cueId,
        error: "TTS text cannot be empty.",
      };
    }

    const voice = options.voice || DEFAULT_TTS_VOICE;
    const rate = options.rate || DEFAULT_TTS_RATE;
    const volume = options.volume || DEFAULT_TTS_VOLUME;
    const pitch = options.pitch || DEFAULT_TTS_PITCH;

    const cacheKey = this.generateFingerprint(ttsText, voice, rate, pitch);
    const audioFileName = `${cueId}.mp3`;
    const audioFilePath = path.join(this.outputDir, audioFileName);

    // Check cache
    if (this.audioCache.has(cacheKey) && fs.existsSync(audioFilePath)) {
      const cached = this.audioCache.get(cacheKey)!;
      return {
        ok: true,
        cueId,
        audioPath: `audio/${audioFileName}`,
        duration: cached.duration,
        fileSizeBytes: cached.fileSizeBytes,
        audioBase64: cached.audioBase64,
        cached: true,
      };
    }

    // 2. Execute edge-tts CLI via safe subprocess (no shell=true)
    let attempts = 0;
    const maxAttempts = 2; // Rule 24: retry up to 2 times
    let lastError: string = "";

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const args = [
          "--voice",
          voice,
          "--text",
          ttsText,
          "--write-media",
          audioFilePath,
          "--rate",
          rate,
          "--volume",
          volume,
          "--pitch",
          pitch,
        ];

        // Safe execution without shell: true
        await execFileAsync("python", ["-m", "edge_tts", ...args], {
          timeout: 20000,
          windowsHide: true,
        });

        // 3. Verify file created and size > 0 (Rule 10)
        if (!fs.existsSync(audioFilePath)) {
          throw new Error("edge-tts completed but target audio file was not found.");
        }

        const stats = fs.statSync(audioFilePath);
        if (stats.size === 0) {
          throw new Error("edge-tts created empty (0-byte) audio file.");
        }

        // 4. Measure EXACT duration using FFprobe (Rule 9)
        const duration = await this.measureAudioDuration(audioFilePath);
        if (duration <= 0) {
          throw new Error(`FFprobe measured invalid audio duration (${duration}s).`);
        }

        // Read base64 for UI playback
        const audioBuffer = fs.readFileSync(audioFilePath);
        const audioBase64 = `data:audio/mp3;base64,${audioBuffer.toString("base64")}`;

        // Save to cache
        this.audioCache.set(cacheKey, {
          duration,
          fileSizeBytes: stats.size,
          audioBase64,
        });

        return {
          ok: true,
          cueId,
          audioPath: `audio/${audioFileName}`,
          duration,
          fileSizeBytes: stats.size,
          audioBase64,
        };
      } catch (err: any) {
        lastError = err.message || "Unknown error";
        // Short exponential delay before retry
        await new Promise((resolve) => setTimeout(resolve, 300 * attempts));
      }
    }

    return { ok: false, cueId, error: `Edge TTS generation failed after ${maxAttempts} attempts: ${lastError}` };
  }

  /**
   * Measures precise duration in seconds using FFprobe (Rule 9)
   */
  public async measureAudioDuration(filePath: string): Promise<number> {
    try {
      const args = [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ];

      const { stdout } = await execFileAsync("ffprobe", args, {
        timeout: 8000,
      });

      const parsed = parseFloat(stdout.trim());
      return isNaN(parsed) ? 0 : Number(parsed.toFixed(2));
    } catch {
      return 0;
    }
  }
}

export const edgeTtsEngine = new EdgeTtsEngine();
