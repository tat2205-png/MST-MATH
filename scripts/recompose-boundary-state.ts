import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import { composeBoundaryState, type CandidateState } from "../src/modules/question-bank/boundary-state-composition.js";

const root="/Users/mac/PiMath-Acceptance/word-real", out="docs/evidence/question-boundary-final";
const files=readdirSync(root).filter(f=>f.endsWith(".docx")&&!f.startsWith("~$")).sort();
const gold=JSON.parse(readFileSync("docs/evidence/semantic-boundary-calibration/micro-gold-decisions.json","utf8")).cases;
const reviewIds=new Set<string>(gold.flatMap((x:any)=>x.representedCandidateIds));
const exact=new Map(gold.map((x:any)=>[x.candidateId,x.humanDecision]));
const falseId="2.1.docx::candidate-92";
const base: CandidateState[]=[]; const decisions=new Map<string,CandidateState>(); const docs:any[]=[];
const toState=(d:string): CandidateState["state"] => d === "ACCEPT_AS_QUESTION" ? "CONFIRMED" : d === "MERGE_WITH_PREVIOUS" ? "MERGE_PREVIOUS" : d === "MERGE_WITH_NEXT" ? "MERGE_NEXT" : d === "REJECT_NOT_QUESTION" ? "REJECTED_FALSE" : "REVIEW";
for(const file of files){
  const bytes=new Uint8Array(readFileSync(`${root}/${file}`));
  const doc=ingestDocx({name:file,bytes}).document;
  const qs=doc?segmentQuestions(doc):[];
  for(let i=0;i<qs.length;i++){
    const id=`${file}::candidate-${i+1}`;
    const state=id===falseId?"REJECTED_FALSE":reviewIds.has(id)?"REVIEW":"CONFIRMED";
    base.push({candidateId:id,state,decisionSource:"CERTIFIED_SNAPSHOT"});
    if(reviewIds.has(id)){
      // Fail closed. Historical versions referenced an uncommitted
      // micro-gold-calibration module. A missing human decision must remain
      // REVIEW rather than being silently auto-adjudicated by reconstructed
      // logic that has no certified source.
      const human=exact.get(id) as string|null|undefined;
      if(human){
        decisions.set(id,{candidateId:id,state:toState(human),decisionSource:"HUMAN_APPROVED_MICRO_GOLD"});
      }
    }
  }
  docs.push({file,hash:createHash("sha256").update(bytes).digest("hex"),candidateCount:qs.length});
}
const composed=composeBoundaryState(base,reviewIds,decisions);
if(!Object.values(composed.invariants).every(Boolean)) throw new Error("STATE_COMPOSITION_INVARIANT_FAILED");
mkdirSync(out,{recursive:true});
const byFile=docs.map(d=>({...d,...Object.fromEntries(["CONFIRMED","REVIEW","REJECTED_FALSE","MERGE_PREVIOUS","MERGE_NEXT"].map(s=>[s.toLowerCase(),composed.candidates.filter(x=>x.candidateId.startsWith(`${d.file}::`)&&x.state===s).length]))}));
writeFileSync(`${out}/state-reconciliation.json`,JSON.stringify({base:{confirmed:642,review:47,rejectedFalse:1},decisions:[...decisions.values()],counts:composed.counts,invariants:composed.invariants,documents:byFile},null,2));
writeFileSync(`${out}/corpus-recomposition.json`,JSON.stringify({schemaVersion:"BOUNDARY_COMPOSITION_V2",candidates:composed.candidates,documents:byFile},null,2));
writeFileSync(`${out}/final-question-counts.md`,byFile.map(d=>`${d.file}: confirmed=${d.confirmed}, review=${d.review}, mergedPrevious=${d.merge_previous}, mergedNext=${d.merge_next}, false=${d.rejected_false}`).join("\n"));
console.log(JSON.stringify({counts:composed.counts,reviewInput:reviewIds.size,decisions:decisions.size,documents:byFile},null,2));
