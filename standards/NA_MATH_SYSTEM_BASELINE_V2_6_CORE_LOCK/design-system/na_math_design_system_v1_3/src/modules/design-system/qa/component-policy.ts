import type { ComponentKind } from '../components/component-registry';

export interface ComponentPolicyIssue {
  code: string;
  severity: 'warning' | 'error';
  message: string;
}

export function validateComponentPolicy(
  kind: ComponentKind,
  opts: {
    usesPlainUnicodeMath?: boolean;
    hasGeometry?: boolean;
    geometryQaPassed?: boolean;
    iconPresent?: boolean;
    semanticTonePresent?: boolean;
  }
): ComponentPolicyIssue[] {
  const issues: ComponentPolicyIssue[] = [];

  if (!opts.iconPresent) {
    issues.push({ code: 'COMPONENT_ICON_MISSING', severity: 'error', message: `${kind}: missing semantic icon` });
  }
  if (!opts.semanticTonePresent) {
    issues.push({ code: 'COMPONENT_TONE_MISSING', severity: 'error', message: `${kind}: missing semantic tone` });
  }
  if (opts.usesPlainUnicodeMath) {
    issues.push({ code: 'PLAIN_UNICODE_MATH_FORBIDDEN', severity: 'error', message: `${kind}: math must use the production math renderer` });
  }
  if (opts.hasGeometry && !opts.geometryQaPassed) {
    issues.push({ code: 'GEOMETRY_QA_REQUIRED', severity: 'error', message: `${kind}: geometry QA must pass before publish` });
  }

  return issues;
}
