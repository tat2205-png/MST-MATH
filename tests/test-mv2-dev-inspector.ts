import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source=readFileSync(new URL("../src/components/dev/DynamicGeometryDevPanel.tsx",import.meta.url),"utf8");
for(const token of ["data-mv2-constraint-inspector","CONSTRAINT INSPECTOR","Degrees of freedom","Active constraints","data-semantic-update","analyzeDegreesOfFreedom","createRenderSnapshot"])assert.ok(source.includes(token),token);
assert.equal(/Math\.hypot|cross product|dot product/.test(source),false,"React inspector must not own mathematical truth");
console.log("MV_2_DEV_CONSTRAINT_INSPECTOR_TESTS=PASS");
