# GEO-2 — View Profile Registry

Status: COMPLETE / PASS

## Goal
Remove all renderer guessing about visible/hidden edges.

## Delivered
- Central View Profile Registry.
- Unknown profile => BLOCK_RENDER.
- Visibility source => VIEW_PROFILE_ONLY.
- Parallel projection required for core 3D school geometry.
- Explicit triangular-prism profile.
- Explicit box/parallelepiped profile.
- Explicit quadrilateral-pyramid baseline profile.
- Proven-altitude profile.
- Trapezoid base profile.
- Parallel-planes skew-lines profile.
- Generic prism translation template.
- View Profile QA validator.
- Golden GEO-2 corpus.

## Locked triangular prism rule
TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT

Dashed:
- AB only

Solid:
- CA
- CB
- C′A′
- C′B′
- CC′
- AA′
- BB′
- A′B′

## Layout protection
NA-MATH-LAYOUT V1.3 CANONICAL remains LOCKED.
No profile is allowed to alter layout.
