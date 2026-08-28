import assert from "node:assert/strict";
import { createMathScene, type MathConstraint, type MathEntity, type MathScene } from "../src/modules/math-ir/index.js";
import { SPECIALIZED_SOLVER_REGISTRY, adaptRenderSnapshot, analyzeDegreesOfFreedom, createRenderSnapshot, deserializeConstraintState, orchestrateConstraints, serializeConstraintState } from "../src/modules/constraint-orchestration/index.js";

const fact={origin:"given" as const};
const point=(id:string,x:number,y:number,z?:number):MathEntity=>({id,type:"point",semanticCoordinate:z===undefined?{dimension:"2d",x,y}:{dimension:"3d",x,y,z}});
const line=(id:string,a:string,b:string):MathEntity=>({id,type:"line",pointIds:[a,b]});
const constraint=(id:string,type:MathConstraint["type"],entityIds:string[],parameters?:Record<string,unknown>,mode:"LOCKED"|"WATCH"="LOCKED"):MathConstraint=>({id,type,entityIds,fact,mode,...(parameters?{parameters}:{})});
const scene=(entities:MathEntity[],constraints:MathConstraint[]=[],dimension:"2d"|"3d"="2d"):MathScene=>createMathScene({id:"mv2",name:"MV2",dimension,entities,constraints});
const xy=(s:MathScene,id:string)=>{const c=s.entities.find(x=>x.id===id)?.semanticCoordinate;assert.equal(c?.dimension,"2d");return[c.x,c.y] as [number,number];};
const close=(a:number,b:number,t=1e-8)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);

assert.equal(new Set(SPECIALIZED_SOLVER_REGISTRY.map(x=>x.solverId)).size,SPECIALIZED_SOLVER_REGISTRY.length);
assert.ok(SPECIALIZED_SOLVER_REGISTRY.every(x=>x.determinism==="DETERMINISTIC"&&typeof x.solverId==="string"));

const onLine=scene([point("A",0,0),point("B",4,0),point("P",1,2),line("d","A","B")],[constraint("c-line","point_on_line",["P","d"])]),lineResult=orchestrateConstraints(onLine,{objectId:"P",position:[2,3]});
assert.equal(lineResult.status,"PASS");close(xy(lineResult.updatedScene,"P")[1],0);assert.deepEqual(onLine.entities.find(x=>x.id==="P")?.semanticCoordinate,{dimension:"2d",x:1,y:2});
assert.equal(analyzeDegreesOfFreedom(onLine,"P").classification,"PATH_1D");

const circleEntity:MathEntity={id:"c",type:"circle",centerPointId:"O",metadata:{adapterMetadata:{construction:{kind:"CREATE_CIRCLE_CENTER_RADIUS",sourceIds:["O"],parameters:{radius:2}}}}};
const lineCircle=scene([point("A",-3,0),point("B",3,0),point("O",0,0),point("P",0,1),line("d","A","B"),circleEntity],[constraint("a","point_on_line",["P","d"]),constraint("b","point_on_circle",["P","c"])]),intersection=orchestrateConstraints(lineCircle,{objectId:"P",position:[1.8,.2]});
assert.equal(intersection.status,"PASS");const p=xy(intersection.updatedScene,"P");close(p[1],0);close(Math.hypot(...p),2);assert.equal(intersection.constraintResults[0].solverId,"LINE_CIRCLE_INTERSECTION_SOLVER");

const fixed=scene([point("O",0,0),point("P",2,0)],[constraint("r1","distance",["P","O"],{distance:1}),constraint("r2","distance",["P","O"],{distance:2})]),before=structuredClone(fixed),rejected=orchestrateConstraints(fixed,{objectId:"P",position:[3,0]});
assert.equal(rejected.status,"FAIL");assert.equal(rejected.issues[0].code,"TRANSACTION_REJECTED");assert.deepEqual(rejected.updatedScene,before);assert.equal(rejected.conflicts[0].classification,"CONTRADICTORY_LOCKED_CONSTRAINTS");

const plane:MathEntity={id:"plane",type:"plane",pointIds:["A","B","C"],metadata:{adapterMetadata:{construction:{kind:"CREATE_PLANE",sourceIds:["A","B","C"],parameters:{normal:[0,0,1],offset:0}}}}},scene3=scene([point("A",0,0,0),point("B",1,0,0),point("C",0,1,0),point("P",.2,.3,2),plane],[constraint("on-plane","point_on_plane",["P","plane"])],"3d"),projected=orchestrateConstraints(scene3,{objectId:"P",position:[2,3,7]});
assert.equal(projected.status,"PASS");const p3=projected.updatedScene.entities.find(x=>x.id==="P")?.semanticCoordinate;assert.equal(p3?.dimension,"3d");close(p3.z,0);assert.equal(analyzeDegreesOfFreedom(scene3,"P").positionalDof,2);

const snapshot=createRenderSnapshot(intersection.updatedScene),moved=structuredClone(intersection.updatedScene);(moved.entities.find(x=>x.id==="P")!.semanticCoordinate as {dimension:"2d";x:number;y:number}).x=-2;const update=createRenderSnapshot(moved,snapshot);assert.deepEqual(update.createdIds,[]);assert.deepEqual(update.updatedIds,["P"]);assert.ok(["three","geogebra","luadraw","manim","studio"].every(kind=>adaptRenderSnapshot(snapshot,kind as "three").objects.every(x=>x.metadata.rendererOwnsMath===false&&x.semanticObjectId.length>0)));
const encoded=serializeConstraintState({scene:intersection.updatedScene,solverIds:["LINE_CIRCLE_INTERSECTION_SOLVER"]}),decoded=deserializeConstraintState(encoded);assert.equal(JSON.stringify(decoded),encoded);assert.equal(encoded.includes("undefined"),false);

let state=123456789;for(let i=0;i<64;i++){state=(1664525*state+1013904223)>>>0;const x=state/2**32*20-10;state=(1664525*state+1013904223)>>>0;const y=state/2**32*20-10;const result=orchestrateConstraints(onLine,{objectId:"P",position:[x,y]});assert.equal(result.status,"PASS");close(xy(result.updatedScene,"P")[1],0);assert.ok(result.operationCount<onLine.entities.length+onLine.constraints.length+5);}
console.log("MV_2_CONSTRAINT_ORCHESTRATION_AND_RENDERER_ADAPTER_TESTS=PASS");
