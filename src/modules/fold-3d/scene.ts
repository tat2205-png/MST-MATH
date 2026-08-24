import type { MathScene } from "../math-ir/index.js";
import { computeFoldState } from "./fold.js";
import { generateCanonicalNet } from "./net.js";
import { buildFoldTopology } from "./topology.js";
import type { FoldBuildResult,FoldScene } from "./types.js";

export function createFoldScene(source:MathScene,progress=0,solidEntityId?:string):FoldBuildResult<FoldScene>{
  const topology=buildFoldTopology(source,solidEntityId);if(!topology.value)return{status:topology.status,issues:topology.issues};
  const net=generateCanonicalNet(topology.value);if(!net.value)return{status:net.status,issues:net.issues};
  const state=computeFoldState(net.value,progress);if(!state.value)return{status:state.status,issues:state.issues};
  const scene:FoldScene={id:`fold-scene-${topology.value.solidId}`,solidId:topology.value.solidId,solidType:topology.value.solidType,topology:topology.value,net:net.value,state:state.value,faceCorrespondence:net.value.faces.map(face=>({netFaceId:face.faceId,solidFaceId:face.faceId,sourceFaceId:face.sourceFaceId})),edgeCorrespondence:topology.value.edges.map(edge=>({netEdgeId:edge.id,solidEdgeId:edge.id,sourceEdgeId:edge.sourceEntityId})),cameraHints:{target:[0,0,0],projection:"perspective"},metadata:{rendererNeutral:true,origin:topology.value.metadata.origin}};return{status:"PASS",value:scene,issues:[]};
}

export function updateFoldScene(scene:FoldScene,progress:number):FoldBuildResult<FoldScene>{const state=computeFoldState(scene.net,progress);return state.value?{status:"PASS",value:{...scene,state:state.value},issues:[]}:{status:state.status,issues:state.issues};}
