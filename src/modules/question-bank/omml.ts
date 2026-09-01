import { parseXml } from "../document-engine/xml.js";
import { ommlToLatex } from "../document-engine/omml/omml.js";
import type { MathNode } from "./types.js";

export function parseOmml(sourceRaw: string, sourceLocation: string): MathNode {
  try {
    const conversion = ommlToLatex(parseXml(sourceRaw), sourceLocation);
    const warnings = conversion.issues.map((issue) => `${issue.code}:${issue.path ?? sourceLocation}`);
    const latex = conversion.latex?.trim();
    return { sourceType: "OMML", sourceRaw, latex: latex || undefined, normalized: latex || undefined, parseStatus: conversion.status === "PASS" ? "PARSED" : latex ? "UNSUPPORTED" : "UNRESOLVED", warnings: [...new Set(warnings)], sourceLocation };
  } catch (error) {
    return { sourceType: "OMML", sourceRaw, parseStatus: "UNRESOLVED", warnings: [`OMML_PARSE_FAILED:${error instanceof Error ? error.message : String(error)}`], sourceLocation };
  }
}
