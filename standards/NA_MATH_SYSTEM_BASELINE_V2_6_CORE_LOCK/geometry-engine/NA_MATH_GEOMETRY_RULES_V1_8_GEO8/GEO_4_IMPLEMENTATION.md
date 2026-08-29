# GEO-4 — Label Placement & Collision Solver
Status: PASS

- Runs after projection + visibility.
- Profile hint first; approved alternatives second.
- Blocks label-label, label-point, label-edge, label-marker and safe-box collisions.
- Font shrinking to solve geometry collisions is forbidden.
- Failure to find a safe label position blocks render.
- Layout V1.3 remains LOCKED.
