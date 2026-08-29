import { resolveEdgeVisibility } from './edge-visibility-resolver';

export interface GeometryRendererInput {
  scene: {
    activeViewProfileId: string;
    objects: Array<{ id:string; kind:string }>;
  };
  registry: any;
}

export function prepareEdgesForRender(input: GeometryRendererInput) {
  const sceneEdges = input.scene.objects
    .filter(o => o.kind === 'segment')
    .map(o => ({ id:o.id, kind:'segment' as const }));

  const resolution = resolveEdgeVisibility(
    sceneEdges,
    input.scene.activeViewProfileId,
    input.registry
  );

  if (resolution.status !== 'PASS') {
    throw new Error(`GEOMETRY_RENDER_BLOCKED:${resolution.errors.join('|')}`);
  }

  return resolution.edges;
}
