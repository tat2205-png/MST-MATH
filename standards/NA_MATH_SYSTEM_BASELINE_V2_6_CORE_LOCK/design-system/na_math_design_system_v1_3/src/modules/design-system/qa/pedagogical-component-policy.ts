import type { ComponentKind } from '../components/component-registry';

export interface PedagogicalPolicyIssue {
  code: string;
  severity: 'warning' | 'error';
  message: string;
}

const forbiddenDecorativeOnlyKinds = new Set<string>([
  'fun-fact-decorative',
  'random-quote',
  'decorative-sticker'
]);

export function validatePedagogicalComponent(
  kind: ComponentKind | string,
  options: {
    hasPedagogicalPurpose?: boolean;
    duplicatesExistingSemanticRole?: boolean;
    realWorldContextIsAuthentic?: boolean;
    focusOverlapsCriticalContent?: boolean;
  }
): PedagogicalPolicyIssue[] {
  const issues: PedagogicalPolicyIssue[] = [];

  if (forbiddenDecorativeOnlyKinds.has(kind) || options.hasPedagogicalPurpose === false) {
    issues.push({
      code: 'DECORATIVE_ONLY_COMPONENT_FORBIDDEN',
      severity: 'error',
      message: `${kind}: component must have a clear pedagogical purpose`
    });
  }

  if (options.duplicatesExistingSemanticRole) {
    issues.push({
      code: 'DUPLICATE_SEMANTIC_COMPONENT',
      severity: 'warning',
      message: `${kind}: semantic role overlaps an existing component`
    });
  }

  if (kind === 'real-world-connection' && options.realWorldContextIsAuthentic === false) {
    issues.push({
      code: 'INAUTHENTIC_REAL_WORLD_CONTEXT',
      severity: 'error',
      message: 'Real-world connection must begin from authentic phenomenon/data/problem, not a story fitted to a formula.'
    });
  }

  if (kind === 'focus' && options.focusOverlapsCriticalContent) {
    issues.push({
      code: 'FOCUS_OVERLAP',
      severity: 'error',
      message: 'Focus highlight must not cover labels, formulas, or geometric relations.'
    });
  }

  return issues;
}
