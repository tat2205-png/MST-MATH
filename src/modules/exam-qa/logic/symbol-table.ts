import type { MathSymbolRecord } from "./logic-rules.js";

export class QuestionSymbolTable {
  private readonly records = new Map<string, MathSymbolRecord[]>();

  constructor(seed: MathSymbolRecord[] = []) { seed.forEach((record) => this.add(record)); }
  add(record: MathSymbolRecord): void { this.records.set(record.name, [...(this.records.get(record.name) ?? []), record]); }
  has(name: string): boolean { return (this.records.get(name) ?? []).some((record) => record.state === "DECLARED" || record.state === "DERIVED_OR_IMPLIED"); }
  get(name: string): MathSymbolRecord[] { return [...(this.records.get(name) ?? [])]; }
  all(): MathSymbolRecord[] { return [...this.records.values()].flat(); }
  clone(): QuestionSymbolTable { return new QuestionSymbolTable(this.all().map((record) => ({ ...record, dependsOn: [...record.dependsOn], metadata: record.metadata ? { ...record.metadata } : undefined }))); }
}

