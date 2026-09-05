# MST-MATH INTERNAL PILOT V1 — GOLDEN E2E CONTRACT

STATUS=READY_FOR_EXECUTION_AFTER_FINAL_BASELINE
AUTHORITY_RULE=REAL_SOURCE_FIRST_FAIL_CLOSED

## GOLDEN A — Teacher Document Workflow

Purpose: prove the ordinary teacher document path with a real authorized DOCX.

Required source properties:
- real authorized DOCX;
- stable source SHA-256;
- 5–10 representative questions when practical;
- at least one mathematical expression;
- at least one known answer/key where the source provides one;
- figure/table content when an eligible source contains it.

Required path:
DOCX → ingest → question detection → teacher review/approval → Question Bank → selection → Assessment → PDF + DOCX

PASS evidence:
- source SHA-256 recorded;
- question/source IDs stable;
- source text/data not silently rewritten;
- PDF generated and valid;
- DOCX generated and valid;
- answer/key alignment passes where applicable;
- provenance chain is recoverable.

## GOLDEN B — Verified Solution + Video

Purpose: prove a real deterministic supported problem can reach a real MP4.

Required source properties:
- authorized real problem;
- explicit/verifiable answer truth;
- supported deterministic solution route;
- immutable source identity.

Required path:
Question authority → Math verification → verified solution → video plan → Manim runtime → MP4 → frame/runtime QA

PASS evidence:
- expected answer and actual verified answer match;
- solution provenance recorded;
- MP4 exists, non-zero size and valid video stream;
- runtime/frame QA passes or records only explicitly non-blocking optional-AI skips.

Important: a real item lacking a machine-verifiable answer must return a bounded unsupported/needs-information result. It must never be coerced into a fabricated solution merely to satisfy this Golden Case.

## GOLDEN C — P01 Student Learning Material

Purpose: independently prove the learning-material path rather than inferring P01 success from Question Bank success.

Required path:
REAL SOURCE → canonical ingest/semantic authority → lesson/content processing → P01 student profile → student artifact → QA → PDF

Minimum acceptance:
- mathematical/source fidelity PASS;
- lesson flow has no broken prerequisite dependency;
- question figures remain owned by the correct question;
- student ruled workspace is present where required by current active authority;
- answer section is present where required;
- page numbering/output rules are obeyed where bound to the runtime;
- PDF opens and is visually usable.

If any required P01 stage is not currently implemented, Golden C returns BLOCK with the exact missing stage. Missing implementation must not be disguised as PASS through a Question Bank or generic document route.

## NEGATIVE A — Fail-Closed Integrity

Purpose: prove MST-MATH refuses unsafe inference.

Input must contain at least one material insufficiency or unsupported condition relevant to a critical output.

Expected behavior:
BLOCK / NEED_MORE_INFORMATION / UNSUPPORTED with a structured reason.

Automatic FAIL conditions:
- invented answer;
- invented source fact;
- silently changed numerical data;
- fabricated geometry;
- output marked successful despite correctness-affecting QA failure.

## Evidence manifest per case

Each executed case must record when applicable:

- PILOT_ID
- CASE_ID
- EXECUTED_AT
- GIT_SHA
- SOURCE_PATH_OR_ID
- SOURCE_SHA256
- QUESTION_IDS
- EXPECTED_ANSWER
- VERIFIED_ANSWER
- QA_RESULTS
- PDF_PATH + SHA256
- DOCX_PATH + SHA256
- VIDEO_PATH + SHA256
- FAILURE_CODE
- HUMAN_VISUAL_REVIEW_REQUIRED

## Gate rule

G3_REAL_E2E=PASS only when Golden A, Golden B, Golden C, and Negative A all PASS on the same final pilot baseline or on a traceable later RC whose affected gates were rerun.
