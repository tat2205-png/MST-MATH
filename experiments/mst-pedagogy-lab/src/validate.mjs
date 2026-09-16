const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const stringArray = (value, { min = 0 } = {}) =>
  Array.isArray(value) && value.length >= min && value.every(nonEmpty) && new Set(value).size === value.length;

const GATE_STATES = ['PASS', 'FAIL', 'BLOCKED', 'NOT_TESTED', 'REVIEW_REQUIRED'];
const PARSE_STATES = ['EXACT', 'VALIDATED', 'RECOVERED', 'AMBIGUOUS', 'CONFLICT'];
const CANDIDATE_TYPES = ['TEXT', 'MATH', 'FIGURE', 'TABLE'];
const TRANSFORMATIONS = [
  'PARAMETER_VARIATION',
  'CONTEXT_VARIATION',
  'REPRESENTATION_SWITCH',
  'REVERSE_PROBLEM',
  'ERROR_ANALYSIS',
  'MISSING_DATA',
  'REDUNDANT_DATA',
  'COUNTEREXAMPLE',
  'GENERALIZATION',
  'MULTI_SOLUTION',
  'STRATEGY_COMPARE',
  'MODELING',
  'OPEN_INVESTIGATION',
];
const SCAFFOLDING = ['NONE', 'LIGHT', 'STEPWISE', 'ADAPTIVE'];
const ANSWER_EXPOSURE = ['NO_ANSWER_LEAK', 'SCAFFOLDED', 'EXPLANATORY', 'FULL_SOLUTION'];

export function validateParseCandidate(value) {
  const errors = [];
  if (!value || typeof value !== 'object') return { ok: false, errors: ['candidate must be an object'] };
  if (value.schemaVersion !== 'parse-candidate.v1-exp') errors.push('invalid schemaVersion');
  if (value.authority !== 'CANDIDATE_ONLY') errors.push('authority must be CANDIDATE_ONLY');
  if (!nonEmpty(value?.engine?.name) || !nonEmpty(value?.engine?.version) || !nonEmpty(value?.engine?.adapterVersion)) {
    errors.push('engine provenance is incomplete');
  }
  if (!nonEmpty(value?.source?.artifactId)) errors.push('source.artifactId is required');
  if (!PARSE_STATES.includes(value.status)) errors.push('invalid parse evidence status');
  if (!CANDIDATE_TYPES.includes(value?.candidate?.type)) errors.push('candidate.type is invalid');
  if (!value?.candidate || !Object.prototype.hasOwnProperty.call(value.candidate, 'data')) errors.push('candidate.data is required');
  if (!stringArray(value.evidenceRefs, { min: 1 })) errors.push('at least one unique evidenceRef is required');
  if (!Array.isArray(value.warnings) || !value.warnings.every(nonEmpty)) errors.push('warnings must be an array of non-empty strings');
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
  if (!nonEmpty(value?.curriculum?.unit)) errors.push('curriculum.unit is required');
  if (!GATE_STATES.includes(value?.curriculum?.alignmentState)) errors.push('curriculum.alignmentState is invalid');
  for (const field of ['learningObjectives', 'mathematicalConcepts', 'studentActions', 'reasoningDemands', 'evidenceOfLearning']) {
    if (!stringArray(value[field], { min: 1 })) errors.push(`${field} must contain at least one unique non-empty string`);
  }
  for (const field of ['prerequisites', 'representations', 'difficultyFactors']) {
    if (!stringArray(value[field])) errors.push(`${field} must contain unique non-empty strings`);
  }
  if (!SCAFFOLDING.includes(value.scaffoldingPolicy)) errors.push('scaffoldingPolicy is invalid');
  if (!ANSWER_EXPOSURE.includes(value.answerExposurePolicy)) errors.push('answerExposurePolicy is invalid');
  if (!nonEmpty(value?.provenance?.sourceQuestionId) || !nonEmpty(value?.provenance?.analyzerId) || !nonEmpty(value?.provenance?.analyzerVersion)) {
    errors.push('pedagogy provenance is incomplete');
  }
  if (!stringArray(value?.provenance?.evidenceRefs, { min: 1 })) errors.push('provenance.evidenceRefs is required');
  if (Array.isArray(value.misconceptions)) {
    for (const item of value.misconceptions) {
      if (!nonEmpty(item?.id) || !nonEmpty(item?.statement)) errors.push('misconception id and statement are required');
      if (!['KNOWN', 'HYPOTHESIZED'].includes(item?.status)) errors.push('misconception status must be KNOWN or HYPOTHESIZED');
      if (!stringArray(item?.evidenceRefs)) errors.push('misconception evidenceRefs must be unique non-empty strings');
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
  if (!nonEmpty(value.candidateQuestionId)) errors.push('candidateQuestionId is required');
  if (!stringArray(value.derivedFrom, { min: 1 })) errors.push('derivedFrom must contain at least one parent question ID');
  if (!TRANSFORMATIONS.includes(value.transformation)) errors.push('transformation is invalid');
  if (!nonEmpty(value?.generator?.id) || !nonEmpty(value?.generator?.version) || !nonEmpty(value?.generator?.promptVersion)) {
    errors.push('generator genealogy is incomplete');
  }
  for (const key of ['math', 'pedagogy', 'curriculum']) {
    if (!GATE_STATES.includes(value?.validation?.[key])) errors.push(`validation.${key} has invalid gate state`);
  }
  if (!GATE_STATES.includes(value.teacherDecision)) errors.push('teacherDecision has invalid gate state');
  return { ok: errors.length === 0, errors };
}
