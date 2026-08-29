import assert from "node:assert/strict";
import { buildFoldTopology, computeFoldState, createFoldScene, createNGonalSolidScene, generateCanonicalNet, generateRouteStrip, updateFoldScene } from "../src/modules/fold-3d/index.js";
import { createFoldThreeMapping } from "../src/modules/fold-3d/three-viewer-adapter.js";

const distance=(a:number[],b:number[])=>Math.hypot(...a.map((value,index)=>value-b[index]));
for(const kind of ["prism","pyramid"] as const)for(let n=3;n<=10;n++){
  const sourceResult=createNGonalSolidScene({kind,baseSides:n,height:4,radius:2.5});assert.equal(sourceResult.status,"PASS");const source=sourceResult.value!;
  const topologyResult=buildFoldTopology(source);assert.equal(topologyResult.status,"PASS",`${kind}-${n}: ${JSON.stringify(topologyResult.issues)}`);const topology=topologyResult.value!;
  assert.deepEqual([topology.vertices.length,topology.edges.length,topology.faces.length],kind==="prism"?[2*n,3*n,n+2]:[n+1,2*n,n+1]);assert.equal(topology.vertices.length-topology.edges.length+topology.faces.length,2);assert.equal(topology.edges.every(edge=>edge.incidentFaceIds.length===2),true);assert.equal(topology.metadata.baseSides,n);assert.equal(topology.metadata.dimensions.radius,2.5);assert.equal(topology.metadata.dimensions.height,4);
  const netResult=generateCanonicalNet(topology);assert.equal(netResult.status,"PASS",`${kind}-${n}: ${JSON.stringify(netResult.issues)}`);const net=netResult.value!;assert.equal(net.faces.length,topology.faces.length);assert.equal(net.hinges.length,topology.faces.length-1);
  const expectedAdjacency=kind==="prism"?4:3;for(let i=0;i<n;i++)assert.equal(topology.adjacency.filter(item=>item.faceIds.includes(`fold-face-side-${i}`)).length,expectedAdjacency);
  if([3,4,5,6,8,10].includes(n))for(const progress of [0,0.5,1]){const state=computeFoldState(net,progress).value!;assert.ok(state);for(const face of state.faceTransforms){const flat=net.faces.find(item=>item.faceId===face.faceId)!;for(let a=0;a<flat.vertices.length;a++)for(let b=a+1;b<flat.vertices.length;b++)assert.ok(Math.abs(distance(flat.vertices[a].position,flat.vertices[b].position)-distance(face.transformedVertices[a].position,face.transformedVertices[b].position))<1e-7);}}
  const folded=computeFoldState(net,1).value!;for(const vertex of topology.vertices){const occurrences=folded.faceTransforms.flatMap(face=>face.transformedVertices.filter(item=>item.vertexId===vertex.id).map(item=>item.position));for(const occurrence of occurrences.slice(1))assert.ok(distance(occurrences[0],occurrence)<1e-6,`${kind}-${n}:${vertex.id}`);}
  const flatScene=createFoldScene(source,0).value!;assert.deepEqual(updateFoldScene(updateFoldScene(flatScene,1).value!,0).value!.state,flatScene.state);
  const mapping=createFoldThreeMapping(flatScene);mapping.apply(updateFoldScene(flatScene,1).value!);assert.equal(mapping.faces.size,topology.faces.length);mapping.dispose();
  if(kind==="prism"){const route=Array.from({length:n},(_,i)=>`face-side-${i}`);route.push("face-top");const strip=generateRouteStrip(topology,route);assert.equal(strip.status,"PASS",`${kind}-${n}: ${JSON.stringify(strip.issues)}`);assert.equal(strip.value!.hinges.length,route.length-1);}
}

const explicit:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[0,0,2],[3,0,2],[4,2,2],[1.5,4,2],[-1,2,2]];
for(const kind of ["prism","pyramid"] as const){const scene=createNGonalSolidScene({kind,baseSides:5,baseMode:"explicit_convex",baseVertices:explicit,height:7});assert.equal(scene.status,"PASS");const topology=buildFoldTopology(scene.value!).value!;assert.equal(topology.metadata.origin,"source");assert.equal(topology.metadata.dimensions.height,7);}
for(const baseSides of [2,11,3.5,Number.NaN,Number.POSITIVE_INFINITY])assert.ok(createNGonalSolidScene({kind:"prism",baseSides}).issues.some(issue=>issue.code==="INVALID_BASE_SIDE_COUNT"));
assert.ok(createNGonalSolidScene({kind:"pyramid",baseSides:4,baseMode:"explicit_convex",baseVertices:[[0,0,0],[2,0,0],[1,0.5,0],[0,2,0]]}).issues.some(issue=>issue.code==="NON_CONVEX_BASE_UNSUPPORTED"));
assert.ok(createNGonalSolidScene({kind:"prism",baseSides:4,baseMode:"explicit_convex",baseVertices:[[0,0,0],[2,0,0],[2,2,1],[0,2,0]]}).issues.some(issue=>issue.code==="INVALID_BASE_POLYGON"));
assert.ok(createNGonalSolidScene({kind:"prism",baseSides:5,baseMode:"explicit_convex",baseVertices:[[0,3,0],[2,-3,0],[-3,1,0],[3,1,0],[-2,-3,0]]}).issues.some(issue=>issue.code==="INVALID_BASE_POLYGON"));
const genericTriangle=createNGonalSolidScene({kind:"prism",baseSides:3}).value!,genericSquarePyramid=createNGonalSolidScene({kind:"pyramid",baseSides:4}).value!;assert.equal(buildFoldTopology(genericTriangle).value!.solidType,"n_gonal_prism");assert.equal(buildFoldTopology(genericSquarePyramid).value!.solidType,"n_gonal_pyramid");

console.log("N_GONAL_FOLD_V1_TESTS=PASS");
