import type { Vec2 } from "../fold-3d/types.js";
import type { PatternCrease, PatternIssue, PatternRegion, PatternResult } from "./types.js";
const EPS=1e-8;
const side=(p:Vec2,a:Vec2,b:Vec2)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const intersection=(p:Vec2,q:Vec2,a:Vec2,b:Vec2):Vec2=>{const sp=side(p,a,b),sq=side(q,a,b),t=sp/(sp-sq);return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];};
const clip=(polygon:Vec2[],a:Vec2,b:Vec2,keepPositive:boolean)=>{const out:Vec2[]=[];for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],pin=(keepPositive?side(p,a,b):-side(p,a,b))>=-EPS,qin=(keepPositive?side(q,a,b):-side(q,a,b))>=-EPS;if(pin)out.push(p);if(pin!==qin)out.push(intersection(p,q,a,b));}return out;};
const area=(p:Vec2[])=>Math.abs(p.reduce((sum,a,i)=>sum+a[0]*p[(i+1)%p.length][1]-a[1]*p[(i+1)%p.length][0],0))/2;
const centroid=(p:Vec2[]):Vec2=>[p.reduce((s,x)=>s+x[0],0)/p.length,p.reduce((s,x)=>s+x[1],0)/p.length];

/** Deterministically partitions a convex polygon by finite straight creases that cross it. */
export function partitionConvexSheet(vertices:Vec2[],creases:PatternCrease[],idPrefix="region"):PatternResult<PatternRegion[]>{if(vertices.length<3)return {status:"FAIL",issues:[{code:"INVALID_POLYGON",severity:"error",path:"vertices",message:"A sheet requires at least three vertices"}]};let cells=[vertices];for(const crease of creases){const[a,b]=crease.points,next:Vec2[][]=[];for(const cell of cells){const positive=clip(cell,a,b,true),negative=clip(cell,a,b,false);if(positive.length>=3&&negative.length>=3&&area(positive)>EPS&&area(negative)>EPS)next.push(positive,negative);else next.push(cell);}cells=next;}cells.sort((a,b)=>{const ca=centroid(a),cb=centroid(b);return ca[0]-cb[0]||ca[1]-cb[1];});const issues:PatternIssue[]=[];return {status:"PASS",issues,value:cells.map((cell,index)=>({id:`${idPrefix}-${index+1}`,vertices:cell,role:"PANEL"}))};}
