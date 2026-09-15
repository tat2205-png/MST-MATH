# MST-MATH MASTER IDEA INVENTORY V1

**Status:** ACCEPTED_INVENTORY / NON_PRODUCTION  
**Authority:** Reference for idea governance; does not override current production authorities  
**Execution rule:** `MAKE CURRENT MST-MATH WORK — NO IMPROVEMENT YET`  
**Activation:** Individual items may be promoted only through review, evidence, golden validation, and explicit authority.  
**Created:** 2026-09-16

---

## 0. Purpose

This document preserves the user's accumulated MST-MATH ideas, accepted directions, deferred concepts, and rejected approaches so they are not lost and are not mistaken for immediate implementation requirements.

Lifecycle:

`CAPTURED → UNDER_REVIEW → ACCEPTED_TARGET → ADR/BACKLOG → IMPLEMENTATION → GOLDEN → PROMOTION → CANONICAL`

Idea status is not release status. An item marked `ACCEPTED_TARGET` must not be implemented during the current no-improvement freeze unless explicitly authorized.

---

# I. CURRENT CANONICAL / ACTIVE PRINCIPLES

## 1. Primary objective

`MAKE CURRENT MST-MATH WORK — NO IMPROVEMENT YET.`

Stabilize the existing application before architecture expansion. Current critical order:

`CI/Node → OCR targeted validation → input real golden → DOCX preservation/round-trip → WORKING_BASELINE=PASS`

**Status:** CANONICAL / ACTIVE.

## 2. Execution model

- Windows PC is the authoritative development and certification platform.
- Mac is read-only backup for current baseline purposes.
- ChatGPT Desktop is primary executor; Codex/other agents are bounded reviewers/specialists.
- `ONE ACTIVE EXECUTOR. ONE TASK. ONE BRANCH. ONE ACCEPTANCE GATE. ONE EVIDENCE SET.`

**Status:** CANONICAL.

## 3. Source-first / fail-closed architecture

Canonical flow:

`SOURCE → SOURCE ADAPTER → DOCUMENT IR → SEMANTIC / DOMAIN IR → APPLICATION PIPELINE → CANONICAL DOMAIN IR → OUTPUT PROFILE → QA → RENDERER → FINAL ARTIFACT`

Forbidden: semantic bypass such as `SOURCE → OUTPUT` without provenance and validation.

Unsupported, ambiguous, or conflicting evidence must become `REVIEW_REQUIRED`, `UNSUPPORTED`, or `ERROR` rather than guessed content.

**Status:** CANONICAL.

## 4. Input fidelity

### DOCX
Must preserve/understand as applicable:
- text and tables;
- native OMML;
- legacy MathType/OLE;
- figures and relationships;
- SVG / EMF / WMF;
- grouped shapes / VML / anchors / ordering.

Original DOCX must be parsed natively; do not rasterize/OCR a Word document as the default path.

### PDF
Must cover digital, scanned, and hybrid PDFs.

### Image
Must support text, math, figure, layout, and provenance extraction.

**Status:** CANONICAL.

## 5. OCR seam

Keep current Paddle/PaddleOCR/PPStructureV3-based input architecture for working baseline. Do not replace with Tesseract or another OCR stack absent a demonstrated blocker.

Targeted validation seam:
- DPI = 160;
- CPU;
- formula recognition retained;
- checkpoint retained;
- fail-closed retained;
- `MST_MATH_INPUT_PDF_CHUNK_PAGES=1`;
- validate scanned PDF page 30;
- validate hybrid PDF page 59.

**Status:** CANONICAL / ACTIVE REPAIR.

## 6. Math representation

Word output equations must be editable native Word Equation (OMML), not images or raw LaTeX strings.

Do not adopt LaTeX-first canonical math. Preserve source representation and normalized semantic meaning:

`source evidence + normalized semantics + optional LaTeX projection + OMML output projection`

If source DOCX contains valid native OMML, preserve it when possible. Do not force `OMML → LaTeX → OMML` round-trip unnecessarily.

**Status:** CANONICAL.

## 7. MathType

MathType is not part of current core authority. Future optional output adapter may follow OMML (`MATHTYPE_PERSONAL` concept), but MathType must not become input/OCR/canonical semantic authority during baseline.

**Status:** DEFERRED.

## 8. Word cleanup

Before final DOCX/PDF output remove formatting residue:
- empty paragraphs;
- orphan/empty bullets;
- redundant blank lines;
- standalone tabs/spaces;
- similar Word residue.

Preserve:
- intentional student writing space;
- pedagogical whitespace;
- figure/table anchoring structures;
- legitimate list items.

**Status:** CANONICAL.

## 9. Human review

Technical defects (TypeScript, build, CI, OCR plumbing, runtime wiring, branch reconciliation) should be solved technically first. Human review is requested only for genuine judgment:
- mathematical meaning;
- pedagogy;
- visual/document acceptance;
- ambiguous source interpretation;
- unsupported mathematical evidence;
- product-owner decision.

**Status:** CANONICAL.

---

# II. QUESTION / CURRICULUM CORPUS TARGET

## 10. Question Corpus as canonical knowledge store

MST-MATH should become a structured mathematics corpus, not a directory of Word files.

Word/PDF/Image are source or output artifacts. The Question Corpus is the canonical question store.

A question ultimately needs identity, canonical content, math, figures, answers/solution, curriculum mapping, assessment mapping, provenance, duplicate/template relations, review state, and QA evidence.

**Status:** ACCEPTED_TARGET.

## 11. Curriculum Authority

Primary organization for Vietnamese school mathematics:

`GDPT2018 → grade → chapter → lesson mapping → knowledge unit → problem family → subtype`

Priority initial coverage: Mathematics grades 10–12, Kết nối tri thức textbook mapping.

Semantic distinction must remain:
- `GDPT2018` = curriculum/program;
- `KNTT` = textbook system / edition mapping.

**Status:** ACCEPTED_TARGET.

## 12. Stable Curriculum Unit ID

Do not use mutable lesson titles or lesson numbers as canonical identity.

Example stable unit:

`MATH.GDPT2018.12.CALCULUS.EXTREMA`

Map it to textbook editions separately:
- KNTT_2026;
- KNTT_2027;
- future editions.

Historical edition mappings must be retained rather than overwritten.

Questions should record `unitId`, curriculum-map version, and textbook mapping version used at classification time.

**Status:** ACCEPTED_TARGET / HIGH VALUE.

## 13. Primary vs secondary classification

Each question should have one primary curriculum/problem classification for stable organization, plus optional secondary tags for skills, representations, competencies, and related concepts.

**Status:** ACCEPTED_TARGET.

## 14. Problem family / subtype

Target hierarchy:

`knowledgeUnit → problemFamily → problemSubtype`

Example EXTREMA families may include formula-based, graph-based, variation-table-based, parameter problems, etc.

**Status:** ACCEPTED_TARGET.

## 15. User-facing question categories

Required user-facing categories:
- Trắc nghiệm;
- Đúng/Sai;
- Trả lời ngắn;
- Tự luận;
- Trắc nghiệm V-SAT;
- Trắc nghiệm SAT.

Internal normalized model should separate interaction from assessment system:

`QuestionInteraction ≠ AssessmentSystem`

Target interactions:
- `MULTIPLE_CHOICE`;
- `TRUE_FALSE`;
- `SHORT_ANSWER`;
- `ESSAY`;
- `MATCHING`;
- `STUDENT_PRODUCED_RESPONSE`.

Assessment systems may include `SCHOOL`, `THPTQG`, `SAT`, `VSAT`, and later DGNL/other systems.

**Status:** USER TAXONOMY CANONICAL / INTERNAL MODEL ACCEPTED_TARGET.

## 16. V-SAT matching

Support matching/ghép hợp as an interaction type where the official V-SAT version requires it. Do not create a separate output family just for matching.

**Status:** ACCEPTED_TARGET.

## 17. Cognitive level vs difficulty

Keep Vietnamese curriculum cognitive classification:

`NB | TH | VD | VDC`

but do not equate it with difficulty or time.

Target fields:
- curriculum cognitive level;
- estimated difficulty (`VERY_EASY`…`VERY_HARD` or similar bounded scale);
- estimated time;
- native assessment-specific difficulty;
- empirical difficulty only when real response data exists.

Avoid treating a 1–10 AI-estimated difficulty score as precise truth.

**Status:** ACCEPTED_TARGET.

## 18. Competency metadata

Question Corpus may store competencies such as mathematical reasoning, modeling, problem solving, communication, and tool use. Competency tagging must remain evidence-backed and reviewable.

**Status:** ACCEPTED_TARGET.

---

# III. DEDUPE / TEMPLATE / PROVENANCE

## 19. Duplicate model

Distinguish:
- `EXACT_DUPLICATE`;
- `SEMANTIC_DUPLICATE`;
- `TEMPLATE_VARIANT`.

Source content must not be automatically deleted. Dedupe affects canonical selection/export policy, not source immutability.

**Status:** CANONICAL DIRECTION.

## 20. DuplicateCluster ≠ TemplateFamily

`DuplicateCluster` manages actual/possible duplicate questions.

`TemplateFamily` manages mathematically related variants, e.g. same structure with changed coefficients/data.

Template pattern recognition must be proven/reviewed before being treated as a reusable family.

**Status:** ACCEPTED_TARGET.

## 21. Source provenance

Target provenance metadata:
- source document ID/name;
- source hash;
- page;
- block IDs;
- bbox/source location;
- extraction method;
- OCR confidence where applicable;
- import timestamp;
- transformation chain.

**Status:** ACCEPTED_TARGET.

## 22. Review decisions

Do not overload QuestionObject with full review history. Store audit decisions separately, including:
- question ID;
- field;
- old/proposed/accepted value;
- reviewer role;
- timestamp;
- reason/evidence.

**Status:** ACCEPTED_TARGET.

## 23. Rights/licensing metadata

For large corpora, track source usage governance:
- rights status;
- license/permission;
- publisher/source owner;
- usage restrictions;
- allowed store/transform/reuse/export/share operations.

**Status:** ACCEPTED_TARGET / GOVERNANCE.

---

# IV. TEACHER REVIEW / CLASSIFIER TARGET

## 24. Teacher review workflow

Desired flow:

`system classification proposal → confidence + evidence → review router`

- high confidence/no conflict: batch or quick review;
- medium: quick review;
- low/conflict/ambiguous: mandatory human review.

Do not require the teacher to deeply review 100% of large imports.

**Status:** ACCEPTED_TARGET.

## 25. Teacher correction is evidence, not online training

Do not automatically retrain production models from teacher edits.

Correct flow:

`Teacher correction → ReviewDecision / labelled dataset → offline evaluation → candidate classifier → regression/golden → promotion`

**Status:** ACCEPTED_TARGET / GOVERNANCE.

## 26. Classifier quality metrics

Do not rely on one F1 score. Track at minimum:
- top-1 accuracy;
- top-3 recall;
- confidence calibration;
- teacher correction rate;
- median review time/question;
- false auto-accept rate.

False auto-accept rate is especially important because confidently wrong curriculum metadata contaminates the corpus.

**Status:** ACCEPTED_TARGET.

---

# V. OUTPUT PROFILES / LAYOUT

## 27. Six required outputs

Use existing canonical profile IDs where available:

1. `P01_LEARNING_MATERIAL` — Tài liệu học tập;
2. `P03_WORKSHEET` — Phiếu học tập theo bài;
3. `P05_TEST` — Đề kiểm tra;
4. `P06_EXAM_THPTQG` — Đề thi/ôn THPTQG;
5. `P06_EXAM_SAT` — Đề SAT;
6. `P06_EXAM_VSAT` — Đề V-SAT.

Do not create a competing new P01–P06 registry.

**Status:** CANONICAL OUTPUT TARGETS.

## 28. One corpus / one layout IR / one renderer

Target principle:

`ONE QUESTION CORPUS`  
`ONE CANONICAL CONTENT MODEL`  
`ONE DOCUMENT LAYOUT IR`  
`ONE DOCX RENDERER`  
`ONE PDF RENDERER`

SAT/VSAT/THPTQG differences belong in versioned profile/spec configuration, not separate renderer codebases.

**Status:** ACCEPTED_TARGET.

## 29. DocumentLayoutIR primitives

Target reusable primitives include:
- Document / Section / Heading;
- QuestionBlock;
- StimulusGroup;
- OptionGroup;
- TrueFalseGrid;
- MatchingGrid;
- ShortAnswerArea;
- EssayWorkspace;
- FigureBlock / QuestionFigurePair;
- AnswerKey / SolutionBlock;
- PageBreak / KeepTogether.

**Status:** ACCEPTED_TARGET AFTER BASELINE.

## 30. P01 — Learning Material

Pedagogy-first structure may include:

`Title → Objectives → Why It Matters/Khởi động → Explore → Key Concept → Example → Check Understanding → Practice → Challenge → Summary`

A4, editable, figure-aware, print-ready, content-first. Do not invent mathematical assumptions for visual balance.

**Status:** ESTABLISHED DIRECTION.

## 31. P03 — Worksheet

Worksheet should be lesson-specific and action-aware. Typical progression:

`Khởi động → Khám phá → Luyện tập → Vận dụng`

Workspace is generated by activity type:
- MCQ: minimal/no writing space;
- short answer: compact response area;
- calculation: several lines;
- proof: larger writing area;
- graph/geometry: dedicated drawing area;
- table task: table workspace.

Avoid meaningless blank space.

**Status:** ACCEPTED_TARGET.

## 32. P05 — Test

Support MCQ, True/False, short answer, and essay.

MCQ adaptive options:
- four short choices: one row;
- medium choices: 2×2;
- long choices: four rows.

Question-left / figure-right when space permits; otherwise reflow figure below. Never shrink below readability thresholds to force a fit.

**Status:** ACCEPTED / NEEDS FORMAL LAYOUT CONTRACT.

## 33. THPTQG profile

Exam structure must be driven by versioned, official-authority `ExamSpec` rather than renderer code.

Example ID: `THPTQG_2026`.

**Status:** ACCEPTED_TARGET.

## 34. SAT profile

Maintain separate SAT assessment mapping/domain metadata while optionally mapping content to GDPT2018 units. Word/PDF SAT output is a printable practice artifact, not a Bluebook UI clone.

**Status:** ACCEPTED_TARGET.

## 35. V-SAT profile

V-SAT must not be modeled as ordinary MCQ with a VSAT label. Support version-appropriate interactions such as stimulus groups, MCQ, True/False, matching, and short answer.

Distinguish provenance such as `native_vsat`, `adapted_to_vsat`, and `vsat_compatible` when useful.

**Status:** ACCEPTED_TARGET.

## 36. Versioned ExamSpec

Target registry:
- `THPTQG_2026`, `THPTQG_2027`, …;
- `SAT_2026`, …;
- `VSAT_2026`, …

Each spec should carry effective date, official authority evidence, sections, counts, response types, time, layout policy, and answer-key policy.

Do not hard-code remembered exam structures into renderers.

**Status:** ACCEPTED_TARGET / IMPORTANT.

## 37. Student vs Teacher audience

Audience is an overlay, not another output family:

`AudienceProfile = STUDENT | TEACHER`

Teacher artifact may include answers, detailed solutions, rubrics, and notes. Student artifact must enforce no-answer-leak where applicable.

**Status:** ACCEPTED_TARGET.

---

# VI. ANSWER KEY / PRESENTATION

## 38. Compact answer key

Answer key must be easy to scan and grouped by question type/section/module as applicable.

Preferred forms:
- MCQ: compact horizontal question/answer matrix;
- True/False: rows with a/b/c/d columns;
- short answer: question/result pairs with OMML math;
- essay: result/key idea/score summary, not full solution;
- SAT: group by module and MCQ/SPR;
- V-SAT: group by interaction type.

`ANSWER KEY ≠ FULL SOLUTION`.

**Status:** ACCEPTED_TARGET.

## 39. Pastel answer color policy

Use restrained pastel highlighting to aid recognition:
- correct MCQ / TRUE: light green;
- FALSE: light red/pink;
- short answer / matching: light blue;
- essay key result: light violet/blue.

Color is supportive, never the only semantic cue. Output must remain grayscale-safe and accessible.

**Status:** ACCEPTED_TARGET.

## 40. Answer isolation policy

Refined policy:
- Learning Material Student: answer key may appear at end;
- Worksheet Student: configurable;
- Test/THPT/SAT/VSAT Student: no answer key in distributed exam artifact;
- Teacher variants: answer key required.

Every output package should support an answer-key artifact, but student exams must not leak answers.

**Status:** ACCEPTED REFINED POLICY.

---

# VII. QA / VALIDATION

## 41. Three-stage output QA

### Pre-render QA
- metadata complete;
- answer binding;
- figure binding;
- math QA;
- curriculum mapping;
- duplicate policy;
- output-profile compatibility.

### Render QA
- no collisions;
- safe pagination;
- keep-together rules;
- workspace rules;
- answer-key layout;
- font/readability minimum;
- safe bounds.

### Artifact QA
- DOCX opens;
- Save → Close → Reopen;
- OMML remains editable;
- figures/relationships preserved;
- PDF export passes;
- searchable output where applicable;
- answer key matches question IDs.

**Status:** ACCEPTED_TARGET.

## 42. Accessibility target

Potential gates:
- no color-only meaning;
- contrast pass;
- reading order;
- alt text/descriptions for figures where required;
- editable/accessible math;
- searchable PDF;
- structured tables;
- minimum readable font.

Responsive layout applies to HTML/app outputs, not as a replacement for canonical A4 print layout.

**Status:** ACCEPTED_TARGET.

---

# VIII. VERTICAL PILOT / SCALE STRATEGY

## 43. Vertical corpus pilot

After `WORKING_BASELINE=PASS`, pilot one real knowledge unit before scaling. Suggested case: EXTREMA.

Target:
- approximately 50 verified questions;
- current Question Bank extended additively;
- `P03_WORKSHEET`;
- Student + Teacher artifacts;
- native/editable OMML;
- figures correctly bound;
- compact pastel answer key;
- Save/Close/Reopen QA.

If vertical slice fails, do not scale to a full chapter/program.

**Status:** ACCEPTED_TARGET AFTER BASELINE.

## 44. Roadmap stages

- Stage 0 — Working Baseline.
- Stage 1 — Vertical Corpus Pilot.
- Stage 2 — Corpus model / curriculum & assessment metadata.
- Stage 3 — Chapter pilot + classifier proposal/review workflow.
- Stage 4 — all six output profiles.
- Stage 5 — scale Mathematics 10–12 GDPT2018/KNTT.
- Stage 6 — pedagogy intelligence / learning paths.

**Status:** ACCEPTED ROADMAP.

## 45. LearningPathSpec

Future derived pedagogy layer:

`Question Corpus → LearningPathSpec`

Possible roles:
`PREREQUISITE → SCAFFOLDED → INDEPENDENT → CHALLENGE`

Hints/scaffolds are overlays and must not modify canonical question content.

**Status:** DEFERRED / POST-BASELINE.

---

# IX. VISUAL / GEOMETRY / GEOGEBRA / VIDEO

## 46. GeoGebra native module

Target scope:
- native 2D/3D construction;
- interactive manipulation;
- `.ggb` export and reopen;
- strict corpus fidelity for construction, constraints, labels, sliders, viewport, colors, and dependencies.

User-accepted visual expectations include freely draggable points, non-rigid text behavior where appropriate, view-dependent visible/hidden edges, correct 3D→2D unfolding, functional sliders, restrained corpus background, contrasting faces, and high-contrast key segments.

GeoGebra is not the default static figure renderer for Word/PDF.

**Status:** ACCEPTED SPECIALIZED MODULE / CORE EXPANSION DEFERRED UNTIL BASELINE.

## 47. Static mathematical figures

Preferred static authoring technologies:
- TikZ;
- PGFPlots;
- Asymptote.

Use deterministic geometry/graph pipelines rather than generative visual guessing.

**Status:** ESTABLISHED DIRECTION.

## 48. GeoGebra graph style

Accepted style includes:
- tick numbers on/immediately adjacent to axes;
- light gray grid;
- black axes with arrows and labels;
- dashed strict-inequality boundary;
- light translucent solution-region fill;
- no unnecessary “miền nghiệm” label.

**Status:** CANONICAL VISUAL STYLE.

## 49. KNTT interval number-line style

Use textbook endpoint notation rather than open/filled GeoGebra dots:
- open endpoints: `( )`;
- closed endpoints: `[ ]`;
- non-member region may use light cyan/blue hatching according to accepted KNTT style.

**Status:** CANONICAL VISUAL AUTHORITY.

## 50. Cut–fold–assemble geometry

Canonical geometry-first pipeline:

`Source Evidence → Geometry Model → Operation Plan → Validate Preconditions → Apply/Simulate → Validate State → Render`

Operations may include Cut, Fold, Translate, Rotate, Reflect, Assemble.

Never invent edges, points, faces, hinges, adjacency, or final geometry from appearance alone.

**Status:** CANONICAL GEOMETRY POLICY.

## 51. Three pedagogical cut/fold/assemble figures

Default:
1. initial figure + exact cut/removal indication;
2. true intermediate folding/assembling state;
3. completed solid.

For print, prefer black-only line language; no arbitrary borders; do not use a large X as the removal convention; intermediate figure must show process, not merely the completed object.

**Status:** CANONICAL.

## 52. Source figure as evidence

User-supplied mathematical figures are authoritative source evidence, not loose inspiration.

Track provenance for Point/Edge/Face/Incidence/Adjacency/Boundary/Operation and distinguish:
- `SOURCE_GIVEN`;
- `PROVEN_DERIVED`;
- `VISUAL_ONLY`.

`VISUAL_ONLY` evidence must not become a mathematical assumption.

**Status:** CANONICAL.

## 53. Manim / video

Long-term probability/video pipeline:

`Question → Canonical Solution → Reasoning Graph → PedagogySpec → VideoSpec → Manim Renderer → MP4`

Core separations:
- Math ≠ Pedagogy;
- Pedagogy ≠ Rendering;
- Manim ≠ Solver.

Prototype as an independent lab first; do not pull into current core stabilization.

**Status:** DEFERRED.

---

# X. IDEA GOVERNANCE

## 54. Idea governance lifecycle

Recommended repository memory system:

`CHAT / FILE / HUMAN IDEA → IDEA VAULT → REVIEW → ACCEPTED_TARGET / PARKED / REJECTED → ADR/BACKLOG → IMPLEMENTATION → GOLDEN → PROMOTION → CANONICAL`

Idea statuses:
- `CAPTURED`;
- `UNDER_REVIEW`;
- `ACCEPTED_TARGET`;
- `PARKED`;
- `DEFERRED`;
- `REJECTED`;
- `PROMOTED`.

Ideas are not production requirements until promoted.

**Status:** ACCEPTED_TARGET.

## 55. ADR candidates already agreed in principle

- Keep current MST-MATH stack.
- No LaTeX-first canonical math.
- Preserve native OMML.
- One DocumentLayoutIR / one DOCX renderer target.
- No Input→Output semantic bypass.
- Teacher correction does not automatically retrain runtime.
- Exam specs are versioned and authority-backed.
- DuplicateCluster ≠ TemplateFamily.
- Stable Unit ID ≠ textbook lesson title.
- Source immutability.

**Status:** ACCEPTED DECISION CANDIDATES; formal ADR files may be created after governance setup.

---

# XI. REJECTED / DO-NOT-IMPLEMENT DIRECTIONS

The following are explicitly not the current MST-MATH implementation direction:

- rewrite core to FastAPI/PostgreSQL/Celery/S3/MinIO;
- replace current OCR stack with Tesseract without blocker evidence;
- LaTeX-first canonical math;
- unconditional `OMML → LaTeX → OMML` round-trip;
- PNG fallback masquerading as canonical editable equation;
- complex table → image as default replacement;
- convert all DOCX figures to JPEG;
- MathType SDK as current core dependency;
- automatic production-model retraining from teacher edits;
- automatic hard deletion of duplicate source questions;
- hard-code THPTQG/SAT/V-SAT structures into renderer logic;
- separate renderer codebase per assessment system;
- treat Word folder hierarchy as canonical database;
- treat AI-estimated 1–10 difficulty as objective truth;
- treat high OCR confidence alone as GOLDEN evidence.

**Status:** REJECTED / DO_NOT_IMPLEMENT.

---

# XII. CLASSIFICATION OF THE THREE REVIEW DOCUMENTS

## `MST-MATH_Architecture_Specification.md`

`STATUS = TARGET_ARCHITECTURE_DRAFT`  
`PRODUCTION_AUTHORITY = NO`  
`SCOPE = POST_WORKING_BASELINE`

## `MST-MATH_Critical_Issues_Mitigation.md`

`STATUS = RISK_REGISTER_DRAFT`  
`ACTION = RECONCILE_WITH_CURRENT_CONTRACTS`

## `MST-MATH_Tech_Stack_APIs.md`

`STATUS = REFERENCE_ONLY`  
`DO_NOT_IMPLEMENT = TRUE`  
`REWRITE_REQUIRED = TRUE`

**Status:** ACCEPTED GOVERNANCE DECISION.

---

# XIII. MASTER TARGET VIEW

```text
                     MST-MATH
                        │
          ┌─────────────┴──────────────┐
          │                            │
   SOURCE LIBRARY              CURRICULUM AUTHORITY
 DOCX / PDF / IMAGE           GDPT2018 / KNTT editions
          │                            │
          ▼                            │
     DocumentIR                       │
          │                            │
          ▼                            │
     QuestionIR ◄─────────────────────┘
          │
          ▼
     QUESTION CORPUS
          │
 ┌────────┼───────────────┐
 │        │               │
 ▼        ▼               ▼
Dedupe  Template       Assessment
        Families        Mapping
 │        │               │
 └────────┴───────┬───────┘
                  ▼
           Selection / Blueprint
                  │
         ┌────────┴────────┐
         ▼                 ▼
 Assessment          Learning Path
                  [post-baseline]
         │
         ▼
       OUTPUT PROFILE
 ┌───────┼────────┬────────┬────────┐
 ▼       ▼        ▼        ▼        ▼
Learn  Worksheet  Test   THPTQG   SAT / VSAT
         │
         ▼
      Audience
 Student / Teacher
         │
         ▼
   ProfileLayoutSpec
         │
         ▼
    DocumentLayoutIR
         │
         ▼
    ONE DOCX RENDERER
         │
    Native OMML
         │
         ▼
 Semantic → Layout → Artifact QA
         │
         ▼
 FINAL DOCX / PDF
```

---

# XIV. Promotion rule

No item in this inventory becomes production canonical merely because it appears here.

Promotion requires, as applicable:

`NEED DEMONSTRATED + DESIGN REVIEWED + NO AUTHORITY CONFLICT + TARGETED TEST PASS + INTEGRATION PASS + REGRESSION PASS + REAL GOLDEN PASS + HUMAN REVIEW WHERE REQUIRED + EXPLICIT PROMOTION`

Until then, the current operating override and current locked production contracts remain authoritative.
