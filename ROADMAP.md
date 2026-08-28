# MATH AI STUDIO — MASTER ROADMAP

> Long-term development order for the entire Math AI Studio ecosystem.

> **Release freeze:** REL-01 stabilization is complete and verified. REL-02 is
> packaging the release-candidate checkpoint; no roadmap feature phase may
> begin until the freeze is explicitly lifted.

---

# DEVELOPMENT ORDER

## POST-QB INTEGRATION CHECKPOINT

- [x] MAS-INT-01 — Post-QB Studio integration and runtime readiness
- [x] UX-01 — Teacher Golden Workflow
- [ ] E2E-TEACHER-01 — deferred acceptance phase

The executable readiness evidence is recorded in
`MAS_INT_01_RUNTIME_READINESS.md`. UX-01 is the next product-integration task;
it must reuse the frozen Question Bank and existing Studio engines.

## PHASE 1 — CORE FOUNDATION

- [x] Math AI Studio Core
- [x] Manim Integration
- [x] LuaDraw Integration
- [x] Studio Engine Registry
- [x] Golden Path Runtime
- [x] Core stabilization and integration QA (REL-01)

---

## PHASE 2 — UNIVERSAL MATH ENGINE

- [ ] MV-0 — Universal Dynamic Math Semantics
- [ ] Mathematical Object Model
- [ ] Semantic Relations
- [ ] Constraint Engine
- [ ] Dependency Graph
- [ ] Dynamic Geometry
- [ ] 2D / 3D semantic synchronization

---

## PHASE 3 — FOLD / UNFOLD ENGINE

- [ ] Fold / Unfold stabilization
- [ ] Pattern Authoring
- [ ] Cut Lines
- [ ] Crease Lines
- [ ] Dashed Fold Lines
- [ ] Free Fold
- [ ] Base visibility controls
- [ ] Cone / Frustum adjustable net angle
- [ ] Advanced shortest surface path

---

## PHASE 4 — DOCUMENT ENGINE

- [ ] Image ingestion
- [ ] PDF ingestion
- [ ] DOCX ingestion
- [ ] OMML parsing
- [ ] LaTeX parsing
- [ ] Math normalization
- [ ] Vietnamese spelling normalization
- [ ] Mathematical notation QA
- [ ] Figure preservation
- [ ] DOCX export
- [ ] PDF export
- [ ] LaTeX export

---

## PHASE 5 — QUESTION BANK

- [x] QB-1A — Real document question segmentation and OMML/LaTeX parsing
- [x] QB-1B — Question extraction and normalization
- [x] QB-1C — Figure/question association
- [x] QB-1D — Question Bank persistence and integration
- [x] QB-1E — Import → QA → Bank end-to-end
- [x] QB-1F — Search, filter, and safe reuse
- [x] QB-2A — Deterministic assessment generation
- [x] QB-2B — Assessment-backed classroom game integration
- [x] QB-2C — Solution/video integration
- [x] QB-2D — JSON/LaTeX/DOCX/PDF export and delivery
- [x] QB-3A — Final end-to-end acceptance and baseline freeze
- [ ] QB-3 — Knowledge tagging
- [ ] QB-4 — Difficulty classification

Question Bank core is feature-frozen after QB-3A. Knowledge tagging and
difficulty enrichment remain explicitly outside the accepted core baseline.

---

## PHASE 6 — TEXTBOOK STYLE / DOCUMENT RENDERER

- [x] NA-MATH-TEXTBOOK-STYLE V1.0 specification
- [ ] Typography normalization
- [ ] Math font consistency
- [ ] Figure layout
- [ ] Prevent figure overlap
- [ ] Page balancing
- [ ] Whitespace optimization
- [ ] A4 rendering
- [ ] DOCX rendering
- [ ] PDF rendering

---

## PHASE 7 — CONTENT INTELLIGENCE

- [ ] Exam Generator
- [ ] Exam Pattern Inference
- [ ] Real-world Problem Generator
- [ ] GDPT 2018 Mapping
- [ ] Knowledge / competency mapping
- [ ] Generate next exam from 3+ source exams

---

## PHASE 8 — CLASSROOM SYSTEM

- [ ] Classroom Game Engine
- [ ] Olympia Mode
- [ ] Quiz Mode
- [ ] Team Battle
- [ ] Student Assignment
- [ ] Submission System
- [ ] Student Progress Tracking
- [ ] Assessment Analytics

---

# PRIORITY RULE

Do not start a lower-priority system when its required upstream engine is not stable.

Question Bank should precede:
- Exam Generator
- Classroom Game Engine
- Student Assessment

Document Engine should support:
- Question Bank
- Textbook Renderer
- Exam ingestion

Universal Math Semantics should be reused by:
- Visual Engine
- Fold / Unfold
- Dynamic Geometry
- Mathematical diagrams
