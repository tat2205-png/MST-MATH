# MATH AI STUDIO — MASTER ROADMAP

> Long-term development order for the entire Math AI Studio ecosystem.

> **Release freeze:** REL-01 stabilization is complete and verified. REL-02 is
> packaging the release-candidate checkpoint; no roadmap feature phase may
> begin until the freeze is explicitly lifted.

---

# DEVELOPMENT ORDER

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

- [ ] QB-1 — Document understanding
- [ ] QB-1A — Real document question segmentation
- [ ] QB-1B — Canonical question schema
- [ ] QB-2 — Question classification
- [ ] QB-3 — Knowledge tagging
- [ ] QB-4 — Difficulty classification
- [ ] QB-5 — Answer / solution extraction
- [ ] QB-6 — Search and retrieval
- [ ] QB-7 — Import / export
- [ ] QB-8 — Production question database

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
