# v1.6 Level 3 — Supervised Classroom Validation Evidence

**Purpose:** Record real classroom use of v1.6 with students  
**Level:** 3 (Real-world classroom evidence)  
**Evidence type:** Raw session records, anonymous aggregate data  
**Privacy:** Use anonymous IDs and aggregate data only; no personal student data  

---

## CLASSROOM SESSION RECORD — TEMPLATE

| Field | Value | Notes |
|-------|-------|-------|
| **CLASS_SESSION_ID** | CLASS-01, CLASS-02, etc. | Anonymous identifier |
| **DATE** | YYYY-MM-DD | Session date |
| **TIME_START** | HH:MM UTC | Start time |
| **TIME_END** | HH:MM UTC | End time |
| **DURATION_MINUTES** | | Actual session duration |
| **TEACHER** | TEACHER-ANONYMOUS | Do not record name |
| **GRADE** | 10 / 11 / 12 / Other | Grade level |
| **LESSON_TOPIC** | [Topic name] | Subject of lesson |
| **BUILD_HEAD** | 44ac24e6d4be8b6a5d19dba2d5eaa31949906149 | Commit tested |
| **BUILD_VERSION** | 1.6.0 | Package version |
| **SOURCE_USED** | KNTT Toan 10-Tap1 (or other) | Real source used |
| **SOURCE_SHA256** | [Computed] | File checksum |

---

## CLASSROOM ENVIRONMENT

| Item | Value | Notes |
|------|-------|-------|
| **NUMBER_OF_STUDENTS** | [N] | Do not record names |
| **DEVICE_TYPE** | Desktop / Tablet / Laptop / Mixed | Hardware used |
| **OS_PLATFORM** | Windows / macOS / Linux / Chromebook | Operating systems |
| **BROWSER** | Chrome / Safari / Firefox / Edge | Browser(s) |
| **NETWORK** | WiFi / Ethernet / Mixed | Connectivity |
| **INTERNET_BANDWIDTH** | [Mbps typical] | Network quality |
| **DISPLAY_TYPE** | Individual monitors / Projector / TV | Display setup |
| **CLASSROOM_SIZE** | Small / Medium / Large | Number of students/devices |

---

## WORKFLOW EXECUTION

### Part 1: Import and Preparation

| Criterion | Expected | Observed | Status | Notes |
|-----------|----------|----------|--------|-------|
| **Source material** | Real Vietnamese math materials available | | PASS / FAIL | |
| **Import time** | Materials imported < 5 minutes | | PASS / FAIL | |
| **No errors** | No import errors or warnings | | PASS / FAIL | |
| **Student view** | Students can view imported questions | | PASS / FAIL | |
| **Navigation** | Students navigate to assessment without help | | PASS / FAIL | |

### Part 2: Assessment and Interaction

| Criterion | Expected | Observed | Status | Notes |
|-----------|----------|----------|--------|-------|
| **Session start** | Classroom game/assessment starts cleanly | | PASS / FAIL | |
| **Question display** | Questions display on student devices/projector | | PASS / FAIL | |
| **Math readable** | Mathematical content legible to students | | PASS / FAIL | |
| **Student interaction** | Students can submit answers | | PASS / FAIL | |
| **Teacher control** | Teacher can advance through questions | | PASS / FAIL | |
| **Timing** | Questions pace appropriately for students | | PASS / FAIL | |

### Part 3: Display Quality

| Criterion | Expected | Observed | Status | Notes |
|-----------|----------|----------|--------|-------|
| **No overlap** | No text/figure overlap on display | | PASS / FAIL | |
| **Font size** | Text readable from student seats | | PASS / FAIL | |
| **Color contrast** | Content legible, sufficient contrast | | PASS / FAIL | |
| **Images/figures** | Figures render clearly | | PASS / FAIL | |
| **Equations** | Math notation clear and correct | | PASS / FAIL | |
| **Vietnamese** | Vietnamese text displays correctly | | PASS / FAIL | |
| **Responsive** | Display adapts to different screen sizes | | PASS / FAIL | |

### Part 4: Completion and Feedback

| Criterion | Expected | Observed | Status | Notes |
|-----------|----------|----------|--------|-------|
| **Session completion** | Workflow completed without restart | | PASS / FAIL | |
| **Results saved** | Results/scores recorded correctly | | PASS / FAIL | |
| **Export works** | Can export results/assessment | | PASS / FAIL | |
| **Student access** | Students can access results | | PASS / FAIL | |
| **Teacher report** | Teacher receives clear summary report | | PASS / FAIL | |

---

## ERROR AND INTERRUPTION LOG

| Time | Error / Interruption | Severity | Resolution | Notes |
|------|---------------------|----------|-----------|-------|
| | | Critical / Major / Minor | [How resolved] | |
| | | Critical / Major / Minor | [How resolved] | |
| | | Critical / Major / Minor | [How resolved] | |

**Critical:** Stops workflow, requires restart  
**Major:** Significantly impacts usage, workaround needed  
**Minor:** Inconvenience, doesn't block workflow  

---

## STUDENT OBSERVATION SUMMARY

(Aggregate only; no individual student identifiers)

| Observation | Count / Percentage | Notes |
|-------------|-------------------|-------|
| **Students who completed assessment** | ___/[N] (__%) | |
| **Students with technical difficulties** | ___/[N] (__%) | |
| **Students who understood questions** | ___/[N] (__%) | |
| **Students who could interact successfully** | ___/[N] (__%) | |
| **Student engagement level** | High / Medium / Low | |
| **Questions students found difficult** | [List topic/type] | |
| **Student tech skill level needed** | Minimal / Low / Medium / High | |

---

## TEACHER OBSERVATION

### Workflow Assessment

| Question | Response | Notes |
|----------|----------|-------|
| Would you use this in real teaching? | Yes / No / With modifications | |
| What needs to improve? | [Observations] | |
| What worked well? | [Observations] | |
| Estimated time to integrate into curriculum? | [Days/weeks] | |
| Technical support required? | Yes / No | [Details] |

### Acceptance

| Dimension | Assessment | Evidence |
|-----------|-----------|----------|
| **Pedagogical value** | High / Medium / Low | [Explain] |
| **Ease of use** | Easy / Moderate / Difficult | [Explain] |
| **Student engagement** | High / Medium / Low | [Explain] |
| **Math accuracy** | All correct / Minor issues / Major issues | [Explain] |
| **Technical reliability** | Reliable / Mostly reliable / Unreliable | [Explain] |
| **Readiness for production** | Ready / Needs fixes / Not ready | [Explain] |

---

## CLASSROOM ACCEPTANCE CONCLUSION

**Classroom ID:** CLASS-0X  
**Date:** YYYY-MM-DD  
**Teacher:** TEACHER-ANONYMOUS  

### Metrics

- **Session completed:** Yes / No
- **Critical failures:** 0 / [N]
- **Major issues:** [N]
- **Minor issues:** [N]
- **Workflow completion rate:** ___%
- **Student completion rate:** ___%
- **Estimated teacher prep time:** ___ minutes
- **Estimated student learning gain:** High / Medium / Low

### Overall Classroom Acceptance

☐ **READY FOR CLASSROOM USE** — No critical blockers, ready for real deployment  
☐ **READY WITH FIXES** — Known issues, but fixable before deployment  
☐ **NOT READY** — Significant blockers prevent classroom use  

**Teacher recommendation:** [Freeform assessment]

---

## SIGN-OFF

**Teacher ID:** TEACHER-ANONYMOUS  
**Date:** YYYY-MM-DD  
**Signature:** ________________________  

**Contact (for follow-up):** [Email / Phone]  

---

**INSTRUCTIONS FOR CLASSROOM VALIDATION:**
1. Conduct actual classroom session with real students (or reasonable simulation)
2. Use live v1.6 build (commit 44ac24e, version 1.6.0)
3. Record actual outcomes, not expected outcomes
4. Preserve anonymity — use IDs only, no names
5. Aggregate student data — no individual student records
6. Document any errors, workarounds, or interventions
7. Submit completed record with teacher signature
8. Keep as raw evidence — do not edit after submission
