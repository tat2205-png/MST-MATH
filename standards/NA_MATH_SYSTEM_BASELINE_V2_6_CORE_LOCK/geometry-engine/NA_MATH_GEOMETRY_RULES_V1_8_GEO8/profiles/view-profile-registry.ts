import type { ViewProfile } from '../schemas/geometry-types';

export type ViewProfileStatus = 'LOCKED' | 'BASELINE' | 'TEMPLATE';

export interface RegisteredViewProfile extends ViewProfile {
  family: string;
  objectType: string;
  status: ViewProfileStatus;
  forbidden?: string[];
}

export interface ViewProfileRegistry {
  version: string;
  visibilitySource: 'VIEW_PROFILE_ONLY';
  unknownProfilePolicy: 'BLOCK_RENDER';
  profiles: RegisteredViewProfile[];
}

export function requireViewProfile(
  registry: ViewProfileRegistry,
  id: string
): RegisteredViewProfile {
  const profile = registry.profiles.find(p => p.id === id);
  if (!profile) {
    throw new Error(`UNKNOWN_VIEW_PROFILE:${id}`);
  }
  return profile;
}

export function resolveEdgeStyle(
  profile: RegisteredViewProfile,
  edgeId: string
): 'solid' | 'dashed' {
  const rule = profile.edgeStyles.find(r => r.edgeId === edgeId);
  if (!rule) {
    throw new Error(`EDGE_STYLE_UNSPECIFIED:${profile.id}:${edgeId}`);
  }
  return rule.style;
}
