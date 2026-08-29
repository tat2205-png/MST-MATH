// GEO-9 — Locked V1.3 geometry adapter.
// This adapter never changes layout dimensions or component placement.

import type {
  GeometryRenderRequest,
  GeometryRenderEnvelope,
  InnerGeometrySafeBox,
} from './geometry-integration-types';

const INNER_INSET_RATIO = 0.04;

export function assertGeometryQa(request: GeometryRenderRequest): void {
  const failed = Object.entries(request.qa)
    .filter(([, pass]) => pass !== true)
    .map(([name]) => name);

  if (failed.length) {
    throw new Error(`GEOMETRY_INTEGRATION_BLOCKED_QA:${failed.join(',')}`);
  }
}

export function computeInnerSafeBox(
  request: GeometryRenderRequest
): InnerGeometrySafeBox {
  const { slot } = request;

  if (!(slot.width > 0 && slot.height > 0)) {
    throw new Error('INVALID_FIGURE_SLOT');
  }

  const inset = Math.min(slot.width, slot.height) * INNER_INSET_RATIO;

  return {
    x: slot.x + inset,
    y: slot.y + inset,
    width: slot.width - 2 * inset,
    height: slot.height - 2 * inset,
  };
}

export function prepareGeometryRenderEnvelope(
  request: GeometryRenderRequest
): GeometryRenderEnvelope {
  assertGeometryQa(request);

  return {
    layoutKind: request.slot.layoutKind,
    outerSlot: request.slot,
    innerSafeBox: computeInnerSafeBox(request),
    clipToOuterSlot: true,
    layoutMutationAllowed: false,
  };
}

// Geometry cannot ask the layout to move/resize the figure card.
export function rejectLayoutMutationRequest(
  mutation:
    | undefined
    | {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        header?: boolean;
        footer?: boolean;
        mainVisualRatio?: number;
      }
): void {
  if (mutation && Object.keys(mutation).length > 0) {
    throw new Error('V1_3_LAYOUT_MUTATION_FORBIDDEN');
  }
}
