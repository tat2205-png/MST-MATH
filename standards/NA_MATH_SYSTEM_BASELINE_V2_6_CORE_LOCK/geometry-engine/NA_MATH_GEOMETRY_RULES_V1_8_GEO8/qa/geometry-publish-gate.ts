export interface GeometryQaResult {
  code: string;
  pass: boolean;
  message?: string;
}

export const REQUIRED_3D_GATES = [
  'INPUT_PROVENANCE_QA',
  'TOPOLOGY_QA',
  'INCIDENCE_QA',
  'PARALLEL_RELATION_QA',
  'VIEW_PROFILE_QA',
  'PROJECTION_CONSISTENCY_QA',
  'EDGE_VISIBILITY_TABLE_QA',
  'AUXILIARY_GEOMETRY_QA',
  'LABEL_COLLISION_QA',
  'SYMBOL_PLACEMENT_QA',
  'PRIME_GLYPH_QA',
  'SGK_NOTATION_QA',
  'NO_VISUAL_INFERENCE_QA',
] as const;

export function canPublishGeometry(results: GeometryQaResult[]): boolean {
  const byCode = new Map(results.map(r => [r.code, r.pass]));
  return REQUIRED_3D_GATES.every(code => byCode.get(code) === true);
}
