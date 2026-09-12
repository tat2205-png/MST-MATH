import { createHash } from "node:crypto";
import type { MathMlNode } from "./mtef-mathml.js";

export interface V3Record { typeId:number; typeName:string; options:number; offsetStart:number; offsetEnd:number; children?:V3Record[]; charCode?:number; selector?:number; variation?:number }
const names=["END","LINE","CHAR","TMPL","PILE","MATRIX","EMBELL","RULER","FONT","SIZE","FULL","SUB","SUB2","SYM","SUBSYM","COLOR","COLOR_DEF","FONT_DEF","EQN_PREFS","ENCODING_DEF"];
class Cursor { constructor(readonly bytes:Uint8Array, public offset=0){} need(n:number){if(this.offset+n>this.bytes.length)throw Error(`MTEF_V3:OUT_OF_BOUNDS@${this.offset}`)} u8(){this.need(1);return this.bytes[this.offset++]} i8(){const n=this.u8();return n>127?n-256:n} u16(){this.need(2);const n=this.bytes[this.offset]|this.bytes[this.offset+1]<<8;this.offset+=2;return n} string(){while(this.offset<this.bytes.length&&this.u8()!==0){}} }
function objectList(c:Cursor, depth=0):V3Record[]{
  if(depth>128)throw Error(`MTEF_V3:RECURSION_LIMIT@${c.offset}`);
  const out:V3Record[]=[];
  for(;;){if(c.offset>=c.bytes.length)return out;const start=c.offset;const tag=c.u8();const typeId=tag&15;const options=tag>>4;
    if(typeId===0){out.push({typeId,typeName:"END",options,offsetStart:start,offsetEnd:c.offset});return out;}
    const r:V3Record={typeId,typeName:names[typeId]??"UNKNOWN",options,offsetStart:start,offsetEnd:c.offset};
    if(typeId===2){c.i8();r.charCode=c.u16();if(options&1)r.children=objectList(c,depth+1);}
    else if(typeId===3){r.selector=c.i8();r.variation=c.u8();c.u8();r.children=objectList(c,depth+1);}
    else if(typeId===1){if(options&8)c.u16();if(options&4)c.i8();if(!(options&1))r.children=objectList(c,depth+1);}
    else if(typeId===4){c.i8();c.i8();r.children=objectList(c,depth+1);}
    else if(typeId===6)c.u8();
    else if(typeId===8){c.i8();c.i8();c.string();}
    else if(typeId===9){c.i8();c.u8();}
    else if(typeId===17){c.i8();c.i8();c.string();}
    else if(typeId===19)c.string();
    else if(typeId>19)throw Error(`MTEF_V3:UNKNOWN_RECORD:${typeId}@${start}`);
    r.offsetEnd=c.offset;out.push(r);
  }
}
export function scanMtefV3Records(payload:Uint8Array){if(payload.length<4||!([2,3] as number[]).includes(payload[0]))throw Error("MTEF_V3:INVALID_HEADER@0");const records=objectList(new Cursor(payload,3));return{version:payload[0],records,errors:[] as string[],payloadHash:createHash("sha256").update(payload).digest("hex")};}
function chars(records:V3Record[]):MathMlNode[]{const out:MathMlNode[]=[];for(const r of records){if(r.typeName==="CHAR"&&r.charCode!==undefined){const s=String.fromCharCode(r.charCode);out.push(/^[0-9]$/.test(s)?{type:"number",text:s}:/^[A-Za-z]$/.test(s)?{type:"identifier",text:s}:{type:"operator",text:s});}if(r.children)out.push(...chars(r.children));}return out;}
export function mtefV3ToMathMl(payload:Uint8Array):MathMlNode{const scan=scanMtefV3Records(payload);return{type:"math",children:[{type:"row",children:chars(scan.records)}]};}
