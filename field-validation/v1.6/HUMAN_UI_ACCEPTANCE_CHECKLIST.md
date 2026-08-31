# v1.6 Human UI Acceptance Checklist

**Validator ID:** [To be filled by human]  
**Date:** [To be filled by human]  
**Build HEAD:** 44ac24e6d4be8b6a5d19dba2d5eaa31949906149  
**Build version:** 1.6.0  

Instructions:
- Complete each workflow step in sequence
- Record PASS/FAIL for each item
- Note any issues, workarounds, or unexpected behavior
- Do NOT auto-skip; try every item
- Mark FAIL only if UI control fails, not if content is unexpected

---

## SECTION 1: HOME / WORKSPACE

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| UI-01 | Home splash/landing | Studio loads, no errors | | PASS / FAIL | |
| UI-02 | Workspace selector | Can see imported workspaces or create new | | PASS / FAIL | |
| UI-03 | Navigation menu | Main menu items visible, responsive | | PASS / FAIL | |
| UI-04 | Dark/light mode | Mode toggle appears and works | | PASS / FAIL | |
| UI-05 | Responsive viewport | Layout adjusts on resize | | PASS / FAIL | |

---

## SECTION 2: IMPORT

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| IMPORT-01 | Import dialog | File picker opens, accepts DOCX | | PASS / FAIL | |
| IMPORT-02 | File upload | DOCX file uploads without error | | PASS / FAIL | |
| IMPORT-03 | Import parsing | Questions extracted and visible | | PASS / FAIL | |
| IMPORT-04 | Progress indicator | Progress bar or spinner shown during import | | PASS / FAIL | |
| IMPORT-05 | Import success | Confirmation dialog appears, file saved | | PASS / FAIL | |
| IMPORT-06 | Error handling | Invalid file shows clear error message | | PASS / FAIL | |

---

## SECTION 3: SOURCE REVIEW

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| REVIEW-01 | Review mode | Can open imported document for review | | PASS / FAIL | |
| REVIEW-02 | Question list | All questions visible in list view | | PASS / FAIL | |
| REVIEW-03 | Individual question | Can click to view single question | | PASS / FAIL | |
| REVIEW-04 | Math rendering | Equations render correctly | | PASS / FAIL | |
| REVIEW-05 | Images/figures | Inline and anchored figures display properly | | PASS / FAIL | |
| REVIEW-06 | Text encoding | Vietnamese text displays correctly | | PASS / FAIL | |
| REVIEW-07 | No overlap | No text/figure overlap or clipping | | PASS / FAIL | |

---

## SECTION 4: EXAM QA

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| EXAM-01 | Exam dialog | Can open exam QA interface | | PASS / FAIL | |
| EXAM-02 | Question list | All questions in exam shown | | PASS / FAIL | |
| EXAM-03 | Validation state | Each question shows validation status | | PASS / FAIL | |
| EXAM-04 | Math verification | Math correctness indicator present | | PASS / FAIL | |
| EXAM-05 | Answer isolation | Answers not visible to students | | PASS / FAIL | |

---

## SECTION 5: QUESTION BANK

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| QB-01 | Bank view | Question bank lists all questions | | PASS / FAIL | |
| QB-02 | Status display | Each question shows import status (APPROVED/REVIEW/QUARANTINED) | | PASS / FAIL | |
| QB-03 | Sorting | Can sort by ID, source, type | | PASS / FAIL | |
| QB-04 | Filtering | Can filter by question type, grade, status | | PASS / FAIL | |
| QB-05 | Count display | Total count and filtered count shown | | PASS / FAIL | |

---

## SECTION 6: QUESTION SEARCH / REUSE

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| SEARCH-01 | Search field | Search box appears and is functional | | PASS / FAIL | |
| SEARCH-02 | Text search | Can search by question text | | PASS / FAIL | |
| SEARCH-03 | Search results | Results display correctly and quickly | | PASS / FAIL | |
| SEARCH-04 | Duplicate detection | System indicates possible duplicates if present | | PASS / FAIL | |
| SEARCH-05 | Reuse dialog | Can add found question to assessment | | PASS / FAIL | |

---

## SECTION 7: QUESTION SELECTION

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| SELECT-01 | Selection mode | Can click/checkbox to select questions | | PASS / FAIL | |
| SELECT-02 | Multi-select | Can select multiple questions | | PASS / FAIL | |
| SELECT-03 | Deselect | Can deselect individual or all | | PASS / FAIL | |
| SELECT-04 | Selection state | Selected count displayed | | PASS / FAIL | |
| SELECT-05 | Order preservation | Questions added to assessment in order | | PASS / FAIL | |
| SELECT-06 | Duplicate prevention | Cannot add same question twice | | PASS / FAIL | |

---

## SECTION 8: ASSESSMENT GENERATION

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| ASSESS-01 | Assessment dialog | Can create new assessment | | PASS / FAIL | |
| ASSESS-02 | Question selection | Add/remove questions from assessment | | PASS / FAIL | |
| ASSESS-03 | Sections | Can organize questions into sections | | PASS / FAIL | |
| ASSESS-04 | Title/metadata | Can enter assessment name and metadata | | PASS / FAIL | |
| ASSESS-05 | Save | Assessment saved and retrievable | | PASS / FAIL | |
| ASSESS-06 | Empty state | Cannot save empty assessment | | PASS / FAIL | |
| ASSESS-07 | Validation | All questions in assessment valid for use | | PASS / FAIL | |

---

## SECTION 9: CLASSROOM GAME

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| GAME-01 | Game launch | Can start classroom game session | | PASS / FAIL | |
| GAME-02 | Student view | Student display shows questions and input | | PASS / FAIL | |
| GAME-03 | Teacher control | Teacher can progress through questions | | PASS / FAIL | |
| GAME-04 | Answer submission | Student answers are captured | | PASS / FAIL | |
| GAME-05 | Scoring | Points calculated correctly | | PASS / FAIL | |
| GAME-06 | Session state | Game state saved (can resume) | | PASS / FAIL | |

---

## SECTION 10: SOLUTION

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| SOLUTION-01 | Solution view | Can view solution/answer key | | PASS / FAIL | |
| SOLUTION-02 | Teacher access | Teacher sees solution, student doesn't | | PASS / FAIL | |
| SOLUTION-03 | Math correctness | Solution content is mathematically correct | | PASS / FAIL | |
| SOLUTION-04 | Formatting | Solution formatted clearly | | PASS / FAIL | |
| SOLUTION-05 | Multiple solutions | If multiple approaches, all shown | | PASS / FAIL | |

---

## SECTION 11: VIDEO

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| VIDEO-01 | Video generation | Can generate solution video | | PASS / FAIL | |
| VIDEO-02 | Video player | Video plays without error | | PASS / FAIL | |
| VIDEO-03 | Playback quality | Video is clear and readable | | PASS / FAIL | |
| VIDEO-04 | Pacing | Video plays at reasonable speed | | PASS / FAIL | |
| VIDEO-05 | Math fidelity | Rendered math matches question | | PASS / FAIL | |
| VIDEO-06 | Sync | Narration/animation synchronized | | PASS / FAIL | |
| VIDEO-07 | Vietnamese | Vietnamese text/audio clear | | PASS / FAIL | |

---

## SECTION 12: EXPORT

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| EXPORT-01 | Export menu | Can access export options | | PASS / FAIL | |
| EXPORT-02 | Export DOCX | Can export assessment as DOCX | | PASS / FAIL | |
| EXPORT-03 | DOCX quality | Exported DOCX opens in Word correctly | | PASS / FAIL | |
| EXPORT-04 | Export PDF | Can export assessment as PDF | | PASS / FAIL | |
| EXPORT-05 | PDF quality | Exported PDF is readable and printable | | PASS / FAIL | |
| EXPORT-06 | Math in export | Equations preserved in export | | PASS / FAIL | |
| EXPORT-07 | Figures in export | Images included in export | | PASS / FAIL | |
| EXPORT-08 | Page layout | Export formatting looks professional | | PASS / FAIL | |

---

## SECTION 13: ERROR / FAIL-CLOSED STATES

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| ERROR-01 | Bad file | Invalid DOCX shows error, doesn't crash | | PASS / FAIL | |
| ERROR-02 | Network error | Network issues handled gracefully | | PASS / FAIL | |
| ERROR-03 | Unsupported content | Unsupported elements show warning, not crash | | PASS / FAIL | |
| ERROR-04 | Error message | Error messages are clear and actionable | | PASS / FAIL | |
| ERROR-05 | Recovery | Can recover from error without restart | | PASS / FAIL | |
| ERROR-06 | Logging | Errors logged for debugging | | PASS / FAIL | |

---

## SECTION 14: NAVIGATION

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| NAV-01 | Breadcrumbs | Navigation breadcrumbs visible | | PASS / FAIL | |
| NAV-02 | Back button | Back button returns to previous screen | | PASS / FAIL | |
| NAV-03 | Menu | Main menu accessible from all screens | | PASS / FAIL | |
| NAV-04 | Deep linking | Can navigate to specific assessment/question | | PASS / FAIL | |
| NAV-05 | Browser back | Browser back button works correctly | | PASS / FAIL | |

---

## SECTION 15: RESPONSIVE BEHAVIOR

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| RESP-01 | Desktop | UI functional on desktop (1920x1080) | | PASS / FAIL | |
| RESP-02 | Tablet | UI functional on tablet (768x1024) | | PASS / FAIL | |
| RESP-03 | Mobile | UI functional on mobile (375x667) | | PASS / FAIL | |
| RESP-04 | Orientation | Landscape/portrait modes work | | PASS / FAIL | |
| RESP-05 | Touch | Touch interactions work on mobile | | PASS / FAIL | |

---

## SECTION 16: DOUBLE-SUBMIT PREVENTION

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| PREVENT-01 | Submit button | Submit button disabled after click | | PASS / FAIL | |
| PREVENT-02 | Loading state | Loading indicator shown during processing | | PASS / FAIL | |
| PREVENT-03 | Duplicate prevention | Only one submission created even with fast clicks | | PASS / FAIL | |

---

## SECTION 17: ACCESSIBILITY-CRITICAL CONTROLS

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| A11Y-01 | Keyboard nav | Can tab through controls | | PASS / FAIL | |
| A11Y-02 | Labels | Form inputs have labels | | PASS / FAIL | |
| A11Y-03 | Color contrast | Text has sufficient contrast | | PASS / FAIL | |
| A11Y-04 | Screen reader | Labels announced to screen readers | | PASS / FAIL | |
| A11Y-05 | Focus visible | Focused control visually highlighted | | PASS / FAIL | |

---

## SECTION 18: NO TEXT/FIGURE OVERLAP

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| OVERLAP-01 | Question text | Text fully visible, no clipping | | PASS / FAIL | |
| OVERLAP-02 | Answer options | Option text doesn't overlap with figures | | PASS / FAIL | |
| OVERLAP-03 | Figures | Figures centered and not clipped | | PASS / FAIL | |
| OVERLAP-04 | Layout | Professional spacing and alignment | | PASS / FAIL | |
| OVERLAP-05 | Pagination | Page breaks logical, no orphaned text | | PASS / FAIL | |

---

## SECTION 19: PAGINATION

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| PAGING-01 | Page nav | Can navigate through pages | | PASS / FAIL | |
| PAGING-02 | Page count | Page numbers and total shown | | PASS / FAIL | |
| PAGING-03 | First/last | First/last page buttons work | | PASS / FAIL | |
| PAGING-04 | Direct jump | Can jump to specific page number | | PASS / FAIL | |
| PAGING-05 | Câu 50→51→158 | Vietnamese question numbering preserved | | PASS / FAIL | |

---

## SECTION 20: Q37 / FIGURE RENDERING

| ITEM_ID | SCREEN | EXPECTED | OBSERVED | RESULT | VALIDATOR_NOTES |
|---------|--------|----------|----------|--------|-----------------|
| Q37-01 | Q37 composite | Question 37 figure renders completely | | PASS / FAIL | |
| Q37-02 | Q37 readable | Q37 content is legible | | PASS / FAIL | |
| Q37-03 | Q37 no clip | No parts of Q37 figure clipped | | PASS / FAIL | |
| Q37-04 | Figure quality | Composite figure quality acceptable | | PASS / FAIL | |

---

## SUMMARY

**Total items:** 114  
**Passed:** ___  
**Failed:** ___  
**Not applicable:** ___  

**Overall result:** ☐ PASS  ☐ FAIL  ☐ PARTIAL

**Critical failures (if any):**  
[To be filled if any FAIL result]

**Noncritical issues (if any):**  
[To be filled if any issues found]

**Validator signature & date:** ________________________  

**Validator contact:** ________________________  

---

**Instructions for completion:**
1. Review this checklist with the v1.6 build
2. Complete each item during natural workflow
3. Record PASS/FAIL based on actual observed behavior
4. Add notes for any unexpected findings
5. Submit completed checklist with date and signature
6. Do not auto-fill; every item requires actual human validation
