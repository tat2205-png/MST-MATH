# PiMath Desktop App V1 — Milestone 1 Report

PROJECT=PIMATH  
TASK=PIMATH_DESKTOP_APP_V1_MILESTONE_1

## Implementation status

This report records the implemented cross-platform foundation. The secure Electron development shell uses the existing React/Vite renderer and keeps the certified PiMath services outside the desktop app layer.

FOUNDATION_IMPLEMENTATION=COMPLETE  
DESKTOP_FRAMEWORK=Electron  
ONE_CODEBASE=YES  
MACOS_ARM64_SUPPORT=IMPLEMENTED_NOT_YET_RUNTIME_CERTIFIED

## Architecture

- `desktop/main` owns native dialogs, safe open actions, and IPC registration.
- `desktop/preload` exposes only typed, explicit methods through `contextBridge`.
- `desktop/workspace` owns OS-native app data, configuration, hashing, input detection, and atomic versioned publication.
- `desktop/jobs` owns lightweight app job metadata; source binaries are never copied into metadata.
- The renderer remains React/Vite. No Node or filesystem API is exposed to it.

Storage policy is locked to arbitrary accessible input paths, a user-selected shared output root, and a per-device local workspace (`JOBS`, `TEMP`, `CACHE`, `LOGS`).

## First vertical slice

FIRST_VERTICAL_SLICE=DOCX teacher workflow integration foundation  
FIRST_VERTICAL_SLICE_INPUT=DOCX  
FIRST_VERTICAL_SLICE_OUTPUT=Existing teacher workflow assessment export (DOCX/PDF), staged locally before publication

The selected route reuses `TeacherWorkflowService.importDocxForRuntime` and its existing certified question-bank/export services. Desktop job creation records source path, SHA-256 hash, input type, provenance identity, and local workspace before backend processing. Publication uses versioned no-overwrite names and atomic rename from a local staged file.

## Dependencies

DEPENDENCIES_ADDED=electron (development dependency only)  
PACKAGE_JSON_DESKTOP_DELTA=desktop:build, desktop:dev scripts; electron devDependency  
PACKAGE_LOCK_DESKTOP_DELTA=electron and its transitive development/runtime packages

## QA and evidence

DESKTOP_FOUNDATION_SMOKE=PASS  
WINDOWS_DESKTOP_START=NOT_TESTED (Electron UI launch requires interactive desktop session)
WINDOWS_MAIN_PROCESS=BUILD_PASS; UI_RUNTIME_NOT_TESTED
WINDOWS_PRELOAD=BUILD_PASS; UI_RUNTIME_NOT_TESTED
WINDOWS_RENDERER=NOT_TESTED
WINDOWS_FILE_PICKER=IMPLEMENTED_NOT_YET_RUNTIME_CERTIFIED
WINDOWS_ARBITRARY_INPUT_PATH=PASS (automated Windows adapter run)
WINDOWS_DRAG_DROP=HUMAN_UI_CONFIRMATION_REQUIRED
WINDOWS_OUTPUT_ROOT_SELECTION=PASS (configured local root)
WINDOWS_LOCAL_CONFIG=PASS
WINDOWS_LOCAL_WORKSPACE=PASS
WINDOWS_PROCESS_JOB=PASS (real DOCX fixture through certified services)
WINDOWS_PUBLISH_RESULT=PASS
WINDOWS_OPEN_OUTPUT=NOT_TESTED
WINDOWS_OPEN_RESULT=NOT_TESTED
WINDOWS_SPACE_PATH_QA=PASS
WINDOWS_UNICODE_PATH_QA=PASS
OUTPUT_FILE_EXISTS=PASS
OUTPUT_FILE_NONZERO=PASS
OUTPUT_FILE_SIGNATURE_VALID=PASS (OOXML ZIP package)
OUTPUT_VERSIONING_RUNTIME_QA=PASS (_v001 and _v002)
NO_OVERWRITE_RUNTIME_QA=PASS
ATOMIC_OUTPUT_RUNTIME_QA=PASS
PARTIAL_FILE_EXPOSURE_COUNT=0
DROPBOX_API_REQUIRED=NO
DROPBOX_FILESYSTEM_SEMANTICS_QA=PASS
DROPBOX_REAL_SYNC_QA=NOT_TESTED
IPC_SECURITY_QA=PASS (static contract; UI runtime not tested)

PIMATH_CERTIFIED_RELEASE_MUTATION=NO  
PIMATH_DNA_IMMUTABILITY_QA=PASS  
PROTECTED_AUTHORITY_MUTATION_COUNT=0

EXISTING_DOCX_INGEST_ENTRY=QuestionBankService.importDocxForRuntime → ingestDocxQuestionsForRuntime
EXISTING_PROCESSING_ENTRY=AssessmentService.generate
EXISTING_EXPORT_ENTRY=QuestionBankExportService.deliver → renderDocx
DOCX_VERTICAL_SLICE=INCOMPLETE  
FIRST_VERTICAL_SLICE=INCOMPLETE: Desktop foundation is implemented; full existing DOCX pipeline publication remains incomplete pending separate completion work.
WINDOWS_RUNTIME_CERTIFICATION=NOT_TESTED  
WINDOWS_RUNTIME_EVIDENCE=Automated adapter evidence exists, but Windows Electron runtime certification remains not tested.
OUTPUT_PUBLICATION_EVIDENCE=Two nonzero OOXML files published as sample-input_v001.docx and sample-input_v002.docx; source hash stable; no partial files
KNOWN_LIMITATIONS=Interactive Electron launch, picker, drag/drop, and open actions require human UI confirmation; Dropbox cloud sync not tested
Optional LibreOffice and Qwen3-VL remain capability providers, never startup requirements.

MILESTONE_1_STATUS=INCOMPLETE  
PAUSE_REASON=TEMPORARY_CHECKPOINT_FOR_SEPARATE_QUESTION_BANK_RELATIONS_WORKSTREAM  
NEXT_DESKTOP_ACTION=RESUME_M1_COMPLETION_LATER

## Validation run

TYPESCRIPT_QA=PASS  
BUILD_QA=PASS  
ARCHITECTURE_QA=PASS (5 pre-existing warnings, 0 errors)  
PIMATH_ENGINE_REGRESSION=70/70 PASS  
WINDOWS_RUNTIME_QA=NOT_TESTED: Windows runtime certification remains outstanding.
