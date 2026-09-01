import assert from "node:assert/strict";
import { addConstructionCircle, addConstructionPoint, addConstructionSegment, createPlanarPattern } from "../src/modules/pattern-fold/index.js";
import { createMidpoint, createPointOnCircle, deleteDynamicObject, describeDynamicGeometry, evaluateSelection, moveDynamicPoint, normalizeDynamicGeometry, renameDynamicObject, validateDependencyGraph } from "../src/modules/dynamic-geometry/index.js";

let sheet=createPlanarPattern({kind:"square",side:10}).value!;
sheet=normalizeDynamicGeometry(addConstructionPoint(sheet,[-2,0]).value!);
sheet=normalizeDynamicGeometry(addConstructionPoint(sheet,[2,0]).value!);
assert.deepEqual(sheet.construction!.points.map(p=>p.label),["A","B"],"manual points auto-label deterministically");
sheet=addConstructionSegment(sheet,["point-1","point-2"]).value!;
sheet=createMidpoint(sheet,"point-1","point-2").value!;
const midpoint=sheet.construction!.points.find(p=>p.constructionKind==="MIDPOINT")!;
assert.equal(midpoint.label,"C");assert.deepEqual(midpoint.position,[0,0]);assert.equal(midpoint.freedom,"DEPENDENT");
const beforeId=midpoint.id,renamed=renameDynamicObject(sheet,midpoint.id,"M");assert.equal(renamed.status,"PASS");sheet=renamed.value!;assert.equal(sheet.construction!.points.find(p=>p.id===beforeId)?.label,"M");assert.deepEqual(sheet.construction!.segments[0].pointIds,["point-1","point-2"]);
assert.equal(renameDynamicObject(sheet,"point-2","M").issues[0].code,"DUPLICATE_LABEL");
sheet=moveDynamicPoint(sheet,"point-1",[-4,2]).value!;assert.deepEqual(sheet.construction!.points.find(p=>p.id===midpoint.id)?.position,[-1,1],"midpoint propagates after parent drag");assert.equal(moveDynamicPoint(sheet,midpoint.id,[4,4]).issues[0].code,"DEPENDENT_OBJECT_NOT_DIRECTLY_DRAGGABLE");
const objects=describeDynamicGeometry(sheet),a=objects.find(x=>x.id==="point-1")!,m=objects.find(x=>x.id===midpoint.id)!;assert.ok(a.children.includes("segment-1")&&a.children.includes(midpoint.id));assert.deepEqual(m.parents,["point-1","point-2"]);assert.equal(validateDependencyGraph(sheet).status,"PASS");
const pointSelection=evaluateSelection(sheet,["point-1","point-2"]);assert.ok(pointSelection.validCommands.includes("CREATE_SEGMENT")&&pointSelection.validCommands.includes("FOLD_POINT_TO_POINT"));assert.equal(evaluateSelection(sheet,["segment-1"]).validCommands.includes("SET_CUT"),true);assert.equal(evaluateSelection(sheet,["point-1"]).invalidCommandReasons.SET_CUT,"Select a segment.");
assert.equal(deleteDynamicObject(sheet,"point-1").issues[0].code,"DELETE_HAS_DEPENDENTS");const deleted=deleteDynamicObject(sheet,"point-1",true).value!;assert.equal(deleted.construction!.points.some(p=>p.id==="point-1"),false);assert.equal(deleted.construction!.segments.length,0);assert.equal(deleted.construction!.points.some(p=>p.id===midpoint.id),false);

let circleSheet=createPlanarPattern({kind:"square",side:12}).value!;circleSheet=normalizeDynamicGeometry(addConstructionPoint(circleSheet,[0,0]).value!);circleSheet=addConstructionCircle(circleSheet,"point-1",3).value!;circleSheet=createPointOnCircle(circleSheet,"circle-1",[2,2]).value!;const pathPoint=circleSheet.construction!.points.at(-1)!;assert.equal(pathPoint.freedom,"PATH_BOUND");circleSheet=moveDynamicPoint(circleSheet,pathPoint.id,[10,0]).value!;assert.ok(Math.abs(circleSheet.construction!.points.at(-1)!.position[0]-3)<1e-9);assert.ok(Math.abs(circleSheet.construction!.points.at(-1)!.position[1])<1e-9);

const cyclic=structuredClone(sheet);cyclic.construction!.points.find(p=>p.id==="point-1")!.parentIds=[midpoint.id];assert.equal(validateDependencyGraph(cyclic).issues[0].code,"DEPENDENCY_CYCLE");
console.log("NA_MATH_DYNAMIC_GEOMETRY_UX_V1_CORE_TESTS=PASS");
