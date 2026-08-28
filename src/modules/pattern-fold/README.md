# Pattern Fold Engine V1

Renderer-neutral cut/crease pattern reconstruction. `PatternSheet` keeps shape semantics explicit; cuts remove/separate material, creases alone create rigid fold adjacency. `buildPatternTopology` validates containment and creates the fold graph. `computePatternFoldState` composes exact rigid transforms around crease axes, with explicit sequence, angle, step and progress controls. SVG/TikZ export and Three.js/Manim boundaries consume the same `PatternFoldScene`.

Sign convention: valley folds use positive right-hand rotation about the directed crease axis; mountain folds use negative rotation. `UNASSIGNED` defaults to positive and remains explicitly identified in source data.
