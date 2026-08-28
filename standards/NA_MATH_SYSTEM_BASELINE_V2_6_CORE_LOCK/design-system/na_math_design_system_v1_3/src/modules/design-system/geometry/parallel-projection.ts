export interface Vec3 { x: number; y: number; z: number }
export interface Vec2 { x: number; y: number }

export interface ParallelProjectionBasis {
  ex: Vec2;
  ey: Vec2;
  ez: Vec2;
  origin?: Vec2;
}

export function projectParallel(p: Vec3, basis: ParallelProjectionBasis): Vec2 {
  const o = basis.origin ?? { x: 0, y: 0 };
  return {
    x: o.x + p.x * basis.ex.x + p.y * basis.ey.x + p.z * basis.ez.x,
    y: o.y + p.x * basis.ex.y + p.y * basis.ey.y + p.z * basis.ez.y,
  };
}
