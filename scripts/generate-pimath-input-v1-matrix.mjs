import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const names = [
  'traceability','public-api','diagnostics','format-matrix','signature','hostile-input','process-security','path-correctness','identity','idempotency','provider-provenance','fallback','timeout','temporary-files','derivation','legacy-doc','encrypted-pdf','page-semantics','rotation','orientation','quality','vietnamese','math-fidelity','tables','furniture','numbering','cross-page','answer-key','grouping','field-provenance','conflict-ledger','review-contract','ordering','concurrency','crash-consistency','bank-atomicity','duplicate-source','versioning','timestamp-identity','corpus-manifest','human-reference','classification','test-balance','snapshot-safety','architecture-budget','dependency-audit','immutability','repeatability','failure-injection','backward-compatibility','fallback-traceability','no-data-loss','failure-classification','denominators','review-precision','non-goals','code-quality','execution-order','stop-conditions','commit-gate','closure-gate','report-contract','anti-fake-pass','final-principle'
];
const resultPath = 'docs/acceptance/PIMATH_UNIFIED_INPUT_V1_CERTIFICATION_RESULTS.json';
const resultSnapshot = existsSync(resultPath) ? readFileSync(resultPath, 'utf8') : undefined;
const prior = resultSnapshot ? JSON.parse(resultSnapshot).results ?? [] : [];
const priorByRequirement = new Map(prior.map((row) => [row.requirementId, row]));
const rows = names.map((name, i) => {
  const requirementId = `R${i}`;
  const verificationId = `INPUT-R${i}-${name.toUpperCase().replaceAll('-','_')}`;
  const old = priorByRequirement.get(requirementId);
  return { requirementId, requirementName:name, mandatory:true, sourceSpecification:'PIMATH_UNIFIED_INPUT_V1', currentState:old?.status === 'PASS' ? 'CERTIFIED' : 'AUDIT_PENDING', implementationPath:'src/modules/document-ingest/index.ts; src/modules/document-ingest/contracts.ts', verificationType:i === 0 ? 'DETERMINISTIC_AUDIT' : 'EXECUTABLE_TEST', verificationId, testPathOrAuditCommand:i === 0 ? 'npm run qa:unified-input:matrix' : 'npm run qa:unified-input', evidenceType:'SYNTHETIC_FIXTURE', evidenceSource:'repository audit', status:old?.status ?? 'NOT_TESTED', notes:old?.notes ?? 'Requires evidence-specific certification before final closure.' };
});
writeFileSync('docs/acceptance/PIMATH_UNIFIED_INPUT_V1_REQUIREMENT_MATRIX.json', JSON.stringify({version:'PIMATH_UNIFIED_INPUT_V1', rows}, null, 2)+'\n');
if (resultSnapshot !== undefined && readFileSync(resultPath, 'utf8') !== resultSnapshot) throw new Error('MATRIX_GENERATION_MUTATED_CERTIFICATION_RESULTS');
