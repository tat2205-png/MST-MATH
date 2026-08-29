import assert from "node:assert/strict";
import { createDevelopableFoldScene, createDevelopableManimBoundary, createDevelopableThreeMapping, developableNetToSvg, developableNetToTikz, developmentPointToSurface, mapDevelopablePoint, surfacePointToDevelopment, updateDevelopableFoldScene, validateDevelopableFoldScene } from "../src/modules/fold-3d/index.js";

const close=(actual:number,expected:number,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
const cylinder=createDevelopableFoldScene({solidType:"cylinder",radius:2,height:5}).value!;const cylinderRectangle=cylinder.net.primitives.find(item=>item.type==="rectangle")!;close(cylinderRectangle.width,4*Math.PI);close(cylinderRectangle.height,5);close(cylinder.dimensions.circumference,4*Math.PI);
const cone=createDevelopableFoldScene({solidType:"cone",radius:3,height:4}).value!;close(cone.dimensions.slantHeight,5);close(cone.dimensions.sectorAngleDegrees,216);close(cone.dimensions.sectorRadius*cone.dimensions.sectorAngleRadians,6*Math.PI);
const frustum=createDevelopableFoldScene({solidType:"conical_frustum",largeRadius:4,smallRadius:2,height:3}).value!;close(frustum.dimensions.slantHeight,Math.sqrt(13));close(frustum.dimensions.outerRadius*frustum.dimensions.sectorAngleRadians,8*Math.PI);close(frustum.dimensions.innerRadius*frustum.dimensions.sectorAngleRadians,4*Math.PI);close(frustum.dimensions.outerRadius-frustum.dimensions.innerRadius,Math.sqrt(13));

for(const scene of [cylinder,cone,frustum]){
  const longitudinal=scene.solidType==="cylinder"?2.5:scene.solidType==="cone"?scene.dimensions.slantHeight*.7:(scene.dimensions.innerRadius+scene.dimensions.outerRadius)/2,point={surfaceId:scene.lateralSurfaceId,theta:4.2,longitudinal};const development=surfacePointToDevelopment(scene,point).value!,inverse=developmentPointToSurface(scene,development).value!;close(inverse.theta,point.theta);close(inverse.longitudinal,point.longitudinal);
  const flat=mapDevelopablePoint(scene,point).value!;for(const progress of [0,.25,.5,.75,1]){const next=updateDevelopableFoldScene(scene,progress).value!;assert.ok(mapDevelopablePoint(next,point).value!.every(Number.isFinite));}const returned=mapDevelopablePoint(updateDevelopableFoldScene(updateDevelopableFoldScene(scene,1).value!,0).value!,point).value!;assert.deepEqual(returned,flat);
  assert.match(developableNetToSvg(scene).output,/^<svg/);assert.match(developableNetToTikz(scene).output,/\\begin\{tikzpicture\}/);assert.equal(createDevelopableManimBoundary(scene).status,"PARTIAL");const mapping=createDevelopableThreeMapping(scene);mapping.apply(updateDevelopableFoldScene(scene,1).value!);assert.equal(mapping.components.has(scene.lateralSurfaceId),true);assert.equal((mapping.components.get(scene.lateralSurfaceId) as any).userData.visualTessellationOnly,true);mapping.dispose();
  assert.deepEqual(JSON.parse(JSON.stringify(scene)),scene);
}
const cylinderFromFrustum=createDevelopableFoldScene({solidType:"conical_frustum",largeRadius:2,smallRadius:2,height:5}).value!;assert.equal(cylinderFromFrustum.solidType,"cylinder");assert.equal(cylinderFromFrustum.metadata.normalizedFrom,"conical_frustum");
assert.ok(createDevelopableFoldScene({solidType:"conical_frustum",largeRadius:2,smallRadius:3,height:4}).issues.some(issue=>issue.code==="INVALID_FRUSTUM_RADII"));
for(const value of [0,-1,Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY]){assert.equal(createDevelopableFoldScene({solidType:"cylinder",radius:value,height:2}).status,"FAIL");assert.equal(createDevelopableFoldScene({solidType:"cone",radius:2,height:value}).status,"FAIL");}
for(const progress of [-1,2,Number.NaN,Number.POSITIVE_INFINITY])assert.ok(updateDevelopableFoldScene(cylinder,progress).issues.some(issue=>issue.code==="INVALID_PROGRESS"));
assert.ok(surfacePointToDevelopment(cylinder,{surfaceId:"surface-lateral",theta:Number.NaN,longitudinal:0}).issues.some(issue=>issue.code==="NAN_SURFACE_POINT"));
assert.ok(surfacePointToDevelopment(cylinder,{surfaceId:"surface-lateral",theta:Number.POSITIVE_INFINITY,longitudinal:0}).issues.some(issue=>issue.code==="INFINITE_SURFACE_POINT"));
const badAttachment=structuredClone(cylinder);badAttachment.attachments[0].componentId="missing";assert.ok(validateDevelopableFoldScene(badAttachment).issues.some(issue=>issue.code==="INVALID_SURFACE_ATTACHMENT"));assert.throws(()=>createDevelopableThreeMapping(badAttachment),/INVALID_DEVELOPABLE_FOLD_SCENE/);
const badArc=structuredClone(cone);badArc.dimensions.sectorAngleRadians=1;assert.ok(validateDevelopableFoldScene(badArc).issues.some(issue=>issue.code==="INVALID_ARC_LENGTH"));

console.log("DEVELOPABLE_SURFACES_V1_TESTS=PASS");
