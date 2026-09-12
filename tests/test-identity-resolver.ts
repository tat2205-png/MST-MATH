import assert from "node:assert/strict";
import { resolveFrozenBoundaryToDocumentIR } from "../src/modules/question-bank/identity-resolver.ts";
const doc:any={sourceDocumentId:"doc-1",sourceHash:"hash",blocks:[{id:"b-9",order:9,sourceAnchor:{sourceDocumentId:"doc-1",partName:"word/document.xml",objectIndex:9}},{id:"b-2",order:2,sourceAnchor:{sourceDocumentId:"doc-1",partName:"word/document.xml",objectIndex:2}}]};
const r=resolveFrozenBoundaryToDocumentIR({questionId:"q",sourceDocumentId:"doc-1",sourceObjectIds:["b-9"]},doc); assert.equal(r?.blocks[0].id,"b-9");
assert.equal(resolveFrozenBoundaryToDocumentIR({questionId:"q",sourceDocumentId:"wrong",sourceObjectIds:["b-9"]},doc),undefined);
console.log("IDENTITY_RESOLVER_QA=PASS");
