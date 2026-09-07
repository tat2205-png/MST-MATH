# MST-MATH WORD OUTPUT FORMAT V1.0

**Status:** LOCKED / CANONICAL / APPROVED  
**Approved:** 2026-09-08  
**Scope:** Word/DOCX output for `WORKSHEET`, `LEARNING-MATERIAL`, `ASSESSMENT`, and `SAT`  
**Change policy:** V1.0 is immutable. Any change requires a successor version.

## 1. Governing architecture

Word is a first-class MST-MATH output format alongside PDF.

```text
QuestionIR / DocumentIR
        ↓
   Output Profile
        ↓
 WordMainRenderer
        ↓
      DOCX
```

Do not create separate content branches or engines for each Word document family.

Canonical Word profiles:
- `DOCX-P01 WORKSHEET`
- `DOCX-P02 LEARNING-MATERIAL`
- `DOCX-P03 ASSESSMENT`
- `DOCX-P04 SAT`

One semantic source must be reusable across PDF and DOCX.

## 2. Core principle

> PDF is publication-first. DOCX is editability-first. Both must preserve the same content, semantics, hierarchy, relative visual sizing, math notation, order, workspace semantics, and answer/solution semantics.

Word is not required to be pixel-identical to PDF. The Word renderer may choose a more stable layout when necessary to preserve editability and prevent layout breakage.

## 3. Shared authority with PDF

DOCX uses the same:
- MST-MATH DNA;
- Output Profiles;
- Visual System;
- Math Notation authority;
- Semantic Icon System;
- Figure System;
- FIG-S / FIG-M / FIG-L / FIG-XL tokens;
- content hierarchy;
- answer/solution semantics;
- QA philosophy.

The Learning Material and Worksheet profiles must also obey `MST-MATH LEARNING MATERIAL & WORKSHEET VISUAL SPEC V1.0`.

## 4. Master page baseline

Default:
- A4 portrait: 210 × 297 mm;
- left margin: 17 mm;
- right margin: 17 mm;
- top margin: 17 mm;
- bottom margin: 17 mm.

Assessment profiles may use narrower margins only through an explicit profile setting. Do not vary margins arbitrarily page-by-page.

## 5. Word style system

Formatting must be controlled primarily by named Word Styles, not ad-hoc direct formatting.

Recommended canonical style roles:
- `MST Normal`
- `MST Heading 1`
- `MST Heading 2`
- `MST Question`
- `MST Question Number`
- `MST Option`
- `MST Theory`
- `MST Example`
- `MST Workspace`
- `MST Answer`
- `MST Solution`
- `MST Math Label`
- `MST Header`
- `MST Footer`

Avoid repeated manual font sizing, spacing, bolding, tabbing, and alignment when a style can carry the rule.

## 6. Typography baseline

Recommended:
- body: 12 pt;
- question: 12–12.5 pt;
- heading 1: 17–18 pt;
- heading 2: 14–15 pt;
- answer/solution: 11.5–12 pt;
- footer: 9–9.5 pt;
- body line spacing: approximately 1.25–1.35;
- paragraph spacing: controlled by styles.

Do not use repeated blank paragraphs to create spacing.

## 7. Editable mathematics

Mathematical expressions should remain editable whenever possible.

Preferred pipeline:

```text
Math IR / LaTeX
      ↓
Native Word equation / OMML
      ↓
Editable in Word
```

Rules:
- do not rasterize equations by default;
- do not use equation screenshots;
- do not convert all mathematics to PNG;
- preserve compatibility with the project's Math Notation Assurance rules;
- MathType interoperability may be supported, but mathematical authority remains semantic, not image-based.

## 8. Image anchoring policy

For primary instructional visuals, prefer:
1. `In Line with Text`;
2. stable invisible layout tables when a structured side-by-side layout is required.

Avoid using floating placements such as:
- In Front of Text;
- Behind Text;
- Tight;
- Through;

unless a specific controlled case justifies them.

Floating objects must never be the default mechanism for core question/figure layouts.

## 9. Stable text + visual layout

For `TEXT + VISUAL`, use a stable structure such as a borderless 1-row × 2-column table.

Example semantic layout:

```text
┌──────────────────┬──────────────┐
│ question / text  │    figure    │
└──────────────────┴──────────────┘
```

The structure must survive ordinary text edits without object drift.

## 10. Canonical figure tokens

DOCX uses the shared tokens:
- `FIG-S`
- `FIG-M`
- `FIG-L`
- `FIG-XL`

`FIG-M` remains the default where the shared visual spec applies.

Always lock/preserve aspect ratio. Token bounds are maximum containers, not stretch targets.

## 11. Comparable figures

When two or more comparable visuals appear together:
- normalize visual height/weight;
- align vertically and horizontally;
- use the same label scale;
- use the same axis/line style for comparable graphs;
- use stable table cells rather than free-floating objects.

Unequal comparable figure sizing is a QA failure.

## 12. Vector-first visual policy

Preferred by class:
- `MATH_DIAGRAM`: SVG/vector;
- `MATH_GRAPH`: SVG/vector;
- `SEMANTIC_ICON`: canonical SVG;
- `REAL_CONTEXT`: high-resolution raster or vector illustration as appropriate.

Do not use GeoGebra/graph screenshots when a vector export is available.

## 13. Text and labels in visuals

Avoid embedding editable mathematical labels in raster images.

Preferred:
- deterministic labels rendered as vector/text;
- or a final unified SVG that safely contains the mathematical labels and does not drift when edited in Word.

This rule prevents floating overlay failure and preserves sharpness.

## 14. Student Workspace

Workspace must be a semantic component, not repeated empty lines.

Supported forms:
- `WORKSPACE_LINES`
- `WORKSPACE_BLANK`
- `WORKSPACE_GRID`
- `WORKSPACE_GRAPH`

Use stable paragraph/table dimensions, line counts, or explicit semantic workspace height.

Do not create workspace by pressing Enter repeatedly.

## 15. Header and footer

Use real Word Header/Footer objects.

Page numbering must use fields such as:
- `PAGE`
- `NUMPAGES`

Do not hard-code page numbers into document body text.

Headers/footers must not carry advertising, unwanted logos, watermark content, or distracting ornamentation.

## 16. Semantic pagination controls

Use proper Word pagination controls:
- Page Break;
- Section Break where required;
- Keep with next;
- Keep lines together;
- Page break before.

Do not use repeated Enter/blank paragraphs to push content to another page.

Headings should normally use `Keep with next`.

Question stems, related figures, tables, option groups, and true/false context blocks should remain grouped when practical.

## 17. Multiple-choice layout

Options are semantic components, not text manually positioned with spaces.

Renderer may choose automatically among:
- four options in one row;
- 2 × 2 layout;
- four vertical options.

Choice depends on content width and readability.

Do not use floating text boxes for A/B/C/D options.

## 18. Worksheet DOCX profile

Primary requirements:
- editable questions;
- stable figure placement;
- larger Student Workspace;
- minimal decoration;
- easy teacher modification and printing.

## 19. Learning Material DOCX profile

May include:
- theory blocks;
- remember blocks;
- worked examples;
- diagrams and graphs;
- practice;
- real-context tasks;
- self-check;
- Student Workspace;
- answer key.

Prefer stable paragraph shading, left borders, and table cells over fragile floating text boxes for callouts.

## 20. Assessment DOCX profile

Assessment layout must remain highly editable and stable.

Question/option semantic structure must be preserved so the renderer can adapt layout without rewriting mathematical content.

Do not sacrifice readability to force page count.

## 21. SAT DOCX profile

SAT practice output must remain visually minimal and must not impersonate official College Board/Bluebook material.

Use the MST-MATH SAT practice identity and the SAT-specific rules in `MST-MATH ASSESSMENT & SAT OUTPUT SPEC V1.0`.

## 22. Output modes from one source

When applicable, one semantic source must support:
- `STUDENT`
- `TEACHER`
- `ANSWER_KEY`
- `FULL_SOLUTION`

Student mode may hide solutions and show workspace.

Teacher mode may expose solutions, teacher notes, and optional workspace.

Do not maintain separate manually diverging source documents for these variants.

## 23. DOCX-specific QA

Hard/major checks include:
- no floating-object drift;
- no overlapping images;
- no clipped equations;
- no broken tables;
- no orphan heading;
- no orphan question number;
- no isolated option caused by pagination;
- no unexpected blank page;
- no distorted image;
- no tiny unreadable image;
- comparable figures have comparable size;
- equations remain editable where expected;
- correct page numbering;
- correct header/footer;
- consistent styles;
- no manual spacing abuse.

## 24. Render-and-verify gate

A generated DOCX is not considered valid merely because its OOXML structure is syntactically correct.

Required release flow:

```text
Generate DOCX
    ↓
Render DOCX
    ↓
Inspect pages / visual QA
    ↓
PASS
    ↓
Release DOCX
```

QA must detect:
- clipping;
- object drift;
- unexpected page breaks;
- table breakage;
- equation rendering problems;
- figure inconsistency;
- header/footer problems.

## 25. Hard prohibitions

Do not:
- use repeated Enter/Space/Tab for structural layout;
- rasterize math by default;
- use floating objects as the default layout system;
- distort images;
- place comparable figures at visibly inconsistent sizes;
- create Student Workspace from accidental blank lines;
- hard-code page numbering;
- directly edit the content semantics differently from PDF to make Word fit.

## 26. Release gate

DOCX release requires:
- content QA PASS;
- math/notation QA PASS;
- figure QA PASS;
- profile-specific layout QA PASS;
- DOCX structure/editability QA PASS;
- render-and-verify QA PASS.

---

**Canonical status:** LOCKED / CANONICAL / APPROVED  
**Change control:** successor version only.