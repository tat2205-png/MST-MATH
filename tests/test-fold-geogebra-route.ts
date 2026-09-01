import assert from 'node:assert/strict';
import {resolveFoldGeoGebraRoute} from '../src/routing/foldGeogebraRoute.js';

assert.equal(resolveFoldGeoGebraRoute('/fold-geogebra', true), 'geogebra');
assert.equal(resolveFoldGeoGebraRoute('/fold-geogebra', false), 'disabled');
assert.equal(resolveFoldGeoGebraRoute('/', true), 'home');
console.log('FOLD_GEOGEBRA_ROUTE_QA=PASS');
console.log('FEATURE_FLAG_RUNTIME_QA=PASS');
console.log('NO_SILENT_HOME_FALLBACK_QA=PASS');
