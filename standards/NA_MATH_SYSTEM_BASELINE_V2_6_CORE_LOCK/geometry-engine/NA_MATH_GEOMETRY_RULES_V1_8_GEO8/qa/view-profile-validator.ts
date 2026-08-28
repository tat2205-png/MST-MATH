export interface ViewProfileQaIssue {
  code: string;
  severity: 'error';
  message: string;
}

export interface ViewProfileQaInput {
  profileId: string;
  knownProfileIds: string[];
  allRenderedEdges: string[];
  solidEdges: string[];
  dashedEdges: string[];
  expectedSolidEdges: string[];
  expectedDashedEdges: string[];
  projectionMode: string;
  hasDecorativeVisibilityGuides: boolean;
  layoutId: string;
}

export function validateViewProfileUse(
  input: ViewProfileQaInput
): ViewProfileQaIssue[] {
  const issues: ViewProfileQaIssue[] = [];

  if (!input.knownProfileIds.includes(input.profileId))
    issues.push({
      code:'UNKNOWN_VIEW_PROFILE',
      severity:'error',
      message:`Unknown view profile: ${input.profileId}`
    });

  if (input.projectionMode !== 'parallel')
    issues.push({
      code:'PROJECTION_MODE_QA',
      severity:'error',
      message:'Core school 3D geometry must use approved parallel projection.'
    });

  const actualSolid = new Set(input.solidEdges);
  const actualDashed = new Set(input.dashedEdges);

  for (const edge of input.expectedSolidEdges) {
    if (!actualSolid.has(edge))
      issues.push({
        code:'EDGE_VISIBILITY_TABLE_QA',
        severity:'error',
        message:`${edge} must be solid in profile ${input.profileId}.`
      });
  }

  for (const edge of input.expectedDashedEdges) {
    if (!actualDashed.has(edge))
      issues.push({
        code:'EDGE_VISIBILITY_TABLE_QA',
        severity:'error',
        message:`${edge} must be dashed in profile ${input.profileId}.`
      });
  }

  for (const edge of input.allRenderedEdges) {
    if (!actualSolid.has(edge) && !actualDashed.has(edge))
      issues.push({
        code:'EDGE_STYLE_UNSPECIFIED',
        severity:'error',
        message:`No solid/dashed style resolved for ${edge}.`
      });
  }

  if (input.hasDecorativeVisibilityGuides)
    issues.push({
      code:'FALSE_VISIBILITY_GUIDE_QA',
      severity:'error',
      message:'Decorative depth/visibility guides are forbidden.'
    });

  if (input.layoutId !== 'NA-MATH-LAYOUT-V1.3-CANONICAL')
    issues.push({
      code:'LAYOUT_LOCK_VIOLATION',
      severity:'error',
      message:'View profile work may not change the locked V1.3 layout.'
    });

  return issues;
}
