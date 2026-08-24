import type { FoldRendererBoundaryResult,FoldScene } from "./types.js";

const escapeXml=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const escapeTex=(value:string)=>value.replace(/([#$%&_{}])/g,"\\$1").replace(/[\u0000-\u001F\u007F]/g,"");
const n=(value:number)=>Number(value.toFixed(6)).toString();

export function createThreeJsFoldBoundary(scene:FoldScene):FoldRendererBoundaryResult{return{status:"PARTIAL",renderer:"threejs",available:false,scene,issues:[{code:"UNAVAILABLE_RENDERER",severity:"warning",path:"renderer.threejs",message:"Three.js is not installed; FoldScene is ready for a future direct adapter."}]};}
export function createManimFoldBoundary(scene:FoldScene):FoldRendererBoundaryResult{return{status:"PARTIAL",renderer:"manim",available:false,scene,issues:[{code:"UNAVAILABLE_RENDERER",severity:"warning",path:"renderer.manim",message:"FoldScene is compatible with the existing Manim pipeline, but IA-4 does not compile Rotate animations."}]};}

export function foldNetToSvg(scene:FoldScene):FoldRendererBoundaryResult&{output?:string}{
  const points=scene.net.faces.flatMap(face=>face.vertices.map(v=>v.position)),minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1])),scale=Math.min(560/Math.max(1e-9,maxX-minX),400/Math.max(1e-9,maxY-minY));const sx=(x:number)=>40+(x-minX)*scale,sy=(y:number)=>440-(y-minY)*scale;
  const polygons=scene.net.faces.map(face=>`<polygon id="${escapeXml(face.faceId)}" data-source-face="${escapeXml(face.sourceFaceId)}" points="${face.vertices.map(v=>`${n(sx(v.position[0]))},${n(sy(v.position[1]))}`).join(" ")}" fill="none" stroke="#1d4ed8" stroke-width="2"/>`).join("");return{status:"PASS",renderer:"svg",available:true,scene,issues:[],output:`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">${polygons}</svg>`};
}
export function foldNetToTikz(scene:FoldScene):FoldRendererBoundaryResult&{output?:string}{const lines=["\\begin{tikzpicture}[scale=1]"];for(const face of scene.net.faces)lines.push(`\\draw ${face.vertices.map(v=>`(${n(v.position[0])},${n(v.position[1])})`).join(" -- ")} -- cycle node[pos=.5] {${escapeTex(face.sourceFaceId)}};`);lines.push("\\end{tikzpicture}");return{status:"PASS",renderer:"tikz",available:true,scene,issues:[],output:lines.join("\n")};}
