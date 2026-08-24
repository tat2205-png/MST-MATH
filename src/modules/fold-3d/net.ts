import { cross3,distance3,dot3,normal2As3,normalize3,normalizeAngle,orientedAngle,sub3 } from "./math.js";
import type { FoldBuildResult,FoldFace,FoldHinge,FoldTopology,NetFace,NetLayout,Vec2,Vec3 } from "./types.js";
import { validateFoldTopology,validateNet } from "./validation.js";

const treeBySolid:Record<FoldTopology["solidType"],Array<[string,string]>>={cube:[["face-bottom","face-front"],["face-bottom","face-right"],["face-bottom","face-back"],["face-bottom","face-left"],["face-front","face-top"]],rectangular_prism:[["face-bottom","face-front"],["face-bottom","face-right"],["face-bottom","face-back"],["face-bottom","face-left"],["face-front","face-top"]],triangular_prism:[["face-base","face-ab"],["face-base","face-bc"],["face-base","face-ca"],["face-ab","face-top"]],tetrahedron:[["face-base","face-abd"],["face-base","face-bcd"],["face-base","face-cad"]],square_pyramid:[["face-base","face-abs"],["face-base","face-bcs"],["face-base","face-cds"],["face-base","face-das"]]};
const foldFaceId=(source:string)=>`fold-${source}`;
const positionMap=(topology:FoldTopology)=>new Map(topology.vertices.map(vertex=>[vertex.id,vertex.foldedPosition]));
const faceMap=(topology:FoldTopology)=>new Map(topology.faces.map(face=>[face.id,face]));

function rootPlacement(face:FoldFace,positions:Map<string,Vec3>):NetFace{
  const points=face.vertexIds.map(id=>positions.get(id)!),origin=points[0],x=normalize3(sub3(points[1],origin)),y=normalize3(cross3(face.normal,x));
  return{faceId:face.id,sourceFaceId:face.sourceEntityId,vertices:face.vertexIds.map((id,index)=>{const relative=sub3(points[index],origin);return{vertexId:id,position:[dot3(relative,x),dot3(relative,y)]};})};
}
function side(a:Vec2,b:Vec2,p:Vec2){return Math.sign((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]));}
function placeChild(parent:NetFace,child:FoldFace,edge:{vertexIds:[string,string]},positions:Map<string,Vec3>):NetFace{
  const parentMap=new Map(parent.vertices.map(vertex=>[vertex.vertexId,vertex.position])),aId=edge.vertexIds[0],bId=edge.vertexIds[1],a2=parentMap.get(aId)!,b2=parentMap.get(bId)!;
  const a3=positions.get(aId)!,b3=positions.get(bId)!,length=distance3(a3,b3),ux=(b2[0]-a2[0])/length,uy=(b2[1]-a2[1])/length;
  const centroid:Vec2=[parent.vertices.reduce((sum,v)=>sum+v.position[0],0)/parent.vertices.length,parent.vertices.reduce((sum,v)=>sum+v.position[1],0)/parent.vertices.length],sign=side(a2,b2,centroid)>=0?-1:1;
  return{faceId:child.id,sourceFaceId:child.sourceEntityId,vertices:child.vertexIds.map(vertexId=>{if(vertexId===aId)return{vertexId,position:a2};if(vertexId===bId)return{vertexId,position:b2};const v=positions.get(vertexId)!,da=distance3(v,a3),db=distance3(v,b3),x=(da*da+length*length-db*db)/(2*length),height=Math.sqrt(Math.max(0,da*da-x*x));return{vertexId,position:[a2[0]+ux*x-sign*uy*height,a2[1]+uy*x+sign*ux*height]};})};
}
function flatNormal(face:NetFace){return normal2As3(face.vertices.map(vertex=>vertex.position));}

export function generateCanonicalNet(topology:FoldTopology):FoldBuildResult<NetLayout>{
  const topologyValidation=validateFoldTopology(topology);if(topologyValidation.status==="FAIL")return{status:"FAIL",issues:topologyValidation.issues};
  const faces=faceMap(topology),positions=positionMap(topology),pairs=treeBySolid[topology.solidType].map(([p,c])=>[foldFaceId(p),foldFaceId(c)] as [string,string]),rootFaceId=pairs[0]?.[0]??topology.faces[0].id,netFaces=new Map<string,NetFace>();
  netFaces.set(rootFaceId,rootPlacement(faces.get(rootFaceId)!,positions));const hinges:FoldHinge[]=[];
  for(const[parentId,childId]of pairs){const parent=faces.get(parentId),child=faces.get(childId),parentNet=netFaces.get(parentId);if(!parent||!child||!parentNet)return{status:"FAIL",issues:[{code:"MISSING_FACE",severity:"error",path:"canonicalTree",message:`Canonical tree face missing: ${parentId}/${childId}`}]};const edge=topology.edges.find(candidate=>candidate.incidentFaceIds.includes(parentId)&&candidate.incidentFaceIds.includes(childId));if(!edge)return{status:"FAIL",issues:[{code:"INVALID_HINGE",severity:"error",path:"canonicalTree",message:`Faces ${parentId}/${childId} do not share an edge.`}]};const childNet=placeChild(parentNet,child,edge,positions);netFaces.set(childId,childNet);const a3=positions.get(edge.vertexIds[0])!,b3=positions.get(edge.vertexIds[1])!,a2=parentNet.vertices.find(v=>v.vertexId===edge.vertexIds[0])!.position,b2=parentNet.vertices.find(v=>v.vertexId===edge.vertexIds[1])!.position;const target=orientedAngle(parent.normal,child.normal,sub3(b3,a3)),flat=orientedAngle(flatNormal(parentNet),flatNormal(childNet),[b2[0]-a2[0],b2[1]-a2[1],0]),angle=normalizeAngle(target-flat);hinges.push({id:`hinge-${parentId}-${childId}`,parentFaceId:parentId,childFaceId:childId,sharedEdgeId:edge.id,axisVertexIds:edge.vertexIds,targetAngleRadians:angle,foldDirection:angle>=0?1:-1});}
  const net:NetLayout={id:`net-${topology.solidId}-canonical-v1`,solidId:topology.solidId,topologyId:topology.id,rootFaceId,faces:topology.faces.map(face=>netFaces.get(face.id)!).filter(Boolean),hinges,variant:"canonical-v1"};const validation=validateNet(net,topology);return validation.status==="PASS"?{status:"PASS",value:net,issues:[]}:{status:"FAIL",issues:validation.issues};
}
