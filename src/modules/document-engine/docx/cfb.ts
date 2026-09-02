export interface CfbStream { name: string; type: number; size: number; bytes: Uint8Array }
const u16=(b:Uint8Array,o:number)=>b[o]|b[o+1]<<8;
const u32=(b:Uint8Array,o:number)=>((b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0);
const i32=(b:Uint8Array,o:number)=>u32(b,o)|0;
const chain=(fat:number[],start:number,limit:number)=>{const out:number[]=[];const seen=new Set<number>();for(let x=start;x>=0&&x!==0xfffffffe&&x!==0xffffffff&&out.length<limit&&!seen.has(x);x=fat[x]){seen.add(x);out.push(x)}return out};
export function readCfb(bytes:Uint8Array):CfbStream[]{
 if(bytes.length<512||bytes[0]!==0xd0||bytes[1]!==0xcf||bytes[2]!==0x11||bytes[3]!==0xe0||bytes[4]!==0xa1||bytes[5]!==0xb1||bytes[6]!==0x1a||bytes[7]!==0xe1)throw new Error("INVALID_CFB_SIGNATURE");
 const sectorShift=u16(bytes,30),miniShift=u16(bytes,32),sector=1<<sectorShift,miniSector=1<<miniShift;
 const sectorAt=(n:number)=>bytes.subarray(512+n*sector,512+(n+1)*sector);
 const fat:number[]=[];const difat=[];for(let i=0;i<109;i++){const n=i32(bytes,76+i*4);if(n>=0)difat.push(n)}
 const fatSectors=u32(bytes,44);for(const n of difat.slice(0,fatSectors))for(let o=0;o<sector;o+=4)fat.push(i32(sectorAt(n),o));
 const dirBytes=chain(fat,i32(bytes,48),Math.ceil(bytes.length/sector)).flatMap(n=>[...sectorAt(n)]);const dirs:any[]=[];
 for(let p=0;p+128<=dirBytes.length;p+=128){const d=new Uint8Array(dirBytes.slice(p,p+128)),len=u16(d,64);let name="";for(let i=0;i+1<len-2;i+=2)name+=String.fromCharCode(u16(d,i));dirs.push({name,type:d[66],start:i32(d,116),size:Number(u32(d,120))+Number(u32(d,124))*4294967296})}
 const root=dirs.find(d=>d.type===5), miniCutoff=u32(bytes,56), miniFat=chain(fat,i32(bytes,60),u32(bytes,60)===0xffffffff?0:Math.ceil((u32(bytes,60)*sector)/sector));
 const mini:number[]=[];for(const n of miniFat)for(let o=0;o<sector;o+=4)mini.push(i32(sectorAt(n),o));
 const rootBytes=root?new Uint8Array(chain(fat,root.start,Math.ceil(root.size/sector)).flatMap(n=>[...sectorAt(n)])):new Uint8Array();
 return dirs.filter(d=>d.type===2).map(d=>{let raw:number[]=[];if(d.size<miniCutoff){const all:number[]=[];for(let n=0;n<rootBytes.length;n+=miniSector)all.push(...rootBytes.slice(n,n+miniSector));for(const n of chain(mini,d.start,Math.ceil(d.size/miniSector)))raw.push(...all.slice(n*miniSector,n*miniSector+miniSector));}else for(const n of chain(fat,d.start,Math.ceil(d.size/sector)))raw.push(...sectorAt(n));return {name:d.name,type:d.type,size:d.size,bytes:new Uint8Array(raw.slice(0,d.size))}});
}
