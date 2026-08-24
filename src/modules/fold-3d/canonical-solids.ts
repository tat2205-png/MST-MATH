import type { MathEntity, MathMetadata, MathScene } from "../math-ir/index.js";
import type { SupportedFoldSolid, Vec3 } from "./types.js";

interface Definition { vertices: Record<string,Vec3>; faces: Array<{id:string;vertices:string[]}>; dimensions:Record<string,number>; }
const evidence = (kind:SupportedFoldSolid,origin:"source"|"visual_only"):MathMetadata => ({ sourceEvidence:[{id:`evidence-${kind}`,origin:origin==="source"?"user":"visual",sourceType:"user",sourceId:`canonical:${kind}`}],adapterMetadata:{foldSolidType:kind,canonicalOrigin:origin} });
const edgeId=(a:string,b:string)=>`edge-${[a,b].sort().join("-")}`;

function definition(kind:SupportedFoldSolid,input:Record<string,number>):Definition {
  if(kind==="cube"||kind==="rectangular_prism"){
    const a=kind==="cube"?(input.edge??1):(input.length??2),b=kind==="cube"?a:(input.width??3),c=kind==="cube"?a:(input.height??5);
    return {dimensions:{length:a,width:b,height:c},vertices:{A:[0,0,0],B:[a,0,0],C:[a,b,0],D:[0,b,0],E:[0,0,c],F:[a,0,c],G:[a,b,c],H:[0,b,c]},faces:[{id:"face-bottom",vertices:["A","D","C","B"]},{id:"face-top",vertices:["E","F","G","H"]},{id:"face-front",vertices:["A","B","F","E"]},{id:"face-right",vertices:["B","C","G","F"]},{id:"face-back",vertices:["C","D","H","G"]},{id:"face-left",vertices:["D","A","E","H"]}]};
  }
  if(kind==="triangular_prism"){
    const w=input.triangleWidth??2,h=input.triangleHeight??Math.sqrt(3),l=input.length??5;
    return {dimensions:{triangleWidth:w,triangleHeight:h,length:l},vertices:{A:[0,0,0],B:[w,0,0],C:[0,h,0],D:[0,0,l],E:[w,0,l],F:[0,h,l]},faces:[{id:"face-base",vertices:["A","C","B"]},{id:"face-top",vertices:["D","E","F"]},{id:"face-ab",vertices:["A","B","E","D"]},{id:"face-bc",vertices:["B","C","F","E"]},{id:"face-ca",vertices:["C","A","D","F"]}]};
  }
  if(kind==="tetrahedron"){
    const s=input.edge??2; return {dimensions:{edge:s},vertices:{A:[0,0,0],B:[s,0,0],C:[s/2,Math.sqrt(3)*s/2,0],D:[s/2,Math.sqrt(3)*s/6,Math.sqrt(2/3)*s]},faces:[{id:"face-base",vertices:["A","C","B"]},{id:"face-abd",vertices:["A","B","D"]},{id:"face-bcd",vertices:["B","C","D"]},{id:"face-cad",vertices:["C","A","D"]}]};
  }
  const a=input.base??2,h=input.height??3; return {dimensions:{base:a,height:h},vertices:{A:[0,0,0],B:[a,0,0],C:[a,a,0],D:[0,a,0],S:[a/2,a/2,h]},faces:[{id:"face-base",vertices:["A","D","C","B"]},{id:"face-abs",vertices:["A","B","S"]},{id:"face-bcs",vertices:["B","C","S"]},{id:"face-cds",vertices:["C","D","S"]},{id:"face-das",vertices:["D","A","S"]}]};
}

export function createCanonicalSolidScene(kind:SupportedFoldSolid,dimensions:Record<string,number>={},origin:"source"|"visual_only"="visual_only"):MathScene {
  const def=definition(kind,dimensions),metadata=evidence(kind,origin),entities:MathEntity[]=[];
  for(const [id,[x,y,z]] of Object.entries(def.vertices))entities.push({id:`vertex-${id}`,type:"point",label:id,layoutCoordinate:{dimension:"3d",x,y,z},metadata});
  const edges=new Map<string,[string,string]>(); for(const face of def.faces)for(let i=0;i<face.vertices.length;i++){const a=face.vertices[i],b=face.vertices[(i+1)%face.vertices.length];edges.set(edgeId(a,b),[a,b]);}
  for(const [id,[a,b]]of [...edges].sort(([a],[b])=>a.localeCompare(b)))entities.push({id,type:"segment",startPointId:`vertex-${a}`,endPointId:`vertex-${b}`,metadata});
  for(const face of def.faces){const vertexIds=face.vertices.map(id=>`vertex-${id}`); if(vertexIds.length===3)entities.push({id:face.id,type:"triangle",vertexIds:vertexIds as [string,string,string],metadata});else entities.push({id:face.id,type:"quadrilateral",vertexIds:vertexIds as [string,string,string,string],metadata});}
  const vertexIds=Object.keys(def.vertices).map(id=>`vertex-${id}`),edgeIds=[...edges.keys()].sort(),faceIds=def.faces.map(face=>face.id),solidId=`solid-${kind}`;
  if(kind==="triangular_prism")entities.push({id:solidId,type:"prism",prismKind:"triangular",baseFaceIds:["face-base","face-top"],faceIds,metadata});
  else if(kind==="square_pyramid")entities.push({id:solidId,type:"pyramid",pyramidKind:"square",apexPointId:"vertex-S",baseFaceId:"face-base",faceIds:faceIds.filter(id=>id!=="face-base"),metadata});
  else entities.push({id:solidId,type:"polyhedron",solidKind:kind,vertexIds,edgeIds,faceIds,metadata});
  return {id:`scene-${kind}`,name:`Canonical ${kind.replace(/_/g," ")}`,dimension:"3d",entities,constraints:[],metadata:{...metadata,adapterMetadata:{...metadata.adapterMetadata,dimensions:def.dimensions}},camera:{dimension:"3d",position:[8,7,6],target:[0,0,0],up:[0,0,1],projection:"perspective"}};
}

export const FOLD_FIXTURES={
  cube:createCanonicalSolidScene("cube"),
  rectangularPrism:createCanonicalSolidScene("rectangular_prism",{length:2,width:3,height:5},"source"),
  triangularPrism:createCanonicalSolidScene("triangular_prism"),
  tetrahedron:createCanonicalSolidScene("tetrahedron"),
  squarePyramid:createCanonicalSolidScene("square_pyramid"),
};
