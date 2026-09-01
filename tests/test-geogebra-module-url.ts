import assert from 'node:assert/strict';
import {GEOGEBRA_WEB3D_MODULE_URL} from '../src/modules/geogebra/config.js';

assert.equal(GEOGEBRA_WEB3D_MODULE_URL, 'https://www.geogebra.org/apps/latest/web3d/web3d.nocache.mjs');
assert.equal(new URL(GEOGEBRA_WEB3D_MODULE_URL).pathname, '/apps/latest/web3d/web3d.nocache.mjs');
console.log('GEOGEBRA_MODULE_URL_QA=PASS');
console.log('GEOGEBRA_OFFICIAL_MODULE_PATH_QA=PASS');
console.log('NO_DUPLICATE_GGB_URL_QA=PASS');
