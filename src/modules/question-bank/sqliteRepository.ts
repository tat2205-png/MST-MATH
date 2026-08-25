import { DatabaseSync } from "node:sqlite";
import type { QuestionBankRepository, QuestionRecord, QuestionSearchFilters } from "./types.js";
import { assertValidQuestion } from "./schema.js";
import { matchesQuestionFilters } from "./search.js";

export class SqliteQuestionBankRepository implements QuestionBankRepository {
  private readonly db: DatabaseSync;
  constructor(path: string) { this.db = new DatabaseSync(path); this.migrate(); }
  private migrate(): void {
    this.db.exec("PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS qb_schema_version(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS questions(id TEXT PRIMARY KEY, record_json TEXT NOT NULL, updated_at TEXT NOT NULL);");
    this.db.prepare("INSERT OR IGNORE INTO qb_schema_version(version, applied_at) VALUES(1, ?)").run(new Date().toISOString());
  }
  schemaVersion(): number { return Number((this.db.prepare("SELECT MAX(version) AS version FROM qb_schema_version").get() as { version: number }).version); }
  saveQuestion(q: QuestionRecord): void { assertValidQuestion(q); this.db.prepare("INSERT INTO questions(id, record_json, updated_at) VALUES(?, ?, ?)").run(q.id, JSON.stringify(q), q.updatedAt); }
  getQuestion(id: string): QuestionRecord | undefined { const row = this.db.prepare("SELECT record_json FROM questions WHERE id=?").get(id) as { record_json: string } | undefined; return row ? JSON.parse(row.record_json) as QuestionRecord : undefined; }
  updateQuestion(q: QuestionRecord): void { assertValidQuestion(q); const result = this.db.prepare("UPDATE questions SET record_json=?, updated_at=? WHERE id=?").run(JSON.stringify(q), q.updatedAt, q.id); if (!result.changes) throw new Error(`Question not found: ${q.id}`); }
  deleteQuestion(id: string): boolean { return this.db.prepare("DELETE FROM questions WHERE id=?").run(id).changes > 0; }
  searchQuestions(filters: QuestionSearchFilters): QuestionRecord[] { const rows = this.db.prepare("SELECT record_json FROM questions ORDER BY updated_at DESC").all() as { record_json: string }[]; return rows.map((r) => JSON.parse(r.record_json) as QuestionRecord).filter((q) => matchesQuestionFilters(q, filters)); }
  close(): void { this.db.close(); }
}
