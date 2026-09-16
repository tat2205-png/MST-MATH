import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { routeParse, reconcileParse } from '../src/policy.mjs';
import { validateParseCandidate, validatePedagogySpec, validateGenerationRecord } from '../src/validate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const loadJson = async (relative) => JSON.parse(await readFile(resolve(here, relative), 'utf8'));

const pedagogy = await loadJson('../fixtures/pedagogy-valid.json');
const conflict = await loadJson('../fixtures/parse-conflict.json');

assert.equal(validatePedagogySpec(pedagogy).ok, true, 'valid PedagogySpec must pass invariant validation');
assert.equal(validateParseCandidate(conflict).ok, true, 'conflict candidate is valid evidence even though it is not canonical truth');

assert.equal(
  routeParse({ nativeGate: 'PASS', evidenceConflict: false, recoverable: true }),
  'ACCEPT_NATIVE_EVIDENCE',
  'native PASS must not invoke recovery by default',
);

assert.equal(
  routeParse({ nativeGate: 'FAIL', evidenceConflict: false, recoverable: true }),
  'REQUEST_ONE_RECOVERY_ADAPTER',
  'recoverable native failure should route to exactly one recovery adapter',
);

assert.equal(
  routeParse({ nativeGate: 'PASS', evidenceConflict: true, recoverable: true }),
  'REVIEW_REQUIRED',
  'conflict must fail closed even when native gate passed',
);

assert.equal(
  reconcileParse({ nativeGate: 'FAIL', recoveryStatus: 'CONFLICT', sameSemanticValue: false }),
  'REVIEW_REQUIRED',
  'parser disagreement must never be majority-voted into canonical truth',
);

const forbiddenConfidence = { ...conflict, confidence: 0.99 };
assert.equal(validateParseCandidate(forbiddenConfidence).ok, false, 'uncalibrated confidence must be rejected in V1');

const generation = {
  schemaVersion: 'generation-record.v1-exp',
  authority: 'CANDIDATE_ONLY',
  candidateQuestionId: 'Q-CAND-001',
  derivedFrom: ['Q-DEMO-001'],
  transformation: 'ERROR_ANALYSIS',
  generator: { id: 'demo-generator', version: '0.0.0', promptVersion: 'prompt-exp-1' },
  validation: { math: 'NOT_TESTED', pedagogy: 'NOT_TESTED', curriculum: 'NOT_TESTED' },
  teacherDecision: 'REVIEW_REQUIRED',
};
assert.equal(validateGenerationRecord(generation).ok, true, 'generation genealogy must be representable before any generator exists');

console.log('MST Pedagogy Lab contract smoke: PASS');
