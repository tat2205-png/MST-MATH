import { useMemo, useState } from "react";
import { assignCircleSemantic, assignMirroredCrease, createExactEdgeJoin, deleteConstructionCircle, deriveEdgeToEdgeFold, derivePointToPointCrease, updateSymmetricCreasePair, validateSymmetricCreasePair } from "../../modules/pattern-fold/index.js";
import type { EdgeJoin, FoldAssignment, PatternFoldSequence, PatternSheet } from "../../modules/pattern-fold/index.js";

const section={borderTop:"1px solid #6b7da8",paddingTop:8,marginTop:8} as const;
export default function PatternAuthoringCompletionPanel({sheet,onSheet,sequence,onSequence}:{sheet:PatternSheet;onSheet:(sheet:PatternSheet)=>void;sequence:PatternFoldSequence;onSequence:(sequence:PatternFoldSequence)=>void}){
 const[selectedCircle,setSelectedCircle]=useState<string>(),[selectedCrease,setSelectedCrease]=useState<string>(),[lockPairs,setLockPairs]=useState(true),[p,setP]=useState(""),[q,setQ]=useState(""),[p2pPreview,setP2pPreview]=useState(false),[edgeA,setEdgeA]=useState(""),[edgeB,setEdgeB]=useState(""),[edgePreview,setEdgePreview]=useState<string>(),[joins,setJoins]=useState<EdgeJoin[]>([]),[status,setStatus]=useState("Ready");
 const c=sheet.construction,points=c?.points??[],segments=c?.segments??[],circles=c?.circles??[],crease=sheet.creases.find(x=>x.id===selectedCrease),circle=circles.find(x=>x.id===selectedCircle),pointById=(id:string)=>points.find(x=>x.id===id),segmentEdge=(id:string)=>{const s=segments.find(x=>x.id===id);return s&&[pointById(s.pointIds[0])!.position,pointById(s.pointIds[1])!.position] as [[number,number],[number,number]];};
 const validation=useMemo(()=>selectedCrease?validateSymmetricCreasePair(sheet,selectedCrease):undefined,[sheet,selectedCrease]);
 const applyResult=(result:{value?:PatternSheet;issues:Array<{code:string;message:string}>},ok:string)=>{if(result.value){onSheet(result.value);setStatus(ok);}else setStatus(`${result.issues[0].code}: ${result.issues[0].message}`);};
 const pairEdit=(patch:{assignment?:FoldAssignment;targetAngleRadians?:number;foldSide?:"A"|"B"})=>{if(selectedCrease)applyResult(updateSymmetricCreasePair(sheet,selectedCrease,patch,lockPairs),"Crease settings updated.");};
 const applyP2P=()=>{if(!p||!q)return;const r=derivePointToPointCrease(sheet,p,q);if(r.value){onSheet(r.value);const id=r.value.creases.at(-1)!.id;onSequence({...sequence,steps:[...sequence.steps,{creaseId:id}]});setSelectedCrease(id);setP2pPreview(false);setStatus(`POINT_TO_POINT applied: ${id}`);}else setStatus(`${r.issues[0].code}: ${r.issues[0].message}`);};
 const applyEdgeTarget=()=>{const a=segmentEdge(edgeA),b=segmentEdge(edgeB);if(!a||!b)return;const r=deriveEdgeToEdgeFold(a,b);if(!r.value){setStatus(`${r.issues[0].code}: ${r.issues[0].message}`);return;}if(!selectedCrease){setStatus("INVALID_CREASE: select a crease to receive the edge target");return;}pairEdit({targetAngleRadians:r.value.targetAngleRadians});setEdgePreview(`EDGE_TO_EDGE_COINCIDENCE ${(r.value.targetAngleRadians*180/Math.PI).toFixed(2)}°`);};
 const applyJoin=()=>{const a=segmentEdge(edgeA),b=segmentEdge(edgeB);if(!a||!b)return;const r=createExactEdgeJoin(joins,a,b);if(r.value){setJoins(x=>[...x,r.value!]);setStatus(`${r.value.id}: VALID`);}else setStatus(`${r.issues[0].code}: ${r.issues[0].message}`);};
 return <div data-browser-authoring-completion>
<section>
<strong>SELECTED OBJECT</strong>
<p>Circles: {circles.map(x=>
<button key={x.id} aria-pressed={selectedCircle===x.id} onClick={()=>setSelectedCircle(x.id)}>{x.id}</button>)||"none"}</p>{circle&&<div>
<p>ID: {circle.id}<br/>Center: {pointById(circle.centerPointId)?.position.join(", ")}<br/>Radius: {circle.radius}<br/>Role: {circle.semantic}</p>
<button onClick={()=>applyResult(assignCircleSemantic(sheet,circle.id,"GUIDE"),"GUIDE_CIRCLE assigned.")}>Set as Guide Circle</button> <button onClick={()=>applyResult(assignCircleSemantic(sheet,circle.id,"CUT"),"CUT_CIRCLE assigned and regions partitioned.")}>Set as Cut Circle</button> <button onClick={()=>applyResult(deleteConstructionCircle(sheet,circle.id),"Circle deleted.")}>Delete Circle</button>
</div>}<p>Creases: {sheet.creases.map(x=>
<button key={x.id} aria-pressed={selectedCrease===x.id} onClick={()=>setSelectedCrease(x.id)}>{x.id}</button>)}</p>{crease&&<div>
<p>ID: {crease.id}<br/>Pair: {crease.symmetryPairId??"none"}<br/>Fold side: {crease.foldSide??"B"}<br/>Angle: {Math.round((crease.targetAngleRadians??0)*180/Math.PI)}°</p>
<label>Assignment <select value={crease.assignment} onChange={e=>pairEdit({assignment:e.target.value as FoldAssignment})}>
<option>UNASSIGNED</option>
<option>MOUNTAIN</option>
<option>VALLEY</option>
</select>
</label> <button onClick={()=>pairEdit({foldSide:"A"})}>Side A</button> <button onClick={()=>pairEdit({foldSide:"B"})}>Side B</button>
<label> Angle <input aria-label="Pair angle" type="number" min="0" max="180" value={Math.round((crease.targetAngleRadians??0)*180/Math.PI)} onChange={e=>pairEdit({targetAngleRadians:Number(e.target.value)*Math.PI/180})}/>
</label>
</div>}</section>
<section style={section}>
<strong>SYMMETRY PAIR</strong>
<p>
<label>
<input type="checkbox" checked={lockPairs} onChange={e=>setLockPairs(e.target.checked)}/> Lock Symmetric Pairs</label>
</p>
<label>Mirrored segment <select aria-label="Mirrored segment" value={edgeA} onChange={e=>setEdgeA(e.target.value)}>
<option value="">Select</option>{segments.filter(x=>x.symmetryPairId).map(x=>
<option key={`mirrored-${x.id}`}>{x.id}</option>)}</select>
</label> <button onClick={()=>{const r=assignMirroredCrease(sheet,edgeA,"UNASSIGNED","B");if(r.value){onSheet(r.value);const ids=r.value.creases.slice(-2).map(x=>x.id);onSequence({...sequence,steps:[...sequence.steps,...ids.map(creaseId=>({creaseId}))]});setSelectedCrease(ids[0]);setStatus("SYMMETRIC_CREASE_PAIR created.");}else setStatus(`${r.issues[0].code}: ${r.issues[0].message}`);}}>Create Mirrored Creases</button>{validation&&<p data-symmetric-crease-valid={validation.status}>{validation.value?`VALID — ${validation.value.sourceCreaseId} ↔ ${validation.value.mirrorCreaseId}`:`INVALID — ${validation.issues[0].code}: ${validation.issues[0].message}`}</p>}</section>
<section style={section}>
<strong>FOLD TARGETS</strong>
<p>Fold Point To Point</p>
<select aria-label="Source point P" value={p} onChange={e=>setP(e.target.value)}>
<option value="">P</option>{points.map(x=>
<option key={`p-${x.id}`}>{x.id}</option>)}</select> <select aria-label="Target point Q" value={q} onChange={e=>setQ(e.target.value)}>
<option value="">Q</option>{points.map(x=>
<option key={`q-${x.id}`}>{x.id}</option>)}</select> <button onClick={()=>setP2pPreview(Boolean(p&&q&&p!==q))}>Preview Point Fold</button>{p2pPreview&&<p data-point-fold-preview>Perpendicular bisector of {p}–{q}. <button onClick={applyP2P}>Apply Fold Crease</button> <button onClick={()=>setP2pPreview(false)}>Cancel Point Fold</button>
</p>}<p>Fold Edge To Edge</p>
<select aria-label="Source edge" value={edgeA} onChange={e=>setEdgeA(e.target.value)}>
<option value="">Edge A</option>{segments.map(x=>
<option key={`edge-a-${x.id}`}>{x.id}</option>)}</select> <select aria-label="Target edge" value={edgeB} onChange={e=>setEdgeB(e.target.value)}>
<option value="">Edge B</option>{segments.map(x=>
<option key={`edge-b-${x.id}`}>{x.id}</option>)}</select> <button onClick={applyEdgeTarget}>Apply Edge Fold</button>{edgePreview&&<p>{edgePreview}</p>}</section>
<section style={section}>
<strong>EDGE JOIN</strong>
<p>Edge A: {edgeA||"none"}<br/>Edge B: {edgeB||"none"}</p>
<button onClick={applyJoin}>Apply Join</button>{joins.map(x=>
<p key={x.id}>{x.id}: {x.status}; length {Math.hypot(x.edgeA[1][0]-x.edgeA[0][0],x.edgeA[1][1]-x.edgeA[0][1]).toFixed(3)}</p>)}</section>
<p role="status" data-completion-status>{status}</p>
</div>;
}
