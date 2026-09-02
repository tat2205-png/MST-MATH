# PiMath Desktop Architecture Discovery V1

PROJECT=PIMATH  
TASK=PIMATH_DESKTOP_APP_V1_FOUNDATION  
DISCOVERY_DATE=2026-09-02  

START_HEAD=2575b9bfb3ed955ad49954e267a640d3129f58d2  
BRANCH=develop/pimath-desktop-app-v1  
CERTIFIED_BASE=release/pimath-v1-certified  
CERTIFIED_HEAD=2575b9bfb3ed955ad49954e267a640d3129f58d2  

## START_HEAD

The working tree starts at the exact certified PiMath V1 head. No certified-release, DNA, or source-binary changes are present in the baseline.

## CURRENT_STACK

CURRENT_FRONTEND_STACK=React 19 + TypeScript + Vite 6 + Tailwind CSS v4  
CURRENT_SERVER_STACK=Node.js + TypeScript + Express 4; `server.ts` starts the API and Vite middleware on localhost port 3000  
CURRENT_RUNTIME_STACK=Node services with optional Python/Manim, LibreOffice, Docling/PaddleOCR, Ollama/Qwen3-VL bridges  
PACKAGE_MANAGER=npm (`package-lock.json`)

The browser currently talks to `/api/*` routes. The backend owns orchestration, document ingestion, export, runtime status, and repair boundaries. The frontend already contains teacher workflow UI and the compact workflow concepts needed for reuse.

## DESKTOP_FRAMEWORK_RECOMMENDATION

DESKTOP_FRAMEWORK_RECOMMENDATION=Electron + existing React/Vite/TypeScript renderer, introduced only in the editable app layer  
DESKTOP_FRAMEWORK_DECISION=RECOMMENDED_FOR_MILESTONE_1; dependency not added in Milestone 0

### RATIONALE

Electron matches the existing Node/React/Vite ecosystem and can package one renderer plus one trusted local backend process for Windows x64 and macOS arm64. It avoids duplicating the certified engines and permits native file dialogs and safe folder actions through a typed preload bridge. The current backend can be reused behind a desktop startup adapter; Milestone 1 must remove assumptions that the working directory is the user-selected output directory and must avoid starting a second server.

Tauri was not selected because it would introduce a second native runtime/language boundary while the current application already has a substantial Node backend and optional Node/Python runtime adapters. This is a fit assessment, not a claim that Tauri is technically impossible.

## APP_BOUNDARY

The editable desktop app layer owns:

- native file selection, drag/drop path intake, and input-type detection;
- local per-device configuration containing only the selected output-root path;
- local workspace, job lifecycle, recent-job metadata, hashing, provenance, staging, validation, and atomic publication;
- typed desktop IPC and safe open/reveal actions;
- the teacher-facing `Đầu vào → Lựa chọn → Đầu ra` shell.

The app job model is distinct from DocumentIR and QuestionIR.

## CERTIFIED_ENGINE_BOUNDARY

The certified pipeline remains authoritative for document parsing, DocumentIR, QuestionIR, math semantics, Math Engine, Figure Engine, Geometry/FOLD, Exam Engine, canonical output profiles, and DNA. The desktop layer may call existing services and adapters but must not reimplement or mutate them.

## REUSED_COMPONENTS

- `src/App.tsx` and the existing React/Vite entrypoint for renderer reuse.
- `src/components/Header.tsx` and existing PiMath visual/configuration conventions.
- `src/components/teacher/TeacherWorkspace.tsx` for teacher workflow UI patterns.
- `src/services/teacherWorkflowTypes.ts` for existing workflow contracts where applicable.
- `server.ts` and its existing API route registration, including teacher workflow routes.
- `server/services/teacherWorkflowService.ts` and `src/modules/document-engine/*` for the certified DOCX route.
- `src/modules/document-export/*`, `src/modules/question-bank/*`, and existing QA services for certified output paths.
- Existing optional runtime bridges under `tools/pimath-local-runtime/`.

## FILES_TO_ADD

Milestone 1 is expected to add only desktop-layer files, initially:

- `desktop/main/` trusted Electron main process and server lifecycle adapter.
- `desktop/preload/` typed, minimal IPC API.
- `desktop/platform/common/`, `windows/`, `macos/` platform adapters.
- `desktop/workspace/` local config, hashing, staging, and atomic publication.
- `desktop/jobs/` app-level job model and manager.
- `desktop/packaging/` platform packaging configuration.
- desktop shell UI components under `src/components/desktop/` as needed.

## FILES_TO_MODIFY

Expected Milestone 1 modifications, subject to implementation inspection:

- `package.json` and `package-lock.json` only for justified desktop scripts/dependencies.
- `vite.config.ts` only if renderer packaging requires a non-invasive build entry adjustment.
- `src/App.tsx` to expose the desktop teacher shell while preserving current workflows.
- `src/index.css` only for the compact shell styling.
- `server.ts` only to support an injected safe port/host and app-layer integration; no engine behavior changes.

## PROTECTED_FILES_NOT_TO_MODIFY

Do not modify `release/pimath-v1-certified` or `main`. Within this branch, do not modify canonical DNA/registry decisions, DocumentIR, QuestionIR, Math Engine, Figure Engine, Geometry/FOLD, Exam Engine, or canonical output-profile semantics. In particular, desktop code must not create parallel IR or engine implementations.

## STORAGE_ARCHITECTURE

INPUT_POLICY=ANY_USER_SELECTED_ACCESSIBLE_PATH; no fixed input folder and no source copying requirement  
OUTPUT_POLICY=USER_SELECTED_SHARED_ROOT; local Dropbox-synchronized folder is supported, Dropbox API and credentials are not required  
WORKSPACE_POLICY=LOCAL_PER_DEVICE; OS application-data directory for config, cache, jobs, logs, and temporary results  
TEMP_ON_DROPBOX=NO  
CACHE_ON_DROPBOX=NO  
JOBS_ON_DROPBOX=NO  
LOGS_ON_DROPBOX=NO

The app preserves `sourcePath`, a content `sourceHash`, source identity, and provenance. Final results are validated and QA-checked in local staging, then published with versioned no-overwrite naming. Unavailable output roots produce a recoverable configuration error.

## WINDOWS_RISKS

- Windows path/drive-letter and external-drive availability changes.
- Dropbox files may be online-only or temporarily syncing.
- Existing port 3000 may already be occupied; desktop startup must detect/reuse safely.
- Optional LibreOffice/Python/Ollama installations vary by machine.
- Native packaging and code-signing are separate release concerns.

## MACOS_RISKS

- macOS privacy permissions can affect Desktop, Documents, USB, and external volumes.
- Apple Silicon native/translated runtime availability must be tested on macOS arm64.
- App bundle resource paths differ from development `process.cwd()`.
- Gatekeeper/notarization and optional runtime discovery need native validation.

## DEPENDENCIES_PROPOSED

Milestone 0 adds none. For Milestone 1, Electron is the only required desktop framework dependency proposed. Packaging tooling may be added only after the first vertical slice proves the lifecycle. No cloud provider and no paid runtime dependency is required. Existing dependencies are retained.

## DNA_GAP_DETECTED

NO. No canonical DNA rule is missing for the requested shell. The path-based storage, job, IPC, and publication rules are app-layer policies. Any future feature that requires an absent canonical output or visual rule must stop and report `DNA_GAP_DETECTED`.

## MILESTONE_0_STATUS

PASS_WITH_MILESTONE_1_GUARDS

Discovery passes because the certified lineage is intact, the current architecture has reusable frontend/backend authorities, and Electron can remain a single-codebase shell. Milestone 1 is authorized to proceed only with one backend authority, typed secure IPC, local staging, atomic versioned publication, and no certified-engine mutation.

