// GEO-5 — Pyramid Altitude Inference Engine
// Fail-closed: a template fires only when every premise is VERIFIED.

export type FactStatus='UNPROVEN'|'PARTIAL'|'VERIFIED'|'REJECTED';
export type Provenance='GIVEN'|'CONSTRUCTED'|'DERIVED'|'CONFIRMED';

export interface GeometryFact{
  id:string;
  type:string;
  objects:string[];
  status:FactStatus;
  provenance:Provenance;
  evidence?:string[];
}

export interface RulePremise{
  type:string;
  objects:string[];
  status:'VERIFIED';
}

export interface RuleConclusion{
  type:string;
  objects:string[];
  provenance:'DERIVED'|'CONFIRMED';
  status:'VERIFIED';
}

export interface InferenceTemplate{
  id:string;
  premises:RulePremise[];
  derive:RuleConclusion[];
}

export interface InferenceResult{
  status:'PASS'|'NO_INFERENCE'|'BLOCKED';
  templateId:string;
  derived:GeometryFact[];
  missingPremises:string[];
}

function key(type:string,objects:string[]):string{
  return `${type}:${objects.join('|')}`;
}

function factMatchesPremise(f:GeometryFact,p:RulePremise):boolean{
  return f.type===p.type &&
    f.status==='VERIFIED' &&
    f.objects.length===p.objects.length &&
    f.objects.every((x,i)=>x===p.objects[i]);
}

export function applyInferenceTemplate(
  template:InferenceTemplate,
  facts:GeometryFact[]
):InferenceResult{
  const missing:string[]=[];

  for(const premise of template.premises){
    if(!facts.some(f=>factMatchesPremise(f,premise))){
      missing.push(key(premise.type,premise.objects));
    }
  }

  if(missing.length){
    return {
      status:'NO_INFERENCE',
      templateId:template.id,
      derived:[],
      missingPremises:missing
    };
  }

  const derived:GeometryFact[]=template.derive.map((d,i)=>({
    id:`${template.id}:D${i+1}`,
    type:d.type,
    objects:d.objects,
    status:'VERIFIED',
    provenance:d.provenance,
    evidence:template.premises.map(p=>key(p.type,p.objects))
  }));

  return {
    status:'PASS',
    templateId:template.id,
    derived,
    missingPremises:[]
  };
}

export function canRenderVerticalAltitude(
  facts:GeometryFact[],
  altitudeSegmentId='SH',
  basePlaneId='BASE_PLANE'
):boolean{
  const perp=facts.some(
    f=>f.type==='perpendicular' &&
       f.status==='VERIFIED' &&
       f.objects[0]===altitudeSegmentId &&
       f.objects[1]===basePlaneId
  );

  const altitude=facts.some(
    f=>f.type==='altitude' &&
       f.status==='VERIFIED' &&
       f.objects.length===1 &&
       f.objects[0]===altitudeSegmentId
  );

  return perp && altitude;
}
