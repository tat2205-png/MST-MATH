/**
 * FIXTURE_AUTHORITY=PIMATH_UNIFIED_INPUT_V1_CERTIFICATION
 * EXPECTED_VALUES_SOURCE=HUMAN_AUTHORIZED_SPECIFICATION
 * EXPECTED_VALUES_DERIVED_FROM_RUNTIME=NO
 */
import type { ContentBlock, DocumentBlock, DocumentIR, FigureRecord } from "../../src/modules/document-engine/document-ir.js";

const block = (id: string, value: string, section?: string, sourceLocation = `fixture:${id}`): DocumentBlock => ({
  id, kind: section ? "SECTION" : "PARAGRAPH", order: Number(id.replace(/\D/g, "")) || 0,
  content: [{ type: "text", value, sourceLocation }], sourceLocation,
});
const document = (id: string, blocks: DocumentBlock[], figures: FigureRecord[] = []): DocumentIR => ({
  sourceDocument: `${id}.docx`, sourceHash: id.padEnd(64, "0").slice(0, 64), blocks, figures, warnings: [],
});

export const DENOMINATORS = Object.freeze({ QUESTION_BOUNDARY:8, QUESTION_TYPE:5, SHARED_CONTEXT:4, DOCX_COMPLEX_FIDELITY:10, ANSWER_LINK:5, SOLUTION_LINK:5, FIGURE_LINK:6, SOURCE_GROUP:4, TABLE_STRUCTURE:10, CROSS_PAGE_QUESTION:5, RECONCILIATION:6, MATH_FIDELITY:15, PROVENANCE:30, FIELD_LEVEL_PROVENANCE:20 });

export const QUESTION_FIXTURES = [
  { id:"QB01", document:document("QB01",[block("s1","TRẮC NGHIỆM","section"),block("b1","Câu 1. Giá trị của 2+2 là bao nhiêu? A. 3 B. 4 C. 5 D. 6"),block("b2","Câu 2. Nghiệm của x-1=0 là gì? A. 0 B. 1 C. 2 D. 3")]), expected:{count:2,indexes:[1,2],types:["MULTIPLE_CHOICE","MULTIPLE_CHOICE"]}},
  { id:"QB02", document:document("QB02",[block("s1","ĐÚNG / SAI","section"),block("b1","Câu 1. Xét các khẳng định sau. a) 2<3. b) 3<2. c) 1+1=2. d) 0>1.")]), expected:{count:1,indexes:[1],types:["TRUE_FALSE"],labels:["a","b","c","d"]}},
  { id:"QB03", document:document("QB03",[block("s1","TRẢ LỜI NGẮN","section"),block("b1","Câu 1. Tính 2+3.")]), expected:{count:1,indexes:[1],types:["SHORT_ANSWER"]}},
  { id:"QB04", document:document("QB04",[block("s1","TỰ LUẬN","section"),block("b1","Bài 1. Giải phương trình x²-5x+6=0.")]), expected:{count:1,indexes:[1],types:["ESSAY"]}},
  { id:"QB05", document:document("QB05",[block("b1","Bài 1. Giải x+1=0."),block("b2","Trình bày rõ các bước."),block("b3","Bài 2. Giải x-2=0."),block("b4","Bài 3. Giải x-3=0.")]), expected:{count:3,indexes:[1,2,3],types:["UNKNOWN","UNKNOWN","UNKNOWN"]}},
] as const;

export const SHARED_CONTEXT_FIXTURES = [
  { id:"SC01", section:"TRẮC NGHIỆM", document:document("SC01",[block("s1","TRẮC NGHIỆM","section"),block("b1","Câu 1. Tính 1+1. A. 1 B. 2 C. 3 D. 4"),block("b2","Câu 2. Tính 2+2. A. 2 B. 3 C. 4 D. 5")]) },
  { id:"SC02", section:"TỰ LUẬN", document:document("SC02",[block("s1","TỰ LUẬN","section"),block("b1","Bài 1. Giải x=1."),block("b2","Bài 2. Giải x=2.")]) },
] as const;

export const ANSWER_FIXTURES = [
  {id:"AN01", lines:["Câu 1. Tính 2+2. A. 3 B. 4 C. 5 D. 6","Lời giải: Ta có 2+2=4. Đáp án B."], answer:"B", solution:true},
  {id:"AN02", lines:["Câu 1. Giải x-1=0. A. 0 B. 1 C. 2 D. 3","Hướng dẫn giải: x=1. Chọn B."], answer:"B", solution:true},
  {id:"AN03", lines:["Câu 1. Tính 3+3. A. 5 B. 6 C. 7 D. 8","Lời giải: 3+3=6. Do đó đáp án B."], answer:"B", solution:true},
  {id:"AN04", lines:["Câu 1. Tính 1+1. A. 1 B. 2 C. 3 D. 4","Lời giải: Ta được 2."], answer:undefined, solution:true},
  {id:"AN05", lines:["Câu 1. Tính 1+2. A. 2 B. 3 C. 4 D. 5","Lời giải: Đáp án B. Đáp án C."], answer:undefined, solution:true},
].map((fixture) => ({...fixture, document:document(fixture.id, fixture.lines.map((line,i)=>block(`b${i+1}`,line))) }));

const figure = (id:string):FigureRecord => ({id,relationshipId:id,mediaPath:`${id}.png`,mimeType:"image/png",sourceLocation:`fixture:${id}`});
const figureDoc = (id:string, owners:Array<string[]>, orphan:string[]=[]):DocumentIR => {
  const ids=[...owners.flat(),...orphan]; return document(id, owners.map((items,i)=>({id:`b${i+1}`,kind:"PARAGRAPH",order:i,content:[{type:"text",value:`Câu ${i+1}. Câu hỏi ${i+1}.`},...items.map((figureId):ContentBlock=>({type:"figure",figureId,sourceLocation:`fixture:${figureId}`}))],sourceLocation:`fixture:${id}:q${i+1}`})),ids.map(figure));
};
export const FIGURE_FIXTURES = [
  {id:"FG01",document:figureDoc("FG01",[["F1"]]),expected:[["F1",1,"CONFIRMED"]]},
  {id:"FG02",document:figureDoc("FG02",[[],["F2"]]),expected:[["F2",2,"CONFIRMED"]]},
  {id:"FG03",document:figureDoc("FG03",[[]],["F3"]),expected:[["F3",undefined,"UNASSIGNED"]]},
  {id:"FG04",document:figureDoc("FG04",[["F4"],[]]),expected:[["F4",1,"CONFIRMED"]]},
  {id:"FG05",document:figureDoc("FG05",[[],["F5","F6"]]),expected:[["F5",2,"CONFIRMED"],["F6",2,"CONFIRMED"]]},
] as const;

const table = (id:string, rows:string[][]):ContentBlock => ({type:"table",cells:rows.map(row=>row.map(value=>({type:"text",value}))),sourceLocation:`fixture:${id}`});
export const TABLE_FIXTURES = [
  {id:"TB01",block:table("TB01",[["x","x+1"],["1","2"]]),expected:{rows:2,columns:2,order:["x","x+1","1","2"]}},
  {id:"TB02",block:table("TB02",[["A","B","C"],["1","2","3"]]),expected:{rows:2,columns:3,order:["A","B","C","1","2","3"]}},
] as const;

export const CROSS_PAGE_FIXTURES = [
 {id:"CP01",document:document("CP01",[block("b1","Câu 1. Bắt đầu.",undefined,"cp.pdf:page:1"),block("b2","Tiếp tục câu một.",undefined,"cp.pdf:page:2"),block("b3","Câu 2. Bắt đầu.",undefined,"cp.pdf:page:2")])},
 {id:"CP02",document:document("CP02",[block("b1","Câu 1. Trang một.",undefined,"cp.pdf:page:1"),block("b2","Câu 2. Trang hai.",undefined,"cp.pdf:page:2")])},
] as const;

export const SOURCE_GROUP_FIXTURES = [
 {id:"SG01",left:{examIdentity:"exam-01",role:"EXAM",name:"exam.pdf",sourceHash:"a"},right:{examIdentity:"exam-01",role:"ANSWER",name:"answers.pdf",sourceHash:"b"},expected:"SAME_SOURCE_GROUP"},
 {id:"SG02",left:{examIdentity:"exam-02",role:"TEXT",name:"exam.pdf",sourceHash:"c"},right:{examIdentity:"exam-02",role:"SCAN",name:"scan.pdf",sourceHash:"d"},expected:"SAME_SOURCE_GROUP"},
 {id:"SG03",left:{examIdentity:"grade-10",role:"EXAM",name:"exam.pdf",sourceHash:"e"},right:{examIdentity:"grade-11",role:"EXAM",name:"exam.pdf",sourceHash:"f"},expected:"DIFFERENT_SOURCE_GROUP"},
 {id:"SG04",left:{role:"EXAM",name:"same.pdf",sourceHash:"g"},right:{role:"EXAM",name:"same.pdf",sourceHash:"h"},expected:"DIFFERENT_SOURCE_GROUP"},
] as const;
export const RECONCILIATION_FIXTURES = [
 {id:"RC01",native:"x²-1=0",ocr:"x²-1=0",expected:"AGREE"},
 {id:"RC02",native:"x ≤ 2",ocr:"x <= 2",expected:"FORMAT_EQUIVALENT"},
 {id:"RC03",native:"x²-1=0",ocr:"x²+1=0",expected:"CONFLICT_REVIEW_REQUIRED"},
 {id:"RC04",native:"1/2",ocr:"12",expected:"CONFLICT_REVIEW_REQUIRED"},
 {id:"RC05",native:"π",ai:"n",expected:"CONFLICT_REVIEW_REQUIRED"},
 {id:"RC06",native:"x=1",ocr:"x=1",ai:"x=2",expected:"CONFLICT_REVIEW_REQUIRED"},
] as const;
export const MATH_FIDELITY_PAIRS = [["+","-"],["<","<="],[">",">="],["=","!="],["x²","x³"],["a₁","a₇"],["sqrt(x)","x"],["1/2","12"],["1/3","13"],["O","0"],["l","1"],["π","n"],["|x|","x"],["(1;2)","[1;2]"],["vector(v)","v"]] as const;
export const EXIF_ORIENTATION_6_JPEG = new Uint8Array([255,216,255,225,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0,255,217]);
export const FIELD_PROVENANCE_SAMPLE_IDS = Object.freeze(["DOCX:block:id","DOCX:block:sourceLocation","DOCX:content:sourceLocation","DOCX:figure:sourceLocation","PDF1:block:id","PDF1:block:sourceLocation","PDF1:content:sourceLocation","PDF1:provenance","PDF2:block:id","PDF2:block:sourceLocation","PDF2:content:sourceLocation","PDF2:provenance","PDF3:block:id","PDF3:block:sourceLocation","PDF3:content:sourceLocation","PDF3:provenance","JPEG:block:id","JPEG:block:sourceLocation","JPEG:content:sourceLocation","JPEG:figure:sourceLocation"]);
