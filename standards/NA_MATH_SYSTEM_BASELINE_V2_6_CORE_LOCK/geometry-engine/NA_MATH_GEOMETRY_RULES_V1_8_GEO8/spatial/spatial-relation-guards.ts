// GEO-7 — Spatial Relation Guards

export type RelationStatus='UNPROVEN'|'PARTIAL'|'VERIFIED'|'REJECTED';

export interface SpatialFact{
  type:string;
  objects:string[];
  status:RelationStatus;
}

export interface SpatialValidationResult{
  status:'PASS'|'BLOCKED';
  errors:string[];
}

function hasFact(
  facts:SpatialFact[],
  type:string,
  objects:string[]
):boolean{
  return facts.some(
    f=>f.type===type &&
       f.status==='VERIFIED' &&
       f.objects.length===objects.length &&
       f.objects.every((x,i)=>x===objects[i])
  );
}

export function validateSkewLines(
  facts:SpatialFact[],
  a='a',
  b='b'
):SpatialValidationResult{
  const errors:string[]=[];

  if(!hasFact(facts,'disjoint',[a,b]))
    errors.push('SKEW_REQUIRES_DISJOINT_LINES');

  if(!hasFact(facts,'nonparallel',[a,b]))
    errors.push('SKEW_REQUIRES_NONPARALLEL_DIRECTIONS');

  if(!hasFact(facts,'noncoplanar',[a,b]))
    errors.push('SKEW_REQUIRES_NONCOPLANAR_LINES');

  return {
    status:errors.length?'BLOCKED':'PASS',
    errors
  };
}

export function validateParallelPlanesWithSkewLines(
  facts:SpatialFact[]
):SpatialValidationResult{
  const errors:string[]=[];

  if(!hasFact(facts,'parallel',['P','Q']))
    errors.push('PLANES_NOT_VERIFIED_PARALLEL');

  if(!hasFact(facts,'lies-in',['a','P']))
    errors.push('A_NOT_VERIFIED_IN_P');

  if(!hasFact(facts,'lies-in',['b','Q']))
    errors.push('B_NOT_VERIFIED_IN_Q');

  if(!hasFact(facts,'nonparallel',['a','b']))
    errors.push('A_B_NONPARALLEL_NOT_VERIFIED');

  return {
    status:errors.length?'BLOCKED':'PASS',
    errors
  };
}

export function assertProjectedCrossingIsNotIntersection(
  semanticIntersectionExists:boolean,
  rendererRequestsIntersectionMarker:boolean
):void{
  if(rendererRequestsIntersectionMarker && !semanticIntersectionExists){
    throw new Error('FALSE_INTERSECTION_MARKER_FORBIDDEN');
  }
}

export function assertNoDecorativePlaneConnectors(
  requestedConnectorCount:number
):void{
  if(requestedConnectorCount>0){
    throw new Error('DECORATIVE_PLANE_CONNECTORS_FORBIDDEN');
  }
}
