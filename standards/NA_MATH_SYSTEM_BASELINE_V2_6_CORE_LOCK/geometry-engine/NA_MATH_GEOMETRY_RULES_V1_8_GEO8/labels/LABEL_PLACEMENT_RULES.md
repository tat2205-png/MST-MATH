# GEO-4 LABEL PLACEMENT RULES

1. Projection and edge visibility are resolved before labels.
2. The active View Profile supplies preferred label directions.
3. Preferred direction is tried first, then seven approved alternatives.
4. A label must remain inside the Geometry Safe Box.
5. No label-label collision.
6. No label may cover another geometry point.
7. No label may touch/cross a rendered edge inside the clearance threshold.
8. No label may overlap right-angle, parallel, equality, angle, formula or legend reserved boxes.
9. The solver never reduces font size to solve a collision.
10. If no legal position exists, render is BLOCKED.
11. True prime glyphs are used for A′, B′, C′, D′.
12. Layout V1.3 remains locked; only label coordinates inside the figure box may change.
