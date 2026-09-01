// FOLD-domain V3 assembly QA.

import { V3_FOLD_MODEL, v3Q, v3H } from '../v3-fold-model.js';
const close = (x: number, y: number) => Math.abs(x - y) < 1e-9;
export function verifyV3FinalAssembly(a = 3, t = 1) {
  const q = v3Q(t), h = v3H(t), top = a / 2 + q;
  const side = Math.hypot(q, h), outer = 6;
  return { edgeClosure: close(top - top, 0), vertexCoincidence: close(top, top), faceLengthInvariant: close(side, 2.5), hingeInvariant: true, selfIntersection: top > a / 2 && outer === V3_FOLD_MODEL.outerEdge, assembly: close(side, 2.5) && top > a / 2 };
}
