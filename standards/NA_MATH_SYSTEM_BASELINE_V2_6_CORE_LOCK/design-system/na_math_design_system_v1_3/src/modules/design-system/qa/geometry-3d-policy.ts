export interface GeometryQaIssue {
  code: string;
  severity: 'warning' | 'error';
  message: string;
}

export interface GeometryQaInput {
  relationChecksPassed: boolean;
  projectionConsistencyPassed: boolean;
  visibilityPassed: boolean;
  hiddenEdgePassed: boolean;
  labelCollisionPassed: boolean;
  symbolPlacementPassed: boolean;
  topologyPassed: boolean;
  sgkNotationPassed: boolean;
}

export function validate3DGeometry(input: GeometryQaInput): GeometryQaIssue[] {
  const issues: GeometryQaIssue[] = [];

  const checks: Array<[keyof GeometryQaInput, string]> = [
    ['relationChecksPassed', 'GEOMETRY_RELATION_QA'],
    ['projectionConsistencyPassed', 'PROJECTION_CONSISTENCY_QA'],
    ['visibilityPassed', 'VISIBILITY_QA'],
    ['hiddenEdgePassed', 'HIDDEN_EDGE_QA'],
    ['labelCollisionPassed', 'LABEL_COLLISION_QA'],
    ['symbolPlacementPassed', 'SYMBOL_PLACEMENT_QA'],
    ['topologyPassed', 'TOPOLOGY_QA'],
    ['sgkNotationPassed', 'SGK_NOTATION_QA'],
  ];

  for (const [key, code] of checks) {
    if (!input[key]) {
      issues.push({
        code,
        severity: 'error',
        message: `${code} failed; 3D figure must not be published.`,
      });
    }
  }

  return issues;
}
