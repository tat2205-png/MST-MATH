import { unzipSync } from "fflate";
export type EmbeddedEquationClassification = "NORMAL_IMAGE" | "POSSIBLE_EQUATION_IMAGE" | "MATHTYPE_OR_EMBEDDED_EQUATION" | "UNKNOWN_EMBEDDED_OBJECT";
export interface EmbeddedObjectEvidence { packagePath: string; classification: EmbeddedEquationClassification; confidence: number; evidence: string[]; previewPath?: string }
export function discoverEmbeddedEquationObjects(bytes: Uint8Array): EmbeddedObjectEvidence[] {
  const files = unzipSync(bytes); const names = Object.keys(files); const relationshipXml = names.filter((name) => name.endsWith(".rels")).map((name) => new TextDecoder().decode(files[name])).join("\n");
  const results: EmbeddedObjectEvidence[] = [];
  for (const name of names.filter((item) => item.startsWith("word/embeddings/"))) {
    const data = files[name]; const ascii = new TextDecoder("latin1").decode(data.slice(0, 8192)); const mathType = /MathType|Equation\.3|Design Science/iu.test(ascii) || /equation/iu.test(relationshipXml) && /oleObject/iu.test(relationshipXml);
    results.push({ packagePath: name, classification: mathType ? "MATHTYPE_OR_EMBEDDED_EQUATION" : "UNKNOWN_EMBEDDED_OBJECT", confidence: mathType ? 0.95 : 0.45, evidence: mathType ? ["OLE_EQUATION_SIGNATURE"] : ["EMBEDDED_OBJECT_WITHOUT_EQUATION_SIGNATURE"] });
  }
  for (const name of names.filter((item) => item.startsWith("word/media/") && /\.(?:wmf|emf)$/iu.test(item))) results.push({ packagePath: name, classification: /equation|math/iu.test(relationshipXml) ? "POSSIBLE_EQUATION_IMAGE" : "NORMAL_IMAGE", confidence: 0.6, evidence: ["VECTOR_PREVIEW", "RELATIONSHIP_CONTEXT_INSPECTED"] });
  return results;
}

