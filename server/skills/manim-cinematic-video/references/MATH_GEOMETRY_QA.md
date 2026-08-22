# Math and Geometry QA

## Mathematical correctness

Validate formulas, notation, domains, signs, labels, transformations, and numerical values independently of visual appearance.

## Zero-inference geometry

For source-dependent geometry:

- never add unseen edges/faces/points;
- never change projection direction;
- never change camera perspective to hide inconsistency;
- never "beautify" geometry by changing proportions;
- derive projections only from verified geometry.

## Fail-closed behavior

If a construction cannot be determined from evidence, stop that construction and report the exact unresolved dependency.

## Plot QA

For graphs, validate:

- function definition;
- domain;
- roots/intercepts;
- extrema;
- asymptotes;
- scale and axis labels;
- plotted sample values.

Never generate a decorative graph unrelated to the function.

## Frame geometry QA

Check:

- all critical objects within frame bounds;
- no text/diagram collisions;
- labels remain attached to their intended point/edge;
- no accidental duplicates;
- hidden/visible line conventions remain consistent.
