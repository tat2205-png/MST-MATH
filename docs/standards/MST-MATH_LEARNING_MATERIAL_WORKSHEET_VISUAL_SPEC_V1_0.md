# MST-MATH LEARNING MATERIAL & WORKSHEET VISUAL SPEC V1.0

**Status:** LOCKED / CANONICAL / APPROVED  
**Approved:** 2026-09-08  
**Scope:** PDF and DOCX output profiles `LEARNING-MATERIAL` and `WORKSHEET`  
**Change policy:** V1.0 is immutable. Any change requires a successor version.

## 1. Governing principle

MST-MATH learning documents are **learning-first**. Visuals exist to support understanding, not decoration.

> VISUAL = INFORMATION, NOT DECORATION.

The document must be clean, balanced, readable, printable, and visually consistent. It must not contain advertising, watermarks, decorative captions, unwanted logos, irrelevant ornaments, or unrelated visual noise.

## 2. Shared visual system

`LEARNING-MATERIAL` and `WORKSHEET` use one shared visual language. They may differ in content density and workspace allocation, but not in core typography, figure authority, visual sizing, math notation, or QA rules.

### Learning Material

Priorities:
- concept explanation;
- worked examples;
- pedagogically necessary visuals;
- moderate Student Workspace;
- self-check and answer support.

### Worksheet

Priorities:
- activities and questions;
- larger Student Workspace;
- less decoration;
- direct observation, reasoning, construction, and response.

## 3. Page baseline

Default master page:
- A4 portrait: 210 × 297 mm;
- left margin: 17 mm;
- right margin: 17 mm;
- top margin: 16–18 mm;
- bottom margin: 16–18 mm;
- usable content width: approximately 176 mm.

Do not use decorative full-page frames or background artwork.

## 4. Typography baseline

Recommended baseline:
- body: 12 pt;
- question: 12–12.5 pt;
- heading level 1: 17–18 pt;
- heading level 2: 14–15 pt;
- small necessary annotation: not below 10 pt;
- body line spacing: approximately 1.30–1.40;
- paragraph spacing: 4–6 pt where appropriate.

Do not aggressively reduce font size to force page count. Reflow content first.

## 5. Canonical figure size tokens

All learning and worksheet outputs use the shared figure tokens:

| Token | Maximum bounding box | Primary use |
|---|---:|---|
| `FIG-S` | 52 × 42 mm | small/simple diagram or icon-like visual |
| `FIG-M` | 78 × 58 mm | default illustration size |
| `FIG-L` | 112 × 82 mm | detailed visual requiring inspection |
| `FIG-XL` | 176 × 105 mm | central graph/diagram/model |

`FIG-M` is the default.

The bounding box is not a stretch target. Aspect ratio must always be preserved.

## 6. Comparable figure rule

Figures that play comparable roles must have comparable **visual size**, especially:
- same visual height where practical;
- same label scale;
- same axis style;
- same line weight;
- same font scale;
- same arrow/tick style.

For graph families or 2-up/3-up comparisons, inconsistent visual sizing is a QA failure.

## 7. Visual classes

MST-MATH does not treat all visuals as generic images. Use semantic classes:

1. `MATH_DIAGRAM`
   - geometry, vectors, Oxy/Oxyz, forces, constructions;
   - vector-first;
   - mathematical authority must come from deterministic geometry/math rendering.

2. `MATH_GRAPH`
   - functions, coordinate plots, statistics displays;
   - vector-first;
   - canonical axes, ticks, labels, line weights, and point sizes.

3. `REAL_CONTEXT`
   - clean educational illustration or controlled semi-realistic visual;
   - no unnecessary background clutter;
   - no advertising, branding, watermark, or embedded promotional text.

4. `SEMANTIC_ICON`
   - canonical SVG assets only;
   - used sparingly for navigation/semantic roles, not decoration.

## 8. Canonical layout patterns

Renderer should select from these stable patterns instead of arbitrary placement:

1. `TEXT + VISUAL`
2. `VISUAL + WORKSPACE`
3. `FULL VISUAL`
4. `2-UP COMPARE`
5. `3-UP FAMILY`

For 2-up and 3-up patterns, comparable figures must be normalized to a common visual height/weight.

## 9. Aspect ratio and image integrity

Mandatory:
- preserve aspect ratio;
- no geometric distortion;
- no clipping of relevant content;
- no accidental crop for mathematical figures;
- center within the canonical bounding box when needed.

Never stretch a figure merely to fill its token box.

## 10. Vector and raster policy

Priority:
1. SVG / PDF vector;
2. TikZ / GeoGebra vector export / deterministic graph output;
3. high-resolution PNG;
4. JPEG only when appropriate for photographic content.

For raster assets, target effective resolution at final size: **300 ppi or higher**.

QA guidance:
- ≥300 ppi: PASS;
- 240–299 ppi: WARN;
- <240 ppi: FAIL unless explicitly approved for a justified case.

Do not use screenshots of graphs or GeoGebra when a deterministic/vector export is available.

## 11. Caption and labeling policy

Forbidden:
- decorative captions;
- “Hình minh họa” labels that add no instructional value;
- advertising text;
- watermark text;
- unrelated source/branding visible on the page.

Allowed and required when pedagogically necessary:
- mathematical point labels;
- axes labels;
- lengths, angles, units;
- vector symbols;
- semantic annotations that are part of the problem or explanation.

Mathematical labels are content, not decorative captions.

## 12. Text inside visuals

Avoid embedding editable mathematical text directly in raster illustrations.

Preferred workflow:
- create a clean visual base;
- overlay mathematical labels/data as real vector/text;
- or export a final unified SVG containing the deterministic text/labels.

This preserves sharpness, math correctness, editability, and resize quality.

## 13. Illustration consistency

Each document should lock one `IllustrationStyleID` for real-context visuals.

Within a document, keep consistent:
- viewpoint;
- realism level;
- line style;
- background treatment;
- saturation;
- lighting;
- detail density.

Do not mix unrelated visual languages such as stock photo, cartoon, sketch, and photorealistic render in one document unless explicitly required by pedagogy.

## 14. Semantic icon policy

Semantic Icons are navigation aids, not decoration.

Use canonical assets for roles such as:
- Ghi nhớ;
- Khám phá;
- Ví dụ;
- Luyện tập;
- Thử thách;
- Thực tế;
- Tự kiểm tra.

Do not scatter icons merely to fill empty space.

## 15. Student Workspace

Workspace is a semantic component, not accidental blank space.

Supported forms include:
- lined writing area;
- blank response area;
- grid area;
- graph/construction area.

Worksheet should generally allocate more workspace than Learning Material.

## 16. Contrast and visual clarity

All text, graph lines, labels, and essential non-text graphics must remain clearly distinguishable in print and on screen.

Avoid:
- pale gray body text;
- pastel-on-pastel combinations;
- excessively thin graph lines;
- low-contrast labels;
- visual effects that reduce mathematical clarity.

Color is used to encode meaning, not decorate the page.

## 17. Visual balance QA

Before release, each page must be checked for:
- figure too small/large;
- inconsistent comparable-figure sizing;
- poor alignment;
- excessive density;
- excessive empty space;
- orphan heading;
- question/figure separation;
- figure clipping;
- pixelation;
- distortion;
- style inconsistency;
- unnecessary decoration.

Renderer response order should be:
1. rebalance placement;
2. adjust spacing within tolerance;
3. normalize figure placement/size;
4. reflow content;
5. add/move page content.

Do not solve layout pressure by destroying readability.

## 18. Hard prohibitions

The following are forbidden unless a successor spec explicitly changes them:
- ads;
- watermarks;
- promotional QR codes;
- decorative captions;
- unrelated logos;
- irrelevant clip-art;
- distorted figures;
- inconsistent comparable figure sizing;
- low-resolution mathematical visuals;
- decorative backgrounds that compete with content;
- mathematical authority sourced from non-deterministic illustration.

## 19. Release gate

A Learning Material or Worksheet output is releasable only when:
- content QA passes;
- math/notation QA passes;
- figure QA passes;
- visual balance QA passes;
- pagination/layout QA passes;
- output-specific PDF/DOCX QA passes.

---

**Canonical status:** LOCKED / CANONICAL / APPROVED  
**Change control:** successor version only.