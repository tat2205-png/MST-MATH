const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const stringArray = (value, { min = 0 } = {}) =>
  Array.isArray(value) && value.length >= min && value.every(nonEmpty) && new Set(value).size === value.length;

export function validateParseCandidate(value) {
  const errors = [];
  if (!value || typeof value !== 'object') return { ok: false, errors: ['candidate must be an object'] };
  if (value.schemaVersion !== 'parse-candidate.v1-exp') errors.push('invalid schemaVersion');
  if (value.authority !== 'CANDIDATE_ONLY') errors.push('authority must be CANDIDATE_ONLY');
  if (!nonEmpty(value?.engine?.name) || !nonEmpty(value?.engine?.version) || !nonEmpty(value?.engine?.adapterVersion)) {
    errors.push('engine provenance is incomplete');
  }
  if (!nonEmpty(value?.source?.artifactId)) errors.push('source.artifactId is required');
  if (!['EXACT', 'VALIDATED', 'RECOVERED', 'AMBIGUOUS', 'CONFLICT'].includes(value.status)) {
    errors.push('invalid parse evidence status');
  }
  if (!stringArray(value.evidenceRefs, { min: 1 })) errors.push('at least one unique evidenceRef is required');
  if (Object.prototype.hasOwnProperty.call(value, 'confidence')) {
    errors.push('numeric/unqualified confidence is forbidden in V1');
  }
  return { ok: errors.length === 0, errors };
}

export function validatePedagogySpec(value) {
  const errors = [];
  if (!value || typeof value !== 'object') return { ok: false, errors: ['spec must be an object'] };
  if (value.schemaVersion !== 'pedagogy-spec.v1-exp') errors.push('invalid schemaVersion');
  if (!nonEmpty(value.questionId)) errors.push('questionId is required');
  if (value?.curriculum?.program !== 'GDPT2018') errors.push('curriculum.program must be GDPT2018');
  if (![10, 11, 12].includes(value?.curriculum?.grade)) errors.push('curriculum.grade must be 10, 11, or 12');
  for (const field of ['learningObjectives', 'mathematicalConcepts', 'studentActions', 'reasoningDemands', 'evidenceOfLearning']) {
    if (!stringArray(value[field], { min: 1 })) errors.push(`${field} must contain at least one unique non-empty string`);
  }
  if (!nonEmpty(value?.provenance?.sourceQuestionId) || !nonEmpty(value?.provenance?.analyzerId) || !nonEmpty(value?.provenance?.analyzerVersion)) {
    errors.push('pedagogy provenance is incomplete');
  }
  if (!stringArray(value?.provenance?.evidenceRefs, { min: 1 })) errors.push('provenance.evidenceRefs is required');
  if (Array.isArray(value.misconceptions)) {
    for (const item of value.misconceptions) {
      if (!['KNOWN', 'HYPOTHESIZED'].includes(item?.status)) errors.push('misconception status must be KNOWN or HYPOTHESIZED');
      if (item?.status === 'KNOWN' && !stringArray(item?.evidenceRefs, { min: 1 })) {
        errors.push('KNOWN misconception requires evidenceRefs');
      }
    }
  } else {
    errors.push('misconceptions must be an array');
  }
  return { ok: errors.length === 0, errors };
}

export function validateGenerationRecord(value) {
  const errors = [];
  if (!value || typeof value !== 'object') return { ok: false, errors: ['record must be an object'] };
  if (value.schemaVersion !== 'generation-record.v1-exp') errors.push('invalid schemaVersion');
  if (value.authority !== 'CANDIDATE_ONLY') errors.push('authority must be CANDIDATE_ONLY');
  if (!stringArray(value.derivedFrom, { min: 1 })) errors.push('derivedFrom must contain at least one parent question ID');
  if (!nonEmpty(value?.generator?.id) || !nonEmpty(value?.generator?.version) || !nonEmpty(value?.generator?.promptVersion)) {
    errors.push('generator genealogy is incomplete');
  }
  const gateStates = ['PASS', 'FAIL', 'BLOCKED', 'NOT_TESTED', 'REVIEW_REQUIRED'];
  for (const key of ['math', 'pedagogy', 'curriculum']) {
    if (!gateStates.includes(value?.validation?.[key])) errors.push(`validation.${key} has invalid gate state`);
  }
  if (!gateStates.includes(value.teacherDecision)) errors.push('teacherDecision has invalid gate state');
  return { ok: errors.length === 0, errors };
}
