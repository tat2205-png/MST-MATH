import type { MathEntity, MathMetadata, MathScene } from "../math-ir/index.js";
import { cross3, distance3, dot3, normal3, normalize3, sub3 } from "./math.js";
import type { FoldBuildResult, NGonalBaseMode, Vec3 } from "./types.js";

export interface NGonalSolidOptions { kind: "prism" | "pyramid"; baseSides: number; baseMode?: NGonalBaseMode; baseVertices?: Vec3[]; radius?: number; height?: number; }
const issue=(code:string,message:string):FoldBuildResult<MathScene>=>({status:"FAIL",issues:[{code,severity:"error",path:"options",message}]});
const edgeId=(a:string,b:string)=>`edge-${[a,b].sort().join("-")}`;
const orient2=(a:[number,number],b:[number,number],c:[number,number])=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const edgesCross=(a:[number,number],b:[number,number],c:[number,number],d:[number,number])=>orient2(a,b,c)*orient2(a,b,d)<-1e-12&&orient2(c,d,a)*orient2(c,d,b)<-1e-12;

function validateCount(n:number){return Number.isFinite(n)&&Number.isInteger(n)&&n>=3&&n<=10;}
function validateExplicit(points:Vec3[],n:number):string|undefined{
  if(points.length!==n||points.some(point=>point.length!==3||point.some(value=>!Number.isFinite(value)||Math.abs(value)>1e6)))return "INVALID_BASE_POLYGON";
  if(new Set(points.map(point=>point.join(","))).size!==n||points.some((point,index)=>distance3(point,points[(index+1)%n])<1e-9))return "INVALID_BASE_POLYGON";
  const normal=normal3(points);if(Math.hypot(...normal)<1e-9)return "INVALID_BASE_POLYGON";const origin=points[0];if(points.some(point=>Math.abs(dot3(sub3(point,origin),normal))>1e-7))return "INVALID_BASE_POLYGON";
  const x=normalize3(sub3(points[1],origin)),y=normalize3(cross3(normal,x)),flat=points.map(point=>[dot3(sub3(point,origin),x),dot3(sub3(point,origin),y)] as [number,number]);
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){if(j===i+1||(i===0&&j===n-1))continue;if(edgesCross(flat[i],flat[(i+1)%n],flat[j],flat[(j+1)%n]))return "INVALID_BASE_POLYGON";}
  let sign=0;for(let i=0;i<n;i++){const turn=orient2(flat[i],flat[(i+1)%n],flat[(i+2)%n]);if(Math.abs(turn)<1e-9)return "INVALID_BASE_POLYGON";if(!sign)sign=Math.sign(turn);else if(Math.sign(turn)!==sign)return "NON_CONVEX_BASE_UNSUPPORTED";}
  return undefined;
}

export function createNGonalSolidScene(options:NGonalSolidOptions):FoldBuildResult<MathScene>{
  const n=options.baseSides;if(!validateCount(n))return issue("INVALID_BASE_SIDE_COUNT","baseSides must be an integer from 3 through 10.");
  const mode=options.baseMode??(options.baseVertices?"explicit_convex":"regular"),height=options.height??3;if(!Number.isFinite(height)||height<=0||height>1e6)return issue(options.kind==="prism"?"INVALID_PRISM_TOPOLOGY":"INVALID_PYRAMID_TOPOLOGY","Height must be finite and positive.");
  let base:Vec3[];
  if(mode==="explicit_convex"){
    if(!options.baseVertices)return issue("INVALID_BASE_POLYGON","Explicit convex mode requires ordered base vertices.");const invalid=validateExplicit(options.baseVertices,n);if(invalid)return issue(invalid,"Base vertices must form an ordered, simple, coplanar, strictly convex polygon.");base=options.baseVertices.map(point=>[...point]);
  }else{const radius=options.radius??2;if(!Number.isFinite(radius)||radius<=0||radius>1e6)return issue("INVALID_BASE_POLYGON","Regular base radius must be finite and positive.");base=Array.from({length:n},(_,i)=>[radius*Math.cos(2*Math.PI*i/n),radius*Math.sin(2*Math.PI*i/n),0] as Vec3);}
  const baseNormal=normal3(base),centroid=base.reduce<Vec3>((sum,p)=>[sum[0]+p[0]/n,sum[1]+p[1]/n,sum[2]+p[2]/n],[0,0,0]),offset=baseNormal.map(value=>value*height) as Vec3;
  const origin=mode==="regular"?"visual_only":"source",kind=options.kind==="prism"?"n_gonal_prism":"n_gonal_pyramid";
  const metadata:MathMetadata={sourceEvidence:[{id:`evidence-${kind}-${n}`,origin:origin==="source"?"user":"visual",sourceType:"user",sourceId:`canonical:${kind}:${n}`}],adapterMetadata:{foldSolidType:kind,canonicalOrigin:origin,dimensions:{baseSides:n,height,...(mode==="regular"?{radius:options.radius??2}:{})},baseSides:n,baseMode:mode}};
  const entities:MathEntity[]=[],vertices=new Map<string,Vec3>();base.forEach((point,i)=>vertices.set(`B${i}`,point));if(options.kind==="prism")base.forEach((point,i)=>vertices.set(`T${i}`,[point[0]+offset[0],point[1]+offset[1],point[2]+offset[2]]));else vertices.set("S",[centroid[0]+offset[0],centroid[1]+offset[1],centroid[2]+offset[2]]);
  for(const[id,[x,y,z]]of vertices)entities.push({id:`vertex-${id}`,type:"point",label:id,...(origin==="source"?{semanticCoordinate:{dimension:"3d" as const,x,y,z}}:{layoutCoordinate:{dimension:"3d" as const,x,y,z}}),metadata});
  const faces:Array<{id:string;vertices:string[]}>=[];
  faces.push({id:"face-bottom",vertices:Array.from({length:n},(_,i)=>`B${n-1-i}`)});
  if(options.kind==="prism"){faces.push({id:"face-top",vertices:Array.from({length:n},(_,i)=>`T${i}`)});for(let i=0;i<n;i++)faces.push({id:`face-side-${i}`,vertices:[`B${i}`,`B${(i+1)%n}`,`T${(i+1)%n}`,`T${i}`]});}
  else for(let i=0;i<n;i++)faces.push({id:`face-side-${i}`,vertices:[`B${i}`,`B${(i+1)%n}`,"S"]});
  const edges=new Map<string,[string,string]>();for(const face of faces)for(let i=0;i<face.vertices.length;i++){const a=face.vertices[i],b=face.vertices[(i+1)%face.vertices.length];edges.set(edgeId(a,b),[a,b]);}
  for(const[id,[a,b]]of [...edges].sort(([a],[b])=>a.localeCompare(b)))entities.push({id,type:"segment",startPointId:`vertex-${a}`,endPointId:`vertex-${b}`,metadata});
  for(const face of faces){const vertexIds=face.vertices.map(id=>`vertex-${id}`);if(vertexIds.length===3)entities.push({id:face.id,type:"triangle",vertexIds:vertexIds as [string,string,string],metadata});else if(vertexIds.length===4)entities.push({id:face.id,type:"quadrilateral",vertexIds:vertexIds as [string,string,string,string],metadata});else entities.push({id:face.id,type:"polygon",vertexIds,metadata});}
  const solidId=`solid-${kind}-${n}`;if(options.kind==="prism")entities.push({id:solidId,type:"prism",prismKind:"general",baseSides:n,baseMode:mode,baseFaceIds:["face-bottom","face-top"],faceIds:faces.map(face=>face.id),metadata});else entities.push({id:solidId,type:"pyramid",pyramidKind:"general",baseSides:n,baseMode:mode,apexPointId:"vertex-S",baseFaceId:"face-bottom",faceIds:faces.filter(face=>face.id!=="face-bottom").map(face=>face.id),metadata});
  return{status:"PASS",value:{id:`scene-${kind}-${n}`,name:`Canonical ${n}-gonal ${options.kind}`,dimension:"3d",entities,constraints:[],metadata,camera:{dimension:"3d",position:[8,7,6],target:[0,0,0],up:[0,0,1],projection:"perspective"}},issues:[]};
}
