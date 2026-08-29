// GEO-6 — Canonical geometry builders.
// These builders create semantic/projected geometry constraints.
// Visibility is resolved separately by GEO-3.

export interface P2 { x:number; y:number; }

export interface Prism2D {
  base1: P2[];
  base2: P2[];
  translation: P2;
}

export function buildTranslatedPrismBase(
  base1:P2[],
  translation:P2
):Prism2D{
  if(base1.length<3 || base1.length>10){
    throw new Error('PRISM_VERTEX_COUNT_OUT_OF_RANGE');
  }
  const base2=base1.map(p=>({
    x:p.x+translation.x,
    y:p.y+translation.y
  }));
  return {base1,base2,translation};
}

export function validateCommonTranslation(
  base1:P2[],
  base2:P2[],
  eps=1e-9
):boolean{
  if(base1.length!==base2.length || base1.length===0) return false;
  const dx=base2[0].x-base1[0].x;
  const dy=base2[0].y-base1[0].y;
  return base1.every((p,i)=>
    Math.abs((base2[i].x-p.x)-dx)<=eps &&
    Math.abs((base2[i].y-p.y)-dy)<=eps
  );
}

export interface TrapezoidBuildInput{
  largeBaseLength:number;
  smallBaseLength:number;
  horizontalOffset?:number;
  verticalGap:number;
  origin?:P2;
}

export interface Trapezoid2D{
  A:P2; B:P2; C:P2; D:P2;
  ratio:number;
}

export function buildLockedTrapezoid(
  input:TrapezoidBuildInput
):Trapezoid2D{
  const {
    largeBaseLength,
    smallBaseLength,
    verticalGap
  }=input;

  if(!(largeBaseLength>smallBaseLength && smallBaseLength>0)){
    throw new Error('TRAPEZOID_BASE_LENGTH_ORDER_INVALID');
  }
  if(!(verticalGap>0)){
    throw new Error('TRAPEZOID_VERTICAL_GAP_INVALID');
  }

  const O=input.origin??{x:0,y:0};
  const offset=input.horizontalOffset??0;

  // Locked rule: large base AB is horizontal and ABOVE CD.
  const A={x:O.x,y:O.y};
  const B={x:O.x+largeBaseLength,y:O.y};

  const D={x:O.x+offset,y:O.y+verticalGap};
  const C={x:D.x+smallBaseLength,y:D.y};

  return {
    A,B,C,D,
    ratio:largeBaseLength/smallBaseLength
  };
}

export function validateTrapezoidLockedProfile(
  t:Trapezoid2D,
  expectedRatio:number,
  eps=1e-9
):boolean{
  const AB=Math.hypot(t.B.x-t.A.x,t.B.y-t.A.y);
  const CD=Math.hypot(t.C.x-t.D.x,t.C.y-t.D.y);

  const horizontalAB=Math.abs(t.A.y-t.B.y)<=eps;
  const horizontalCD=Math.abs(t.C.y-t.D.y)<=eps;
  const largeAboveSmall=t.A.y<t.D.y && t.B.y<t.C.y;
  const ratioOk=Math.abs(AB/CD-expectedRatio)<=eps;

  return horizontalAB && horizontalCD && largeAboveSmall && ratioOk;
}

export interface BoxSemanticFlags{
  parallelepiped:boolean;
  rectangularBox:boolean;
  cube:boolean;
}

export function classifyBoxSemantic(
  hasThreeParallelFamilies:boolean,
  hasRequiredRightAngles:boolean,
  allRequiredEdgesEqual:boolean
):BoxSemanticFlags{
  const parallelepiped=hasThreeParallelFamilies;
  const rectangularBox=parallelepiped && hasRequiredRightAngles;
  const cube=rectangularBox && allRequiredEdgesEqual;
  return {parallelepiped,rectangularBox,cube};
}
