import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { QuestionBankRepository, QuestionBankSnapshot } from "./types.js";

const empty = (): QuestionBankSnapshot => ({
  schemaVersion: 1,
  questions: [],
  orphanFigures: [],
  relations: {
    schemaVersion: 1,
    relations: [],
    families: [],
    duplicateAudit: [],
  },
});

type EncodedBytes = { $type: "Uint8Array"; base64: string };
type NodeBufferJson = { type: "Buffer"; data: number[] };

const encoded = (bytes: Uint8Array): EncodedBytes => ({
  $type: "Uint8Array",
  base64: Buffer.from(bytes).toString("base64"),
});

const isNodeBufferJson = (value: unknown): value is NodeBufferJson => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 2 &&
    record.type === "Buffer" &&
    Array.isArray(record.data) &&
    record.data.every(
      (byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255,
    )
  );
};

const replacer = (_key: string, value: unknown) => {
  if (value instanceof Uint8Array) return encoded(value);
  if (value instanceof ArrayBuffer) return encoded(new Uint8Array(value));

  // Buffer.toJSON runs before a JSON replacer. Normalize only its exact,
  // validated contract; arbitrary objects remain invalid.
  if (isNodeBufferJson(value)) return encoded(Uint8Array.from(value.data));

  return value;
};

const reviver = (_key: string, value: unknown) => {
  if (
    typeof value === "object" &&
    value !== null &&
    (value as { $type?: string }).$type === "Uint8Array"
  ) {
    const base64 = (value as { base64?: unknown }).base64;
    if (typeof base64 !== "string") {
      throw new Error("QUESTION_BANK_BINARY_ENCODING_INVALID");
    }
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  // Read legacy snapshots written after runtime-derived WMF buffers were added.
  if (isNodeBufferJson(value)) return Uint8Array.from(value.data);

  return value;
};

const validateFigureBytes = (snapshot: QuestionBankSnapshot): void => {
  const figures = [
    ...snapshot.questions.flatMap((question) => question.figures),
    ...snapshot.orphanFigures,
  ];

  if (
    figures.some(
      (figure) =>
        figure.bytes !== undefined && !(figure.bytes instanceof Uint8Array),
    )
  ) {
    throw new Error("QUESTION_BANK_BINARY_ENCODING_INVALID");
  }
};

export function serializeSnapshot(snapshot: QuestionBankSnapshot): string {
  return JSON.stringify(snapshot, replacer, 2);
}

export function deserializeSnapshot(value: string): QuestionBankSnapshot {
  const parsed = JSON.parse(value, reviver) as QuestionBankSnapshot;
  if (
    parsed.schemaVersion !== 1 ||
    !Array.isArray(parsed.questions) ||
    !Array.isArray(parsed.orphanFigures)
  ) {
    throw new Error("QUESTION_BANK_SCHEMA_UNSUPPORTED");
  }

  validateFigureBytes(parsed);
  return parsed;
}

export class MemoryQuestionBankRepository implements QuestionBankRepository {
  private snapshot = empty();

  load(): QuestionBankSnapshot {
    return structuredClone(this.snapshot);
  }

  replace(snapshot: QuestionBankSnapshot): void {
    this.snapshot = deserializeSnapshot(serializeSnapshot(snapshot));
  }
}

/**
 * JSON remains the compatibility storage format, but repeated readFile +
 * JSON.parse of an unchanged bank is unnecessary. Keep one validated decoded
 * snapshot in memory and invalidate it whenever the file signature changes.
 *
 * load() still returns a clone so callers cannot mutate repository state
 * without replace(). This preserves the existing repository contract while
 * removing the dominant repeated disk/parse cost in long-running local use.
 */
export class JsonQuestionBankRepository implements QuestionBankRepository {
  private cachedSnapshot: QuestionBankSnapshot | undefined;
  private cachedSignature: string | undefined;

  constructor(private readonly path: string) {}

  private fileSignature(): string | undefined {
    if (!existsSync(this.path)) return undefined;
    const stats = statSync(this.path);
    return `${stats.size}:${stats.mtimeMs}:${stats.ctimeMs}`;
  }

  load(): QuestionBankSnapshot {
    const signature = this.fileSignature();

    if (signature === undefined) {
      if (!this.cachedSnapshot || this.cachedSignature !== undefined) {
        this.cachedSnapshot = empty();
        this.cachedSignature = undefined;
      }
      return structuredClone(this.cachedSnapshot);
    }

    if (!this.cachedSnapshot || signature !== this.cachedSignature) {
      this.cachedSnapshot = deserializeSnapshot(readFileSync(this.path, "utf8"));
      this.cachedSignature = signature;
    }

    return structuredClone(this.cachedSnapshot);
  }

  replace(snapshot: QuestionBankSnapshot): void {
    const serialized = serializeSnapshot(snapshot);

    // Validate exactly what will be persisted before touching the live file.
    const validatedSnapshot = deserializeSnapshot(serialized);

    mkdirSync(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.tmp`;
    writeFileSync(temporary, serialized, "utf8");
    renameSync(temporary, this.path);

    // The process that performed the write already owns the validated decoded
    // value, so do not immediately read and parse the same file again.
    this.cachedSnapshot = validatedSnapshot;
    this.cachedSignature = this.fileSignature();
  }
}
