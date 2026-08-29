import assert from "node:assert/strict";
import { buildPatternTopology, computePatternFoldState, createCircleWithInnerSquareFixture, createPatternFoldScene, partitionConvexSheet, PATTERN_FOLD_FIXTURES, toPatternManimBoundary, toPatternSvg, toPatternTikz, updatePatternFoldScene, validatePatternSheet } from "../src/modules/pattern-fold/index.js";
import { createPatternThreeMapping } from "../src/modules/pattern-fold/three-adapter.js";
import fs from "node:fs";
const near=(a:number,b:number,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
for(const id of ["P01","P02","P03","P04","P05","P06","P07","P08"]){const result=createPatternFoldScene(PATTERN_FOLD_FIXTURES[id],0);assert.equal(result.status,"PASS",`${id}: ${JSON.stringify(result.issues)}`);assert.ok(result.value);}
assert.equal(buildPatternTopology(PATTERN_FOLD_FIXTURES.P09).issues.some(x=>x.code==="DETACHED_FOLD_COMPONENT"),true);
assert.equal(buildPatternTopology(PATTERN_FOLD_FIXTURES.P10).issues.some(x=>x.code==="CUT_CREASE_CONFLICT"),true);
assert.equal(validatePatternSheet(createCircleWithInnerSquareFixture()).length,0);
const p01=createPatternFoldScene(PATTERN_FOLD_FIXTURES.P01,1).value!;const right=p01.state.regionTransforms.find(x=>x.regionId==="p01-right")!;near(Math.abs(right.transformedVertices[1].position3D[2]),2);
const flat=updatePatternFoldScene(p01,0,0).value!,folded=updatePatternFoldScene(p01,0,1).value!,unfolded=updatePatternFoldScene(folded,0,0).value!;assert.deepEqual(unfolded.state.regionTransforms,flat.state.regionTransforms);
const p02=createPatternFoldScene(PATTERN_FOLD_FIXTURES.P02,0).value!;const step=computePatternFoldState(p02.topology,p02.sequence,1,.5).value!;near(Math.abs(step.creaseAngles["p02-c1"]),Math.PI/2);near(Math.abs(step.creaseAngles["p02-c2"]),Math.PI/4);
assert.equal(partitionConvexSheet([[0,0],[6,0],[6,2],[0,2]],PATTERN_FOLD_FIXTURES.P02.creases,"panel").value!.length,3);
assert.equal(p01.topology.holes.length,0);assert.equal(createPatternFoldScene(PATTERN_FOLD_FIXTURES.P05).value!.topology.holes.length,1);assert.equal(createPatternFoldScene(PATTERN_FOLD_FIXTURES.P05).value!.topology.markedShapes.length,1);
assert.match(toPatternSvg(p01).output!,/data-kind="crease"/);assert.match(toPatternTikz(p01).output!,/dashed/);assert.equal(toPatternManimBoundary(p01).status,"PARTIAL");
const mapping=createPatternThreeMapping(p01);assert.equal(mapping.regions.size,2);mapping.apply(flat);mapping.dispose();
const viewer=fs.readFileSync("src/components/dev/Fold3DViewer.tsx","utf8"),panel=fs.readFileSync("src/components/dev/PatternFoldViewerPanel.tsx","utf8");assert.match(viewer,/Pattern mode/);assert.match(panel,/Pattern fixture/);assert.match(panel,/Cuts/);assert.match(panel,/Creases/);
console.log("PASS pattern fold v1: fixtures, validation, topology, sequence, rigid transforms, reversibility, adapters");
