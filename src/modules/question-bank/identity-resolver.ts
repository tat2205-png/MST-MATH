import type { DocumentIR } from "../document-engine/document-ir.js";
import type { DocumentObjectId, SourceAnchor } from "../document-engine/document-ir.js";

export interface FrozenBoundaryIdentity { questionId: string; sourceDocumentId: string; sourceObjectIds: DocumentObjectId[]; startObjectId?: DocumentObjectId; endObjectId?: DocumentObjectId; startAnchor?: SourceAnchor; endAnchor?: SourceAnchor; }
export interface ResolvedBoundary { questionId: string; blocks: DocumentIR["blocks"]; sourceObjectIds: DocumentObjectId[]; sourceDocumentId: string; }
const sameAnchor=(a?:SourceAnchor,b?:SourceAnchor)=>!!a&&!!b&&a.sourceDocumentId===b.sourceDocumentId&&a.partName===b.partName&&a.objectIndex===b.objectIndex&&a.paragraphIndex===b.paragraphIndex;
export function resolveFrozenBoundaryToDocumentIR(frozen: FrozenBoundaryIdentity, document: DocumentIR): ResolvedBoundary | undefined {
  const documentId=document.sourceDocumentId??document.id??document.sourceHash; if(frozen.sourceDocumentId!==documentId && frozen.sourceDocumentId!==document.sourceHash) return undefined;
  const wanted=new Set(frozen.sourceObjectIds); const blocks=document.blocks.filter(b=>wanted.has(b.id));
  if(wanted.size && blocks.length===wanted.size) return {questionId:frozen.questionId,blocks,sourceObjectIds:blocks.map(b=>b.id),sourceDocumentId:documentId};
  const anchorFor=(b:DocumentIR["blocks"][number]):SourceAnchor=>({sourceDocumentId:documentId,partName:"word/document.xml",paragraphIndex:b.paragraphIndex,objectIndex:b.order});
  const start=document.blocks.find(b=>sameAnchor(anchorFor(b),frozen.startAnchor)), end=document.blocks.find(b=>sameAnchor(anchorFor(b),frozen.endAnchor));
  if(start&&end){const lo=Math.min(start.order,end.order),hi=Math.max(start.order,end.order);const range=document.blocks.filter(b=>b.order>=lo&&b.order<=hi);return {questionId:frozen.questionId,blocks:range,sourceObjectIds:range.map(b=>b.id),sourceDocumentId:documentId};}
  return undefined;
}
