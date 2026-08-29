import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { QuestionBankRepository, QuestionBankSnapshot } from "./types.js";
const empty = (): QuestionBankSnapshot => ({ schemaVersion: 1, questions: [], orphanFigures: [] });
const replacer = (_key: string, value: unknown) => value instanceof Uint8Array ? { $type: "Uint8Array", base64: Buffer.from(value).toString("base64") } : value;
const reviver = (_key: string, value: unknown) => typeof value === "object" && value !== null && (value as { $type?: string }).$type === "Uint8Array" ? new Uint8Array(Buffer.from((value as { base64: string }).base64, "base64")) : value;
export function serializeSnapshot(snapshot: QuestionBankSnapshot): string { return JSON.stringify(snapshot, replacer, 2); }
export function deserializeSnapshot(value: string): QuestionBankSnapshot { const parsed = JSON.parse(value, reviver) as QuestionBankSnapshot; if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.questions) || !Array.isArray(parsed.orphanFigures)) throw new Error("QUESTION_BANK_SCHEMA_UNSUPPORTED"); return parsed; }
export class MemoryQuestionBankRepository implements QuestionBankRepository { private snapshot = empty(); load(): QuestionBankSnapshot { return structuredClone(this.snapshot); } replace(snapshot: QuestionBankSnapshot): void { this.snapshot = deserializeSnapshot(serializeSnapshot(snapshot)); } }
export class JsonQuestionBankRepository implements QuestionBankRepository {
  constructor(private readonly path: string) {}
  load(): QuestionBankSnapshot { return existsSync(this.path) ? deserializeSnapshot(readFileSync(this.path, "utf8")) : empty(); }
  replace(snapshot: QuestionBankSnapshot): void { const encoded = serializeSnapshot(snapshot); deserializeSnapshot(encoded); mkdirSync(dirname(this.path), { recursive: true }); const temporary = `${this.path}.tmp`; writeFileSync(temporary, encoded, "utf8"); renameSync(temporary, this.path); }
}
