import type {
  SemanticGeometryScene,
  GeometryRelation,
} from '../schemas/geometry-types';

export interface SemanticQaIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export function validateSemanticGeometryScene(
  scene: SemanticGeometryScene
): SemanticQaIssue[] {
  const issues: SemanticQaIssue[] = [];

  if (scene.layoutContract.layoutId !== 'NA-MATH-LAYOUT-V1.3-CANONICAL')
    issues.push({ code:'LAYOUT_BASELINE_CHANGED', severity:'error', message:'Layout must remain V1.3 canonical.' });

  if (scene.layoutContract.layoutStatus !== 'LOCKED' || scene.layoutContract.geometryMayChangeLayout !== false)
    issues.push({ code:'LAYOUT_LOCK_VIOLATION', severity:'error', message:'Geometry layer may not alter the locked layout.' });

  const objectIds = new Set<string>();
  for (const object of scene.objects) {
    if (objectIds.has(object.id))
      issues.push({ code:'DUPLICATE_OBJECT_ID', severity:'error', message:`Duplicate object id: ${object.id}` });
    objectIds.add(object.id);
  }

  const relationIds = new Set<string>();
  for (const relation of scene.relations) {
    if (relationIds.has(relation.id))
      issues.push({ code:'DUPLICATE_RELATION_ID', severity:'error', message:`Duplicate relation id: ${relation.id}` });
    relationIds.add(relation.id);

    for (const ref of relation.objects) {
      if (!objectIds.has(ref))
        issues.push({ code:'UNDEFINED_RELATION_OBJECT', severity:'error', message:`${relation.id} references missing object ${ref}` });
    }

    if (relation.provenance === 'DERIVED' && (!relation.evidence || relation.evidence.length === 0))
      issues.push({ code:'DERIVED_WITHOUT_EVIDENCE', severity:'error', message:`${relation.id} is DERIVED but has no evidence.` });
  }

  const view = scene.availableViewProfiles.find(v => v.id === scene.activeViewProfileId);
  if (!view)
    issues.push({ code:'ACTIVE_VIEW_PROFILE_MISSING', severity:'error', message:'Active view profile is not registered.' });

  if (view) {
    for (const edge of view.edgeStyles) {
      if (!objectIds.has(edge.edgeId))
        issues.push({ code:'VIEW_PROFILE_EDGE_MISSING', severity:'error', message:`View profile references missing edge ${edge.edgeId}` });
      if (edge.source !== 'VIEW_PROFILE')
        issues.push({ code:'EDGE_STYLE_SOURCE_INVALID', severity:'error', message:`Edge ${edge.edgeId} style must originate from VIEW_PROFILE.` });
    }
  }

  for (const claim of scene.claims ?? []) {
    const relation = scene.relations.find(r => r.id === claim.relationId);
    if (!relation) {
      issues.push({ code:'CLAIM_RELATION_MISSING', severity:'error', message:`Claim references missing relation ${claim.relationId}` });
      continue;
    }
    if (claim.requiredForRender && relation.status !== 'VERIFIED')
      issues.push({ code:'RENDER_CLAIM_UNVERIFIED', severity:'error', message:`Required render claim ${relation.id} is not VERIFIED.` });
  }

  if (scene.renderPolicy.noVisualInference !== true)
    issues.push({ code:'VISUAL_INFERENCE_FORBIDDEN', severity:'error', message:'noVisualInference must remain true.' });

  if (scene.renderPolicy.failClosed !== true)
    issues.push({ code:'FAIL_CLOSED_REQUIRED', severity:'error', message:'failClosed must remain true.' });

  return issues;
}
