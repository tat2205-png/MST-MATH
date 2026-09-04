import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../scripts/generate-pimath-input-v1-matrix.mjs';
const certificationBefore = readFileSync('docs/acceptance/PIMATH_UNIFIED_INPUT_V1_CERTIFICATION_RESULTS.json','utf8');
const matrix = JSON.parse(readFileSync('docs/acceptance/PIMATH_UNIFIED_INPUT_V1_REQUIREMENT_MATRIX.json','utf8')) as { rows: Array<{requirementId:string;verificationId:string}> };
assert.equal(matrix.rows.length,64); assert.equal(new Set(matrix.rows.map(x=>x.requirementId)).size,64); assert.equal(new Set(matrix.rows.map(x=>x.verificationId)).size,64);
assert.deepEqual(matrix.rows.map(x=>x.requirementId),Array.from({length:64},(_,i)=>`R${i}`)); assert.ok(matrix.rows.every(x=>/^R\d+$/.test(x.requirementId)));
assert.equal(readFileSync('docs/acceptance/PIMATH_UNIFIED_INPUT_V1_CERTIFICATION_RESULTS.json','utf8'), certificationBefore);
console.log('REQUIREMENT_MATRIX_STRUCTURE_QA=PASS');
