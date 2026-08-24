import { identity4,multiply4,rotationAroundAxis,transformPoint } from "./math.js";
import type { FaceTransform,FoldBuildResult,FoldState,Mat4,NetFace,NetLayout,Vec3 } from "./types.js";
import { validateFoldState } from "./validation.js";

export function computeFoldState(net:NetLayout,progress:number):FoldBuildResult<FoldState>{
  if(!Number.isFinite(progress)||progress<0||progress>1)return{status:"FAIL",issues:[{code:"INVALID_PROGRESS",severity:"error",path:"progress",message:"Progress must be finite and within [0,1]."}]};
  const faces=new Map(net.faces.map(face=>[face.faceId,face])),children=new Map<string,typeof net.hinges>();for(const hinge of net.hinges)children.set(hinge.parentFaceId,[...(children.get(hinge.parentFaceId)??[]),hinge]);
  const transforms=new Map<string,Mat4>();transforms.set(net.rootFaceId,identity4());
  const visit=(faceId:string)=>{const parentMatrix=transforms.get(faceId)!;for(const hinge of children.get(faceId)??[]){const parent=faces.get(faceId)!;const a=parent.vertices.find(vertex=>vertex.vertexId===hinge.axisVertexIds[0])?.position,b=parent.vertices.find(vertex=>vertex.vertexId===hinge.axisVertexIds[1])?.position;if(!a||!b)continue;const rotation=rotationAroundAxis([a[0],a[1],0],[b[0]-a[0],b[1]-a[1],0],hinge.targetAngleRadians*progress);transforms.set(hinge.childFaceId,multiply4(parentMatrix,rotation));visit(hinge.childFaceId);}};visit(net.rootFaceId);
  const faceTransforms:FaceTransform[]=net.faces.map((face:NetFace)=>{const matrix=transforms.get(face.faceId)??identity4();return{faceId:face.faceId,matrix,transformedVertices:face.vertices.map(vertex=>({vertexId:vertex.vertexId,position:transformPoint(matrix,[vertex.position[0],vertex.position[1],0] as Vec3)}))};});
  const state:FoldState={progress,faceTransforms},validation=validateFoldState(state,net);return validation.status==="PASS"?{status:"PASS",value:state,issues:[]}:{status:"FAIL",issues:validation.issues};
}
