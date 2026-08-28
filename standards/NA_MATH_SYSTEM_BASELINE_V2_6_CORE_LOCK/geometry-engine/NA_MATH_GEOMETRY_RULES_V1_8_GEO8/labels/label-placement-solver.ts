// GEO-4 — Label Placement & Collision Solver
export interface Vec2{x:number;y:number}
export interface Box2{x:number;y:number;w:number;h:number}
export interface LabelRequest{
  id:string;text:string;anchor:Vec2;width:number;height:number;
  preferred?:'above'|'below'|'left'|'right'|'above-left'|'above-right'|'below-left'|'below-right';
}
export interface Segment2{id:string;a:Vec2;b:Vec2;strokeWidth?:number}
export interface ReservedBox{id:string;box:Box2;kind:'marker'|'formula'|'legend'|'other'}
export interface LabelPlacement{id:string;text:string;box:Box2;center:Vec2;direction:string}
export interface LabelSolveResult{status:'PASS'|'BLOCKED';placements:LabelPlacement[];errors:string[]}

const GAP=10,EDGE_CLEARANCE=4,POINT_CLEARANCE=5;
const DIRS=['above','above-right','right','below-right','below','below-left','left','above-left'];

function overlap(a:Box2,b:Box2,pad=0){
 return !(a.x+a.w+pad<=b.x||b.x+b.w+pad<=a.x||a.y+a.h+pad<=b.y||b.y+b.h+pad<=a.y);
}
function pointInBox(p:Vec2,b:Box2,pad=0){
 return p.x>=b.x-pad&&p.x<=b.x+b.w+pad&&p.y>=b.y-pad&&p.y<=b.y+b.h+pad;
}
function distPointSegment(p:Vec2,a:Vec2,b:Vec2){
 const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y,vv=vx*vx+vy*vy;
 if(vv===0)return Math.hypot(p.x-a.x,p.y-a.y);
 const t=Math.max(0,Math.min(1,(wx*vx+wy*vy)/vv));
 return Math.hypot(p.x-(a.x+t*vx),p.y-(a.y+t*vy));
}
function samples(b:Box2):Vec2[]{
 return [
  {x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x,y:b.y+b.h},{x:b.x+b.w,y:b.y+b.h},
  {x:b.x+b.w/2,y:b.y},{x:b.x+b.w/2,y:b.y+b.h},
  {x:b.x,y:b.y+b.h/2},{x:b.x+b.w,y:b.y+b.h/2}
 ];
}
function nearSegment(b:Box2,s:Segment2){
 const clear=(s.strokeWidth??2)/2+EDGE_CLEARANCE;
 return samples(b).some(p=>distPointSegment(p,s.a,s.b)<clear);
}
function inside(b:Box2,s:Box2){
 return b.x>=s.x&&b.y>=s.y&&b.x+b.w<=s.x+s.w&&b.y+b.h<=s.y+s.h;
}
function candidate(r:LabelRequest,d:string):Box2{
 const {x,y}=r.anchor,w=r.width,h=r.height;
 switch(d){
  case'above':return{x:x-w/2,y:y-GAP-h,w,h};
  case'below':return{x:x-w/2,y:y+GAP,w,h};
  case'left':return{x:x-GAP-w,y:y-h/2,w,h};
  case'right':return{x:x+GAP,y:y-h/2,w,h};
  case'above-left':return{x:x-GAP-w,y:y-GAP-h,w,h};
  case'above-right':return{x:x+GAP,y:y-GAP-h,w,h};
  case'below-left':return{x:x-GAP-w,y:y+GAP,w,h};
  case'below-right':return{x:x+GAP,y:y+GAP,w,h};
  default:return{x:x+GAP,y:y-GAP-h,w,h};
 }
}
export function solveLabelPlacement(labels:LabelRequest[],points:Vec2[],segments:Segment2[],reserved:ReservedBox[],safeBox:Box2):LabelSolveResult{
 const placements:LabelPlacement[]=[],errors:string[]=[];
 for(const r of labels){
  const order=r.preferred?[r.preferred,...DIRS.filter(d=>d!==r.preferred)]:DIRS;
  let chosen:LabelPlacement|undefined;
  for(const d of order){
   const b=candidate(r,d);
   if(!inside(b,safeBox))continue;
   if(placements.some(p=>overlap(b,p.box,2)))continue;
   if(reserved.some(x=>overlap(b,x.box,2)))continue;
   // ignore the label's own anchor point; avoid every other point.
   if(points.some(p=>!(p.x===r.anchor.x&&p.y===r.anchor.y)&&pointInBox(p,b,POINT_CLEARANCE)))continue;
   if(segments.some(s=>nearSegment(b,s)))continue;
   chosen={id:r.id,text:r.text,box:b,center:{x:b.x+b.w/2,y:b.y+b.h/2},direction:d};break;
  }
  if(!chosen)errors.push(`LABEL_PLACEMENT_FAILED:${r.id}`);else placements.push(chosen);
 }
 return {status:errors.length?'BLOCKED':'PASS',placements:errors.length?[]:placements,errors};
}
