import { createHash } from "node:crypto";
import { mtefRecordsToMathMl, serializeMathMl, type MathMlNode } from "./mtef-mathml.js";
import { scanMtefV5Records } from "./mtef-v5.js";
import { mtefV3ToMathMl } from "./mtef-v3-fixed.js";

export interface MtefCacheMetrics { lookupCount:number; hitCount:number; missCount:number; parseExecutionCount:number; entryCount:number; }
export interface CachedSemanticResult { cacheKey:string; semanticPayloadHash:string; mathMlNode:MathMlNode; normalizedMathMl:string; }
export interface SourceBoundSemanticResult extends CachedSemanticResult { provenance:Record<string,unknown>; }
const entries=new Map<string,CachedSemanticResult>();
const metrics: MtefCacheMetrics={lookupCount:0,hitCount:0,missCount:0,parseExecutionCount:0,entryCount:0};
const sha=(b:Uint8Array)=>createHash("sha256").update(b).digest("hex");
const clone=<T>(v:T):T=>structuredClone(v);
export function clearMtefCache(){entries.clear();Object.assign(metrics,{lookupCount:0,hitCount:0,missCount:0,parseExecutionCount:0,entryCount:0});}
export function getMtefCacheMetrics():MtefCacheMetrics{return {...metrics};}
export function decodeMtefV5Cached(payload:Uint8Array, provenance:Record<string,unknown>={}):SourceBoundSemanticResult {
  const semanticPayloadHash=sha(payload), cacheKey=`MTEF_V5:pimath-mtef-v5-1:${semanticPayloadHash}`; metrics.lookupCount++;
  let entry=entries.get(cacheKey);
  if(entry){metrics.hitCount++;}else{metrics.missCount++;metrics.parseExecutionCount++;const scan=scanMtefV5Records(payload, String(provenance.sourceObjectId??"MTEF_V5"));if(scan.errors.length)throw Error(scan.errors.join("; "));const mathMlNode=mtefRecordsToMathMl(payload,scan.records);entry={cacheKey,semanticPayloadHash,mathMlNode:clone(mathMlNode),normalizedMathMl:serializeMathMl(mathMlNode)};entries.set(cacheKey,entry);metrics.entryCount=entries.size;}
  const safe=clone(entry);return {...safe,provenance:{...provenance,semanticPayloadHash,decoderFamily:"MTEF_V5",decoderVersion:"pimath-mtef-v5-1"}};
}
export function decodeMtefV3Cached(payload:Uint8Array, provenance:Record<string,unknown>={}):SourceBoundSemanticResult {
  const semanticPayloadHash=sha(payload), cacheKey=`MTEF_V3:pimath-mtef-v3-1:${semanticPayloadHash}`; metrics.lookupCount++;
  let entry=entries.get(cacheKey);
  if(entry){metrics.hitCount++;}else{metrics.missCount++;metrics.parseExecutionCount++;const mathMlNode=mtefV3ToMathMl(payload);entry={cacheKey,semanticPayloadHash,mathMlNode:clone(mathMlNode),normalizedMathMl:serializeMathMl(mathMlNode)};entries.set(cacheKey,entry);metrics.entryCount=entries.size;}
  const safe=clone(entry);return {...safe,provenance:{...provenance,semanticPayloadHash,decoderFamily:"MTEF_V3",decoderVersion:"pimath-mtef-v3-1"}};
}
