import assert from 'node:assert/strict';
import fs from 'node:fs';

const main = fs.readFileSync('src/main.tsx', 'utf8');
assert.match(main, /window\.location\.pathname === '\/fold'/);
assert.match(main, /isFoldProduction \|\| isFoldViewer/);
assert.doesNotMatch(main, /isFoldProduction.*VITE_FOLD_3D_VIEWER_DEV/);
console.log('FOLD_G6_PRODUCTION_ROUTE_QA=PASS');
console.log('FOLD_G6_NO_DEV_FLAG_DEPENDENCY_QA=PASS');
