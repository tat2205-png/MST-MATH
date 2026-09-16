export const GATE_STATES = Object.freeze([
  'PASS',
  'FAIL',
  'BLOCKED',
  'NOT_TESTED',
  'REVIEW_REQUIRED',
]);

export const PARSE_EVIDENCE_STATES = Object.freeze([
  'EXACT',
  'VALIDATED',
  'RECOVERED',
  'AMBIGUOUS',
  'CONFLICT',
]);

/**
 * Deterministic recovery routing. This function never chooses a canonical
 * semantic value; it only decides the next allowed action.
 */
export function routeParse({ nativeGate, evidenceConflict = false, recoverable = false }) {
  if (!GATE_STATES.includes(nativeGate)) {
    throw new Error(`Unknown gate state: ${nativeGate}`);
  }

  if (evidenceConflict) return 'REVIEW_REQUIRED';
  if (nativeGate === 'PASS') return 'ACCEPT_NATIVE_EVIDENCE';
  if (recoverable && ['FAIL', 'BLOCKED', 'REVIEW_REQUIRED'].includes(nativeGate)) {
    return 'REQUEST_ONE_RECOVERY_ADAPTER';
  }
  if (nativeGate === 'NOT_TESTED') return 'BLOCKED';
  if (nativeGate === 'REVIEW_REQUIRED') return 'REVIEW_REQUIRED';
  return 'ERROR';
}

/**
 * Reconciliation is intentionally conservative. Recovery evidence is
 * candidate-only; disagreement can never be resolved by majority vote.
 */
export function reconcileParse({ nativeGate, recoveryStatus, sameSemanticValue }) {
  if (!GATE_STATES.includes(nativeGate)) throw new Error(`Unknown gate state: ${nativeGate}`);
  if (!PARSE_EVIDENCE_STATES.includes(recoveryStatus)) {
    throw new Error(`Unknown recovery status: ${recoveryStatus}`);
  }

  if (nativeGate === 'PASS' && sameSemanticValue === true) return 'KEEP_NATIVE';
  if (recoveryStatus === 'CONFLICT' || recoveryStatus === 'AMBIGUOUS') return 'REVIEW_REQUIRED';
  if (sameSemanticValue === false) return 'REVIEW_REQUIRED';
  if (['EXACT', 'VALIDATED', 'RECOVERED'].includes(recoveryStatus) && nativeGate !== 'PASS') {
    return 'VALIDATE_BEFORE_CANONICALIZATION';
  }
  return 'BLOCKED';
}
