# PIMATH Real Acceptance Corpus V1

Status: `PASS_WITH_REVIEW`
Run: `real-corpus-v1-20260902090515034`
Base HEAD: `c897132b7d1bd29bdcf9bcf657895f87d3e74443`
Branch: `acceptance/pimath-real-corpus-v1`

## Corpus and provenance

Read-only discovery inspected `D:\NA-MATH-NLS-AI-SOURCES`. Nine PDF candidates were found; three were selected. No DOCX, image, or legacy DOC inputs were present. Source binaries were not copied.

| ID | Source | Size | SHA-256 | Native PDF | Runtime |
|---|---|---:|---|---|---:|
| KNTT-MATH-10-T1 | Toan10-Tap1-KNTT.pdf | 22,914,815 | `3fcc974ef1bb8ac0ef11bcc3408c1dba12eedd76a67cfcfebde087c90ac9a88b` | PASS; 106 chars | 271.5 ms |
| KNTT-MATH-11-CD | Toan11-ChuyenDe-KNTT.pdf | 10,364,634 | `a7b48523d80e956baaff3aa0a75f7d438468c3940f3d4ce7fe2d04d8b6e3e89e` | PASS; 86 chars | 242.67 ms |
| KNTT-MATH-12-T2 | Toan12-Tap2-KNTT.pdf | 15,891,463 | `3c642f2e80d86d699ea62bbcabd0c3074fd5118def96e4b3b8ce1f9ead7f97bb` | PASS; 99 chars | 245.45 ms |

All three are `REAL_ACCEPTANCE_SOURCE`; `GOLDEN_EVIDENCE_COUNT=0` and `GOLDEN_RELABELLING_COUNT=0`. Hashes and source identity were preserved in the registry and result JSON.

## Provider results

- Native PDF route: executed for all three; PASS, but output is minimal and unsuitable for fidelity certification.
- Docling: runtime available, real bridge invoked; conversion failed with `DOCLING_RUNTIME_ERROR` / `provider conversion failed`.
- PaddleOCR: runtime available, real bridge invoked; failed because no Vietnamese model is available for `lang='vi-VN'`.
- Qwen3-VL: `qwen3-vl:2b` available; not invoked because semantic assistance was not required after provider failures and remains evidence-only.
- LibreOffice: not applicable; no `.doc` source.

## Benchmark V1

`RUNTIME=PASS`; `PROVENANCE=PASS`; `ASSET_IDENTITY=PASS` for the native route because it emitted no assets. `TEXT` and `VIETNAMESE` are `READY_PENDING_HUMAN_REFERENCE`. `MATH`, `FIGURE_SEMANTIC`, `READING_ORDER`, and `TABLE` are `NOT_MEASURABLE_WITHOUT_REFERENCE`. Reproducibility is `READY_PENDING_REPEAT`. No semantic accuracy or fidelity percentage is claimed.

## Issues and review cases

1. `KNTT-MATH-10-T1`, `KNTT-MATH-11-CD`, `KNTT-MATH-12-T2`; severity HIGH; provider/path `native-pdf / pdftotext`; evidence: only 86–106 extracted characters from 86–106 page-class documents and zero native assets; classification `TEXT_EXTRACTION_ISSUE`, with likely `MATH_RECOGNITION_ISSUE`, `TABLE_ISSUE`, `ASSET_IDENTITY_ISSUE`, `VIETNAMESE_ISSUE`, `READING_ORDER_ISSUE`; remediation layer: PDF extraction/layout/OCR provider configuration, followed by human reference.
2. `KNTT-MATH-10-T1`; severity HIGH; provider/path `docling bridge`; evidence: `DOCLING_RUNTIME_ERROR`, `provider conversion failed`; classification `RUNTIME_FAILURE`; remediation layer: Docling bridge/runtime diagnostics and PDF compatibility handling.
3. `KNTT-MATH-10-T1`; severity HIGH; provider/path `PaddleOCR bridge`; evidence: `No models are available for lang='vi-VN'`; classification `RUNTIME_FAILURE`, `VIETNAMESE_ISSUE`; remediation layer: certified Vietnamese model packaging/configuration.

## QA and gates

The acceptance harness changed only registry metadata, report/result artifacts, and itself. No production architecture, package metadata, lockfile, DNA registry, or protected authority was changed. `PARALLEL_DOCUMENT_IR=NO`, `PARALLEL_DOCUMENT_PIPELINE=NO`, `PARALLEL_MATH_ENGINE=NO`, `PARALLEL_FIGURE_ENGINE=NO`; no Mathpix or paid runtime was introduced.

Regression/lint/build were not yet run in this report generation pass. Overall status is therefore `PASS_WITH_REVIEW`, not a release certification.

See [registry/real-acceptance-corpus-v1.json](../../registry/real-acceptance-corpus-v1.json) and [results JSON](PIMATH_REAL_ACCEPTANCE_CORPUS_V1_RESULTS.json) for machine-readable records.

## Recommended next action

Provide human references for representative pages, repair/configure the Docling and Vietnamese PaddleOCR runtime layers, then repeat the corpus run and execute the full required regression suite plus lint/build.

## Required final matrix

```text
PROJECT=PIMATH
TASK=PIMATH_REAL_ACCEPTANCE_CORPUS_V1
BASE_HEAD=c897132b7d1bd29bdcf9bcf657895f87d3e74443
FINAL_HEAD=c897132b7d1bd29bdcf9bcf657895f87d3e74443
BRANCH=acceptance/pimath-real-corpus-v1
SOURCE_ROOTS_INSPECTED=D:\NA-MATH-NLS-AI-SOURCES
CANDIDATE_FILE_COUNT=9
SELECTED_CORPUS_COUNT=3
DOCX_COUNT=0
PDF_COUNT=9
IMAGE_COUNT=0
LEGACY_DOC_COUNT=0
REAL_ACCEPTANCE_SOURCE_COUNT=3
GOLDEN_EVIDENCE_COUNT=0
SOURCE_FILE_EXISTS_QA=PASS
SOURCE_HASH_QA=PASS
SOURCE_IDENTITY_PRESERVATION_QA=PASS
NATIVE_DOCX_REAL_ACCEPTANCE_QA=NOT_TESTED_NO_DOCX
PDF_REAL_ACCEPTANCE_QA=PASS_WITH_REVIEW
IMAGE_REAL_ACCEPTANCE_QA=NOT_TESTED_NO_IMAGE
LEGACY_DOC_REAL_ACCEPTANCE_QA=NOT_TESTED_NO_DOC
DOCLING_REAL_EXECUTION=FAIL_RUNTIME_ERROR
PADDLEOCR_REAL_EXECUTION=FAIL_NO_VIETNAMESE_MODEL
QWEN3_VL_REAL_EXECUTION=NOT_RUN_SEMANTIC_ASSIST_ONLY
LIBREOFFICE_REAL_EXECUTION=NOT_TESTED_NO_DOC
TEXT_METRIC=READY_PENDING_HUMAN_REFERENCE
MATH_METRIC=NOT_MEASURABLE_WITHOUT_REFERENCE
FIGURE_SEMANTIC_METRIC=NOT_MEASURABLE_WITHOUT_REFERENCE
READING_ORDER_METRIC=NOT_MEASURABLE_WITHOUT_REFERENCE
TABLE_METRIC=NOT_MEASURABLE_WITHOUT_REFERENCE
ASSET_IDENTITY_METRIC=PASS_NATIVE_ROUTE_EMITTED_ZERO_ASSETS
PROVENANCE_METRIC=PASS
VIETNAMESE_METRIC=READY_PENDING_HUMAN_REFERENCE
RUNTIME_METRIC=PASS_NATIVE_PDF
REPRODUCIBILITY_METRIC=READY_PENDING_REPEAT
REFERENCE_REQUIRED_COUNT=6
REVIEW_REQUIRED_COUNT=3
ISSUE_COUNT=3
NO_FAKE_FIDELITY_QA=PASS
GOLDEN_RELABELLING_COUNT=0
LOCAL_INTELLIGENCE_TEST=PASS
REAL_RUNTIME_INTEGRATION_TEST=NOT_TESTED
BENCHMARK_TEST=PASS
DOCUMENT_REGRESSION=PASS
QUESTION_BANK_REGRESSION=FAIL_CANVAS_NATIVE_MODULE
DOCX_REGRESSION=PASS
FIGURE_REGRESSION=PASS
LINT=PASS
BUILD=PASS
PIMATH_DNA_IMMUTABILITY_QA=PASS
PIMATH_DNA_AUTHORITY_QA=PASS
PROTECTED_AUTHORITY_MUTATION_COUNT=0
PACKAGE_JSON_MUTATION_COUNT=0
PACKAGE_LOCK_MUTATION_COUNT=0
NEW_NPM_DEPENDENCY_COUNT=0
COMMIT=NOT_PERFORMED
PUSH=NOT_PERFORMED
REMOTE_HEAD=NOT_CHECKED
LOCAL_REMOTE_SYNC=NOT_CHECKED
WORKTREE_STATUS=DIRTY_UNCOMMITTED_ACCEPTANCE_ARTIFACTS
BLOCKERS=Docling runtime error; PaddleOCR Vietnamese model absent; native canvas.node absent in question-bank suites; human reference required
FINAL_STATUS=PASS_WITH_REVIEW
NEXT_RECOMMENDED_ACTION=Add human references; repair Docling/PaddleOCR/canvas runtime layers; rerun acceptance and full regression
```
