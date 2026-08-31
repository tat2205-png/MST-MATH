# v1.6 Level 2 — External Teacher Acceptance Evidence

**Purpose:** Record execution of core workflow by external teachers (not project team)  
**Level:** 2 (External validation)  
**Evidence type:** Raw execution records, not simulated  

**Instructions:**
- Each teacher completes core workflow: IMPORT → REVIEW → QUESTION BANK → SEARCH/REUSE → SELECTION → ASSESSMENT → EXPORT
- Optional workflow: GAME, SOLUTION, VIDEO, DOCX validation
- Record actual results, not expected results
- Use anonymous tester IDs (T01, T02, T03, etc.), not names
- Preserve raw records; corrections require audit note
- No KPI calculated from empty dataset

---

## TEACHER EXECUTION RECORD — TEMPLATE

| Field | Value | Notes |
|-------|-------|-------|
| **VALIDATOR_ID** | T01, T02, or T03 | Anonymous identifier |
| **ROLE** | Teacher / Educator / Administrator | Actual role |
| **DATE** | YYYY-MM-DD | Execution date |
| **TIME_START** | HH:MM UTC | Session start time |
| **TIME_END** | HH:MM UTC | Session end time |
| **DURATION_MINUTES** | | Actual execution time |
| **BUILD_HEAD** | 44ac24e6d4be8b6a5d19dba2d5eaa31949906149 | Commit hash tested |
| **BUILD_VERSION** | 1.6.0 | Package version |
| **SOURCE_USED** | KNTT Toan 10-Tap1 (or other) | Real source file used |
| **SOURCE_SHA256** | [Computed] | File checksum |
| **PLATFORM** | macOS / Windows / Linux | OS used |
| **BROWSER** | Chrome / Safari / Firefox / Edge | Browser version |

---

## WORKFLOW RESULTS

### PILOT-01: Import Real Mathematics DOCX

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| File selection | DOCX file picker opens | | PASS / FAIL | |
| Upload process | File uploads without error | | PASS / FAIL | |
| Parse success | Questions extracted correctly | | PASS / FAIL | |
| Question count | N questions identified | | PASS / FAIL | |
| Source identity | Source file identified and traced | | PASS / FAIL | |
| Fidelity | Vietnamese text, math, figures preserved | | PASS / FAIL | |
| Traceability | SHA-256, location, metadata recorded | | PASS / FAIL | |
| **PILOT-01 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-02: Review Imported Questions

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Review interface | Can open review view | | PASS / FAIL | |
| Question display | All questions shown in list | | PASS / FAIL | |
| Individual view | Click to view single question details | | PASS / FAIL | |
| Math rendering | Equations render correctly | | PASS / FAIL | |
| Text encoding | Vietnamese displays correctly | | PASS / FAIL | |
| Figures | Inline and anchored figures visible | | PASS / FAIL | |
| Corrections | Can note issues/needed corrections | | PASS / FAIL | |
| **PILOT-02 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-03: Save and Search Question Bank

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Bank save | Questions saved to question bank | | PASS / FAIL | |
| Retrieval | Saved questions retrievable | | PASS / FAIL | |
| Search function | Can search by text/metadata | | PASS / FAIL | |
| Search results | Results accurate and complete | | PASS / FAIL | |
| Duplicates | Duplicate detection works | | PASS / FAIL | |
| Provenance | Source tracked for each question | | PASS / FAIL | |
| **PILOT-03 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-04: Generate Worksheet

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Worksheet creation | Can create new worksheet | | PASS / FAIL | |
| Question selection | Can select questions for worksheet | | PASS / FAIL | |
| Layout | Worksheet formatted with sections | | PASS / FAIL | |
| Writing space | Space provided for student answers | | PASS / FAIL | |
| Answer isolation | Answers/solutions not visible | | PASS / FAIL | |
| Math display | Equations render clearly | | PASS / FAIL | |
| Pagination | Page breaks appropriate | | PASS / FAIL | |
| **PILOT-04 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-05: Generate Assessment/Test

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Assessment creation | Can create new assessment | | PASS / FAIL | |
| Question selection | Add/remove questions | | PASS / FAIL | |
| Sections | Can organize into sections | | PASS / FAIL | |
| Metadata | Can add title, instructions, metadata | | PASS / FAIL | |
| Answer manifest | Correct answers recorded | | PASS / FAIL | |
| Math fidelity | All mathematics correct | | PASS / FAIL | |
| Validation | All questions valid for assessment | | PASS / FAIL | |
| **PILOT-05 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-06: Generate Answer Key / Solution

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Solution access | Teacher can access solution view | | PASS / FAIL | |
| Teacher-only | Solution not visible to students | | PASS / FAIL | |
| Answer separation | Answers clearly marked, isolated | | PASS / FAIL | |
| Solution content | Steps/explanations present | | PASS / FAIL | |
| Math correctness | Solutions mathematically correct | | PASS / FAIL | |
| Export format | Solutions exportable | | PASS / FAIL | |
| **PILOT-06 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-07: Export Native DOCX

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Export access | Export to DOCX option available | | PASS / FAIL | |
| File generation | DOCX file created successfully | | PASS / FAIL | |
| Opens in Word | File opens in Microsoft Word | | PASS / FAIL | |
| Math (OMML) | Equations preserved in OMML | | PASS / FAIL | |
| Images | Figures included in export | | PASS / FAIL | |
| Page layout | Professional formatting maintained | | PASS / FAIL | |
| Vietnamese | Vietnamese text correct in export | | PASS / FAIL | |
| Editability | Can edit exported DOCX | | PASS / FAIL | |
| **PILOT-07 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-08: Export PDF

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Export access | Export to PDF option available | | PASS / FAIL | |
| File generation | PDF file created successfully | | PASS / FAIL | |
| Opens | PDF opens in default viewer | | PASS / FAIL | |
| Math | Equations rendered correctly | | PASS / FAIL | |
| Images | Figures included and readable | | PASS / FAIL | |
| Unicode | Vietnamese text displays correctly | | PASS / FAIL | |
| Printability | PDF prints cleanly on paper | | PASS / FAIL | |
| Page breaks | Pagination appropriate for print | | PASS / FAIL | |
| **PILOT-08 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-09: Generate Solution Video

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Video generation | Can generate solution video | | PASS / FAIL | |
| Video creation | Video file created successfully | | PASS / FAIL | |
| Playback | Video plays without errors | | PASS / FAIL | |
| Duration | Video length appropriate | | PASS / FAIL | |
| Readability | Content clear and legible | | PASS / FAIL | |
| Math fidelity | Rendered math matches question | | PASS / FAIL | |
| Pacing | Video plays at reasonable speed | | PASS / FAIL | |
| Sync | Narration/animation synchronized | | PASS / FAIL | |
| Vietnamese | Vietnamese audio/text clear | | PASS / FAIL | |
| Display | Video suitable for classroom display | | PASS / FAIL | |
| **PILOT-09 Result** | **All criteria PASS** | | **PASS / FAIL / BLOCKED** | |

---

### PILOT-10: Complete End-to-End Workflow

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Workflow completion | All steps completed without restart | | PASS / FAIL | |
| No dead ends | No blocking errors encountered | | PASS / FAIL | |
| Time reasonable | Total time < 30 minutes for core workflow | | PASS / FAIL | |
| Acceptance | Teacher would use this in real classroom | | PASS / FAIL | |
| Interventions | Any workarounds or fixes needed? [List] | | PASS / FAIL | |
| **PILOT-10 Result** | **Workflow accepted** | | **PASS / FAIL / BLOCKED** | |

---

## OPTIONAL: CLASSROOM GAME

| Criterion | Expected | Observed | Result | Notes |
|-----------|----------|----------|--------|-------|
| Game launch | Can start classroom game session | | PASS / FAIL | N/A |
| Student display | Student view works correctly | | PASS / FAIL | N/A |
| Teacher control | Teacher can progress through session | | PASS / FAIL | N/A |
| Interaction | Student answers captured correctly | | PASS / FAIL | N/A |
| **GAME Result** | **If attempted** | | **PASS / FAIL / N/A** | |

---

## SUMMARY ACCEPTANCE

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **UI Acceptability** | Excellent / Good / Acceptable / Poor | |
| **Workflow Completeness** | Complete / Nearly complete / Partial | |
| **Math Correctness** | All correct / Minor issues / Major issues | |
| **Teacher Acceptance** | Would use / Would use with fixes / Would not use | |
| **Critical Failures** | None / [List] | |
| **Noncritical Issues** | None / [List] | |

---

## OVERALL ACCEPTANCE

**Teacher ID:** T0X  
**Date:** YYYY-MM-DD  
**Final Acceptance:** ☐ ACCEPT  ☐ ACCEPT WITH CONDITIONS  ☐ REJECT  

**Teacher signature:** ________________________  

**Contact (for follow-up):** ________________________  

---

**INSTRUCTIONS FOR EXTERNAL TEACHERS:**
1. Follow this template during your testing
2. Use the live v1.6 build (commit 44ac24e)
3. Import and test with real Vietnamese mathematics materials
4. Record actual results, not expected results
5. Note any issues, errors, or unexpected behavior
6. Submit completed record with signature and date
7. Keep this record raw — do not edit after submission
