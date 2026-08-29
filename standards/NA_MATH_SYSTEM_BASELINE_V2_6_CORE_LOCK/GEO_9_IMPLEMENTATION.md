# GEO-9 — Geometry Integration into Locked V1.3 Layouts

## Architectural rule

The V1.3 design system is copied byte-for-byte and treated as immutable.

Geometry is integrated as a sibling engine and may only render inside the
existing `geometry-figure-card` slot.

### Geometry may change
- point coordinates inside the figure slot,
- projection/view profile,
- solid/dashed edges,
- labels and markers,
- semantic auxiliary geometry that is mathematically proven.

### Geometry may not change
- header/footer,
- page/video structure,
- card positions,
- column ratios,
- `mainVisualRatio`,
- problem bar ratio,
- fonts/colors/layout tokens,
- figure-card outer bounds.

## Four outputs

1. Tài liệu học tập → document slot.
2. Phiếu học tập → worksheet slot.
3. Phiếu bài tập → assessment slot.
4. Video bài giảng → video slot.

## Gate

Any geometry result must:
1. pass GEO-1 → GEO-8 regression,
2. pass the current geometry QA,
3. be clipped to the read-only figure slot,
4. not request any V1.3 layout mutation.

Failure at any step => integration blocked.
