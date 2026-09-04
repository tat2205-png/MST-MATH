# MST-MATH OUTPUT VISUAL IDENTITY V1.0 — PROPOSAL

STATUS: DRAFT_FOR_HUMAN_APPROVAL  
ROLE: CANONICAL_CANDIDATE / OUTPUT VISUAL BINDING LAYER  
ROOT: MST-MATH-DNA-V1.0  
PRINCIPLE: ONE EDUCATIONAL BRAND — MANY OUTPUT MODES — NO PARALLEL DESIGN SYSTEM

## 1. Purpose

Create one coherent educational-brand identity for every MST-MATH output while preserving the different pedagogical function of each output.

The system MUST NOT make every output visually identical. It MUST make every output visibly related to the same MST-MATH educational brand.

Canonical formula:

`MST-MATH CORE IDENTITY + OUTPUT-SPECIFIC VISUAL PROFILE = FINAL OUTPUT IDENTITY`

## 2. Existing locked authorities retained

This proposal does not replace or rewrite existing locked authorities.

- Brand root: `MST-MATH-DNA-V1.0`
- Layout: `NA_MATH_LAYOUT_V1_3`
- Typography: `NA_MATH_TYPOGRAPHY_STANDARD_V1_0`
- Color: `NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0`
- Components: `NA_MATH_DESIGN_SYSTEM_V1_3`
- Icons: `MST-MATH-DNA-SEMANTIC-ICONS-V1.1`
- Accessibility: `MST_MATH_ACCESSIBILITY_CANONICAL_V1.0`
- Video visual authority: `MST_MATH_VIDEO_VISUAL_CANONICAL_V2.0`
- Dynamic geometry authority: `MST_MATH_DNA_DYNAMIC_GEOMETRY_VISUALIZATION_V1.0`
- Game reference: `GAME_01_OLYMPIA_REFERENCE_V1`

Renderers and modules remain consumers. They are not allowed to define canonical fonts, colors, icons, layout systems, or mathematical semantics.

## 3. Critique of current state

### What is already strong

1. Document typography roles are explicit and machine-readable.
2. Output identity colors already distinguish Learning Material, Worksheet, Exercise Sheet and Video.
3. Semantic Icons V1.1 already provide a cross-format identity contract.
4. Video has strong macro-layout authority.
5. Game has strong state/screen/gameplay architecture.
6. Dynamic Geometry/FOLD already preserve mathematical geometry authority.

### What is incomplete

1. There is no single registry binding P01–P12 to layout + typography + type scale + color + icon + component + motion authorities.
2. P04 Exercise Sheet has color identity but lacks an explicit output-layout policy.
3. Video has font-family authority but lacks an explicit readable type scale for 1080p/720p/480p.
4. Game has screen composition but lacks a complete visual system for typography sizes, spacing, color-role usage and semantic feedback.
5. Interactive outputs do not have one shared screen-type-scale policy.
6. Some output profiles can therefore be implemented correctly in semantics but inconsistently in visual execution.

## 4. Design principles to lock after approval

### V-01 — CORE BEFORE PROFILE
Every output inherits MST-MATH Core before applying output-specific rules.

### V-02 — SEMANTIC CONSISTENCY, NOT VISUAL SAMENESS
The same semantic role keeps the same meaning, icon identity and typography logic across outputs, but dimensions may adapt to print, screen, video or classroom-display context.

### V-03 — NO LOCAL PALETTE
An output may bind existing MST-MATH color tokens. It may not invent a local canonical palette.

### V-04 — NO FONT SHRINK TO HIDE OVERFLOW
If content does not fit, reflow, paginate, split scenes or reduce content density. Do not silently shrink below the approved readable minimum.

### V-05 — MATH FIRST
Mathematical readability outranks decoration, branding, animation and game-show effects.

### V-06 — ONE SEMANTIC ICON AUTHORITY
Pedagogical/semantic icons come from `MST-MATH-DNA-SEMANTIC-ICONS-V1.1` unless a later explicitly approved version supersedes it.

### V-07 — NON-COLOR-ONLY FEEDBACK
Correct/wrong/warning/state feedback must use text and/or semantic icon/state structure in addition to color.

### V-08 — GRAYSCALE SAFE FOR PRINT
Print profiles must remain understandable in grayscale.

### V-09 — OUTPUT PROFILE OWNS COMPOSITION, NOT CONTENT TRUTH
Output visual profiles may define composition and renderer adaptation only. They may not change source content, math, geometry or provenance.

### V-10 — AUTHOR ONCE — RENDER MANY
The visual profile is resolved before the renderer. PDF, DOCX, HTML, Slides and Video adapters preserve the same semantic identity.

## 5. Shared typography identity

Print/document roles remain:

- Document title: STIX Two Text Bold — 20 pt
- Chapter: STIX Two Text Bold — 16 pt
- Section 1: XCharter Bold — 13.5 pt
- Section 2: XCharter Semibold — 12 pt
- Body / Question: Libertinus Serif — 11 pt
- Inline Math: Libertinus Math — 11 pt
- Display Math: Libertinus Math — 11.5–12 pt
- Note: Libertinus Serif — 10 pt
- Table: Libertinus Serif — 10 pt
- Caption / Figure label: 9.5 pt
- Header: 9 pt
- Footer: 8.5 pt

Interactive UI identity:

- UI/chrome: Source Sans 3
- Reading content: Libertinus Serif
- Math: Libertinus Math
- Display/academic title when appropriate: STIX Two Text / XCharter according to canonical role

## 6. Shared color identity

Only existing core tokens are used:

- Deep Navy `#0C2D57`
- Teal `#0C9A94`
- Blue `#1E63B5`
- Green `#2F8F68`
- Amber `#D9911B`
- Purple `#6B4FA3`
- Paper `#FCFCFA`
- Ink `#18212B`
- Muted `#66717D`
- Line `#D8E0E6`

Primary output bindings:

- Learning Material: Deep Navy
- Worksheet: Green
- Exercise Sheet / Test / Exam family: Purple, grayscale-safe
- Video: Amber + Deep Navy
- Interactive geometry: Core neutral/navy/teal + mathematical semantic roles; no decorative recoloring
- Game: Core Deep Navy base, Amber event emphasis, Green confirmed-success, Purple challenge/accent, Blue information, Paper/Ink/Line neutrals

Wrong-answer state in Game MUST NOT require a new red palette token. It uses explicit `SAI` text/state, warning icon where semantically appropriate, strong Ink/Line contrast and non-color-only feedback. A future global ERROR color may only be introduced by a separate approved core-color revision.

## 7. Output profile policy

### P01 — LEARNING MATERIAL
- Medium: A4-first multi-render document
- Layout: Layout V1.3 + Textbook Style V1.0
- Color: learning_material / Deep Navy
- Icons: Semantic Icons V1.1
- Approx. text:illustration ratio when appropriate: 3/4:1/4
- Student workspace is not automatically the dominant identity; use P03 when workspace is the primary purpose.

### P02 — LESSON PLAN
- Medium: A4-first teacher document
- Layout: Layout V1.3
- Typography: canonical document roles
- Color: Learning/brand-neutral Deep Navy; no new palette
- Structure prioritizes teacher actions, student actions, products and assessment evidence.

### P03 — WORKSHEET / STUDENT WORKSPACE
- Medium: A4-first writable student document
- Layout: Student Workspace V1.2 + Layout V1.3
- Color: worksheet / Green
- Workspace is a first-class component.
- Figures and answer/work areas must not overlap.

### P04 — EXERCISE SHEET
- Medium: A4-first practice document
- Color: exercise_sheet / Purple
- Question density may be higher than P01 but readability remains above density.
- Keep question with its primary figure where feasible.
- Workspace is adaptive, not mandatory full-page Student Workspace.

### P05 / P06 — TEST AND EXAM FAMILY
- Medium: A4 print-first assessment
- Color: Purple used sparingly; grayscale-safe
- Layout: exam profile owns section structure; core owns typography/color/spacing semantics
- No decorative cards, banners or icon noise in formal exam mode.

### P07 — VIDEO
- Medium: 1920x1080 16:9 canonical
- Layout: Question Top 26%; Main 74%; Solution Left 60%; Geometry Right 40%
- Color: video / Amber + Deep Navy
- Type scale: `MST_MATH_VIDEO_TYPE_SCALE_V1.0` candidate
- Motion: pedagogical only
- No auto-swap, random motion, excessive zoom or macro-layout mutation.

### P08 — GEOGEBRA
- Medium: interactive mathematical workspace
- Typography: Source Sans 3 UI + Libertinus Math for math
- Geometry authority remains semantic geometry/DGK; UI is non-authoritative
- Color follows core semantic roles; no random/decorative recoloring
- Toolbar/controls remain readable and distinct from mathematical canvas.

### P09 — FOLD
- Medium: synchronized 2D/3D interactive workspace
- Layout: canonical dual synchronized view where applicable
- Preserve identity of vertices, edges, faces and fold state
- Color is semantic, not decorative
- UI typography follows interactive MST-MATH roles.

### P10 — GAME
- Medium: classroom TV/projector first
- Architecture: GAME-01 reference and ClassroomGameEngine
- Visual candidate: `MST_MATH_GAME_VISUAL_SYSTEM_V1.0`
- Question/math readability outranks game effects
- State, timer, score and answer feedback are deterministic and non-color-only.

### P11 — DIGITAL AI LESSON
- Medium: interactive learning surface
- Uses P01 pedagogical identity + P12 UI identity
- No independent palette or typography system
- Activity state and AI feedback use semantic icons and accessible status text.

### P12 — APP UI
- Medium: desktop/tablet/web
- UI font: Source Sans 3
- Content/math may use Libertinus Serif / Libertinus Math
- Core navy/teal/neutrals
- UI components consume Design System V1.3
- UI must not contain business or mathematical authority.

## 8. Candidate additions in this change

1. `MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY_V1.0`
2. `MST_MATH_VIDEO_TYPE_SCALE_V1.0`
3. `MST_MATH_GAME_VISUAL_SYSTEM_V1.0`
4. QA gate validating all active P01–P12 output families resolve visual authority without creating a parallel design system.

These additions remain `DRAFT_FOR_HUMAN_APPROVAL` until the product owner explicitly approves/locks them.

## 9. Approval criteria

Before promotion to LOCKED/CANONICAL:

- One Golden Case for P01
- One Golden Case for P03
- One Golden Case for P04
- One Golden Case for P06 formal exam
- One Golden Case for P07 video at 1080p
- One Golden Case for P10 game on classroom display
- Typography/readability QA PASS
- Grayscale QA PASS for print profiles
- Icon identity QA PASS
- No-overlap QA PASS
- Accessibility QA PASS
- No local authority / no duplicate design-system QA PASS

## 10. Final proposed rule

`ONE MST-MATH EDUCATIONAL BRAND`  
`ONE CORE DESIGN AUTHORITY`  
`ONE OUTPUT VISUAL PROFILE REGISTRY`  
`MANY PEDAGOGICALLY DISTINCT OUTPUTS`  
`NO PARALLEL STYLE SYSTEMS`
