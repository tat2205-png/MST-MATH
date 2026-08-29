// GEO-3 repaired in V1.4 inheritance layer.
export type EdgeStyle='solid'|'dashed';

export interface SceneEdge { id:string; kind:'segment'; }
export interface ResolvedEdge {
  edgeId:string;
  canonicalEdgeId:string;
  style:EdgeStyle;
  source:'VIEW_PROFILE';
}
export interface VisibilityProfile {
  id:string;
  status:'LOCKED'|'BASELINE'|'TEMPLATE';
  edge_styles:{solid:string[];dashed:string[]};
}
export interface VisibilityRegistry {
  rules:{
    visibility_source:'VIEW_PROFILE_ONLY';
    unknown_profile_policy:'BLOCK_RENDER';
  };
  profiles:VisibilityProfile[];
}
export interface VisibilityResolveResult {
  status:'PASS'|'BLOCKED';
  profileId:string;
  edges:ResolvedEdge[];
  errors:string[];
}

const ABSTRACT=new Set(['all_boundary_edges','plane_outlines','a','b']);

export function canonicalizeUndirectedEdgeId(edgeId:string):string{
  if(ABSTRACT.has(edgeId)) return edgeId;
  const labels=edgeId.match(/[A-Za-z](?:′)?/g);
  if(!labels || labels.length!==2 || labels.join('')!==edgeId) return edgeId;
  return [...labels].sort((a,b)=>a.localeCompare(b)).join('');
}

function cset(values:string[]):Set<string>{
  return new Set(values.map(canonicalizeUndirectedEdgeId));
}

export function resolveEdgeVisibility(
  sceneEdges:SceneEdge[],
  profileId:string,
  registry:VisibilityRegistry
):VisibilityResolveResult{
  const errors:string[]=[];

  if(registry.rules.visibility_source!=='VIEW_PROFILE_ONLY'){
    errors.push('VISIBILITY_SOURCE_NOT_PROFILE_ONLY');
  }

  const profile=registry.profiles.find(p=>p.id===profileId);
  if(!profile){
    return {status:'BLOCKED',profileId,edges:[],errors:['UNKNOWN_VIEW_PROFILE']};
  }

  const solid=cset(profile.edge_styles.solid??[]);
  const dashed=cset(profile.edge_styles.dashed??[]);
  for(const e of solid) if(dashed.has(e)) errors.push(`CONFLICTING_EDGE_STYLE:${e}`);

  const sceneCanon=new Set(sceneEdges.map(e=>canonicalizeUndirectedEdgeId(e.id)));
  const resolved:ResolvedEdge[]=[];

  for(const e of sceneEdges){
    const ce=canonicalizeUndirectedEdgeId(e.id);
    const s=solid.has(ce), d=dashed.has(ce);
    if(!s&&!d){ errors.push(`EDGE_STYLE_UNSPECIFIED:${e.id}`); continue; }
    if(s&&d){ errors.push(`EDGE_STYLE_AMBIGUOUS:${e.id}`); continue; }
    resolved.push({
      edgeId:e.id,
      canonicalEdgeId:ce,
      style:d?'dashed':'solid',
      source:'VIEW_PROFILE'
    });
  }

  for(const e of [...solid,...dashed]){
    if(!ABSTRACT.has(e) && !sceneCanon.has(e)){
      errors.push(`PROFILE_REFERENCES_MISSING_EDGE:${e}`);
    }
  }

  return {
    status:errors.length?'BLOCKED':'PASS',
    profileId,
    edges:errors.length?[]:resolved,
    errors
  };
}

export function assertNoRendererVisibilityOverride(v:EdgeStyle|undefined):void{
  if(v!==undefined) throw new Error('MANUAL_VISIBILITY_OVERRIDE_FORBIDDEN');
}
