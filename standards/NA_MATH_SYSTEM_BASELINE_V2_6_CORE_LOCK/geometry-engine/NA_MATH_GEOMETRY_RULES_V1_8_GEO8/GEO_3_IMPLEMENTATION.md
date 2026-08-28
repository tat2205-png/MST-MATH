# GEO-3 — Edge Visibility Resolver

Status: COMPLETE / PASS

## Purpose
Convert:
Semantic Geometry + active View Profile
into:
exact edge rendering instructions.

## Hard policy
The renderer is NOT allowed to infer visibility.

### PASS flow
scene segment IDs
→ active profile
→ resolver
→ exact `solid/dashed`
→ source=`VIEW_PROFILE`
→ render

### BLOCK conditions
- unknown View Profile
- edge has no style in active profile
- same edge is both solid and dashed
- profile references missing scene edge
- renderer requests manual visibility override

## Important triangular prism lock
Profile:
TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT

Dashed:
- AB only

Solid:
- CA / BC
- C′A′ / B′C′
- CC′
- AA′
- BB′
- A′B′

The semantic edge IDs BC and B′C′ represent the user-facing directions CB and C′B′.

## Layout
NA-MATH-LAYOUT V1.3 CANONICAL remains unchanged and LOCKED.
