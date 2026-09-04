#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportOnly = process.argv.includes('--report-only');
const jsonOnly = process.argv.includes('--json');
const strict = process.argv.includes('--strict');

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.next',
  '.vite',
  'render_output',
  'tmp',
  'temp',
]);

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.jsonl', '.md', '.txt',
  '.yml', '.yaml', '.toml', '.ini', '.css', '.scss', '.html', '.xml', '.tex', '.py',
  '.ps1', '.sh', '.bat', '.cmd', '.env', '.gitignore', '.gitattributes', '.csv', '.svg',
]);

const HISTORICAL_PREFIXES = [
  'docs/acceptance/',
  'docs/releases/',
  'docs/release/',
  'field-validation/',
  'agency/evidence/',
];

const COMPATIBILITY_EXACT_PATHS = new Set([
  'docs/migrations/MST_MATH_BRAND_MIGRATION_V1.md',
  'docs/project/MST_MATH_PROJECT_MASTER_MAP.md',
  'project-state/MST-MATH-PROJECT-STATE.json',
  'registry/brand-root.json',
  'registry/output-profiles.json',
  'registry/standards.json',
  'registry/locked-decisions.json',
  'src/config/naMathBrandRoot.ts',
  'scripts/audit-mst-math-brand.mjs',
]);

const COMPATIBILITY_PREFIXES = [
  'registry/pimath-',
  'standards/PIMATH_',
  'assets/pimath-icons/',
];

const CONTENT_PATTERNS = [
  ['PiMath', /PiMath/g],
  ['PIMATH', /PIMATH/g],
  ['pimath', /pimath/g],
  ['PiDNA', /PiDNA/g],
];

function normalize(rel) {
  return rel.split(path.sep).join('/');
}

function isHistorical(rel) {
  const n = normalize(rel);
  return HISTORICAL_PREFIXES.some((prefix) => n.startsWith(prefix));
}

function isCompatibility(rel) {
  const n = normalize(rel);
  return COMPATIBILITY_EXACT_PATHS.has(n) || COMPATIBILITY_PREFIXES.some((prefix) => n.startsWith(prefix));
}

function classify(rel, kind) {
  if (isHistorical(rel)) return kind === 'path' ? 'LEGACY_HISTORY_PATH' : 'LEGACY_HISTORY_CONTENT';
  if (isCompatibility(rel)) return kind === 'path' ? 'COMPATIBILITY_PATH' : 'COMPATIBILITY_CONTENT';
  return kind === 'path' ? 'ACTIVE_PATH_RENAME_REQUIRED' : 'ACTIVE_CONTENT_RENAME_REQUIRED';
}

function shouldRead(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || base === 'Dockerfile' || base === 'Makefile';
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function lineNumber(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

const files = walk(root);
const findings = [];
const pathFindings = [];

for (const file of files) {
  const rel = normalize(path.relative(root, file));
  if (/pimath/i.test(rel) || /pidna/i.test(rel)) {
    pathFindings.push({ path: rel, classification: classify(rel, 'path') });
  }

  if (!shouldRead(file)) continue;

  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const [token, regex] of CONTENT_PATTERNS) {
    regex.lastIndex = 0;
    for (let match = regex.exec(text); match; match = regex.exec(text)) {
      findings.push({
        path: rel,
        line: lineNumber(text, match.index),
        token,
        classification: classify(rel, 'content'),
      });
    }
  }
}

const byClass = (rows, name) => rows.filter((x) => x.classification === name);
const activeContent = byClass(findings, 'ACTIVE_CONTENT_RENAME_REQUIRED');
const activePaths = byClass(pathFindings, 'ACTIVE_PATH_RENAME_REQUIRED');
const compatibilityContent = byClass(findings, 'COMPATIBILITY_CONTENT');
const compatibilityPaths = byClass(pathFindings, 'COMPATIBILITY_PATH');
const legacyContent = byClass(findings, 'LEGACY_HISTORY_CONTENT');
const legacyPaths = byClass(pathFindings, 'LEGACY_HISTORY_PATH');

const activeViolationCount = activeContent.length + activePaths.length;
const compatibilityCount = compatibilityContent.length + compatibilityPaths.length;
const strictViolationCount = activeViolationCount + compatibilityCount;

const summary = {
  root,
  mode: strict ? 'STRICT_SUCCESSOR' : 'MIGRATION_COMPATIBILITY',
  scannedFileCount: files.length,
  activeContentOccurrenceCount: activeContent.length,
  activePathCount: activePaths.length,
  compatibilityContentOccurrenceCount: compatibilityContent.length,
  compatibilityPathCount: compatibilityPaths.length,
  legacyHistoryContentOccurrenceCount: legacyContent.length,
  legacyHistoryPathCount: legacyPaths.length,
  status: (strict ? strictViolationCount : activeViolationCount) === 0 ? 'PASS' : 'RENAME_REQUIRED',
};

const payload = { summary, activeContent, activePaths, compatibilityContent, compatibilityPaths, legacyContent, legacyPaths };

if (jsonOnly) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
} else {
  console.log('=== MST-MATH BRAND MIGRATION AUDIT ===');
  console.log(JSON.stringify(summary, null, 2));

  const printSection = (title, rows, limit = 200) => {
    console.log(`\n--- ${title} (${rows.length}) ---`);
    for (const row of rows.slice(0, limit)) {
      const suffix = row.line ? `:${row.line}` : '';
      console.log(`${row.path}${suffix}${row.token ? ` [${row.token}]` : ''}`);
    }
    if (rows.length > limit) console.log(`... ${rows.length - limit} more`);
  };

  printSection('ACTIVE CONTENT RENAME REQUIRED', activeContent);
  printSection('ACTIVE PATH RENAME REQUIRED', activePaths);
  printSection('COMPATIBILITY CONTENT', compatibilityContent, 100);
  printSection('COMPATIBILITY PATHS', compatibilityPaths, 100);
  printSection('LEGACY HISTORY CONTENT', legacyContent, 50);
  printSection('LEGACY HISTORY PATHS', legacyPaths, 50);
}

if (!reportOnly && summary.status !== 'PASS') process.exitCode = 1;
