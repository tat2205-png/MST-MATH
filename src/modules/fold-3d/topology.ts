import type { MathEntity, MathScene } from "../math-ir/index.js";
import { normalizeGeometryScene } from "../geometry-engine/index.js";
import { normal3 } from "./math.js";
import type { FoldBuildResult, FoldEdge, FoldFace, FoldTopology, FoldVertex, SupportedFoldSolid, Vec3 } from "./types.js";
import { validateFoldTopology } from "./validation.js";

const edgeKey=(a:string,b:string)=>[a,b].sort().join("|");
function solidType(entity:MathEntity):SupportedFoldSolid|undefined{
  if(entity.type==="polyhedron"&&["cube","rectangular_prism","tetrahedron"].includes(entity.solidKind??""))return entity.solidKind as SupportedFoldSolid;
  if(entity.type==="prism"&&entity.prismKind==="triangular")return "triangular_prism";
  if(entity.type==="prism"&&entity.prismKind==="general"&&Number.isInteger(entity.baseSides)&&entity.baseSides!>=3&&entity.baseSides!<=10)return "n_gonal_prism";
  if(entity.type==="pyramid"&&entity.pyramidKind==="square")return "square_pyramid";
  if(entity.type==="pyramid"&&entity.pyramidKind==="general"&&Number.isInteger(entity.baseSides)&&entity.baseSides!>=3&&entity.baseSides!<=10)return "n_gonal_pyramid";
  return undefined;
}
const isGeneralSolid=(entity:MathEntity)=>entity.type==="prism"?entity.prismKind==="general":entity.type==="pyramid"&&entity.pyramidKind==="general";

export function buildFoldTopology(scene:MathScene,solidEntityId?:string):FoldBuildResult<FoldTopology>{
  const normalized=normalizeGeometryScene(scene); if(!normalized.scene)return{status:"FAIL",issues:normalized.issues.map(issue=>({...issue,code:issue.code==="INVALID_SOLID"?"INVALID_SOLID":issue.code}))};
  const solid=scene.entities.find(entity=>entity.id===solidEntityId)||scene.entities.find(entity=>solidType(entity))||scene.entities.find(isGeneralSolid); const type=solid&&solidType(solid);
  if(solid&&isGeneralSolid(solid)&&(solid.type==="prism"||solid.type==="pyramid")&&(!Number.isFinite(solid.baseSides)||!Number.isInteger(solid.baseSides)||solid.baseSides!<3||solid.baseSides!>10))return{status:"FAIL",issues:[{code:"INVALID_BASE_SIDE_COUNT",severity:"error",path:`scene.entities.${solid.id}.baseSides`,message:"baseSides must be an integer from 3 through 10."}]};
  if(!solid||!type)return{status:"UNSUPPORTED",issues:[{code:"UNSUPPORTED_SOLID",severity:"error",path:"scene.entities",message:"Scene has no supported fold solid."}]};
  const coordinates=new Map(normalized.scene.renderCoordinates.map(item=>[item.entityId,item.coordinate]));
  const sourceVertexIds=solid.type==="polyhedron"?solid.vertexIds:scene.entities.filter(entity=>entity.type==="point").map(entity=>entity.id);
  const invalidVertexId=sourceVertexIds.find(id=>coordinates.get(id)?.dimension!=="3d");
  if(invalidVertexId)return{status:"FAIL",issues:[{code:"INVALID_SOLID",severity:"error",path:`vertices.${invalidVertexId}`,message:"Fold vertices require valid 3D coordinates."}]};
  const vertices:FoldVertex[]=sourceVertexIds.map(id=>{const coordinate=coordinates.get(id)! as Extract<typeof coordinates extends Map<string,infer C>?C:never,{dimension:"3d"}>;return{id:`fold-${id}`,sourceEntityId:id,foldedPosition:[coordinate.x,coordinate.y,coordinate.z],origin:normalized.scene!.renderCoordinates.find(item=>item.entityId===id)?.origin==="semantic"?"source":"visual_only"};});
  const vertexBySource=new Map(vertices.map(vertex=>[vertex.sourceEntityId,vertex])); const position=(id:string)=>vertexBySource.get(id)!.foldedPosition;
  const faceEntities=scene.entities.filter((entity):entity is Extract<MathEntity,{type:"polygon"|"triangle"|"quadrilateral"}>=>["polygon","triangle","quadrilateral"].includes(entity.type));
  let sourceFaceIds:string[];
  if(solid.type==="polyhedron"||solid.type==="prism")sourceFaceIds=solid.faceIds;
  else if(solid.type==="pyramid")sourceFaceIds=[solid.baseFaceId,...(solid.faceIds??[])];
  else return{status:"UNSUPPORTED",issues:[{code:"UNSUPPORTED_SOLID",severity:"error",path:`scene.entities.${solid.id}`,message:"Entity is not a supported fold solid."}]};
  const selected=sourceFaceIds.map(id=>faceEntities.find(face=>face.id===id)).filter((face):face is typeof faceEntities[number]=>Boolean(face));
  if(selected.length!==new Set(sourceFaceIds).size)return{status:"FAIL",issues:[{code:"MISSING_FACE",severity:"error",path:"solid.faceIds",message:"Solid references a missing face."}]};
  const sourceEdges=scene.entities.filter((entity):entity is Extract<MathEntity,{type:"segment"}>=>entity.type==="segment"); const edgeByKey=new Map(sourceEdges.map(edge=>[edgeKey(edge.startPointId,edge.endPointId),edge]));
  const incident=new Map<string,string[]>(); const faces:FoldFace[]=[];
  for(const face of selected){const ids=[...face.vertexIds];if(ids.length<3||new Set(ids).size!==ids.length)return{status:"FAIL",issues:[{code:"INVALID_FACE_VERTEX_ORDER",severity:"error",path:`faces.${face.id}`,message:"Face loop must contain distinct ordered vertices."}]}; const faceEdgeIds:string[]=[];for(let i=0;i<ids.length;i++){const edge=edgeByKey.get(edgeKey(ids[i],ids[(i+1)%ids.length]));if(!edge)return{status:"FAIL",issues:[{code:"INVALID_EDGE",severity:"error",path:`faces.${face.id}`,message:"Face boundary edge is missing."}]};const id=`fold-${edge.id}`;faceEdgeIds.push(id);incident.set(id,[...(incident.get(id)??[]),`fold-${face.id}`]);}faces.push({id:`fold-${face.id}`,sourceEntityId:face.id,vertexIds:ids.map(id=>vertexBySource.get(id)!.id),edgeIds:faceEdgeIds,normal:normal3(ids.map(position))});}
  const edges:FoldEdge[]=sourceEdges.filter(edge=>incident.has(`fold-${edge.id}`)).map(edge=>({id:`fold-${edge.id}`,sourceEntityId:edge.id,vertexIds:[vertexBySource.get(edge.startPointId)!.id,vertexBySource.get(edge.endPointId)!.id],incidentFaceIds:incident.get(`fold-${edge.id}`)!,boundary:incident.get(`fold-${edge.id}`)!.length===1}));
  const adjacency=edges.filter(edge=>edge.incidentFaceIds.length===2).map(edge=>({faceIds:[edge.incidentFaceIds[0],edge.incidentFaceIds[1]] as [string,string],sharedEdgeId:edge.id}));
  const dimensions=(scene.metadata?.adapterMetadata?.dimensions??{}) as Record<string,number>,origin=vertices.every(vertex=>vertex.origin==="source")?"source":"visual_only";
  const baseSides=(solid.type==="prism"||solid.type==="pyramid")?solid.baseSides:undefined,baseMode=(solid.type==="prism"||solid.type==="pyramid")?solid.baseMode:undefined;
  const topology:FoldTopology={id:`topology-${solid.id}`,solidId:solid.id,solidType:type,sourceSceneId:scene.id,sourceScene:scene,vertices,edges,faces,adjacency,metadata:{dimensions,origin,baseSides,baseMode}};
  const validation=validateFoldTopology(topology);
  return validation.status==="PASS"?{status:"PASS",value:topology,issues:[]}:{status:"FAIL",issues:validation.issues};
}
