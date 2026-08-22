param(
    [string]$Task = "",
    [switch]$Bootstrap,
    [ValidateRange(1,3)]
    [int]$MaxRepairAttempts = 3
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$AutomationRoot = Join-Path $ProjectRoot ".automation"
$RunsRoot = Join-Path $AutomationRoot "runs"
$SchemaFile = Join-Path $AutomationRoot "codex-patch-schema.json"

New-Item -ItemType Directory -Force $AutomationRoot | Out-Null
New-Item -ItemType Directory -Force $RunsRoot | Out-Null

function Write-Section([string]$Title) {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host " $Title"
    Write-Host "============================================================"
}

function Write-Utf8NoBom([string]$Path, [string]$Text) {
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Text, $enc)
}

function Ensure-PatchSchema {
    $schema = @'
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["PATCH_READY", "HUMAN_REVIEW_REQUIRED", "NO_CHANGES"]
    },
    "summary": { "type": "string" },
    "touched_files": {
      "type": "array",
      "items": { "type": "string" }
    },
    "patch": { "type": "string" },
    "reasons": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["status", "summary", "touched_files", "patch", "reasons"],
  "additionalProperties": false
}
'@
    Write-Utf8NoBom $SchemaFile $schema
}

function Invoke-CodexReadOnly {
    param(
        [Parameter(Mandatory=$true)][string]$PromptFile,
        [Parameter(Mandatory=$true)][string]$OutputFile,
        [Parameter(Mandatory=$true)][string]$LogFile,
        [string]$WorkingDirectory = $ProjectRoot,
        [switch]$SkipGitRepoCheck
    )

    $args = @(
        "exec",
        "--ephemeral",
        "--sandbox", "read-only",
        "-C", $WorkingDirectory,
        "--output-schema", $SchemaFile,
        "--output-last-message", $OutputFile
    )

    if ($SkipGitRepoCheck) {
        $args += "--skip-git-repo-check"
    }

    $args += "-"

    Get-Content -Raw $PromptFile |
        & codex @args 2>&1 |
        Tee-Object -FilePath $LogFile

    return $LASTEXITCODE
}

function Get-PatchPaths([string]$PatchText) {
    $paths = New-Object System.Collections.Generic.List[string]

    $matches = [regex]::Matches(
        $PatchText,
        '(?m)^diff --git a/([^\r\n]+) b/([^\r\n]+)\r?$'
    )

    foreach ($m in $matches) {
        $a = $m.Groups[1].Value.Trim()
        $b = $m.Groups[2].Value.Trim()

        if ($a.StartsWith('"') -or $b.StartsWith('"')) {
            throw "Quoted/escaped diff paths are not supported by AutoPilot V2."
        }

        if ($a -ne $b) {
            throw "Rename/move patches are not allowed automatically: $a -> $b"
        }

        if (-not $paths.Contains($b)) {
            $paths.Add($b) | Out-Null
        }
    }

    return @($paths)
}

function Test-SafeRelativePath([string]$Path) {
    $p = $Path.Replace("\", "/").Trim()

    if ([string]::IsNullOrWhiteSpace($p)) { return $false }
    if ($p.StartsWith("/") -or $p -match '^[A-Za-z]:') { return $false }
    if ($p -match '(^|/)\.\.(/|$)') { return $false }

    $blockedExact = @(
        ".env",
        "AGENTS.md",
        "SOUL.md",
        "IDENTITY.md",
        "TOOLS.md",
        "USER.md",
        "scripts/autopilot.ps1"
    )

    foreach ($x in $blockedExact) {
        if ($p -ieq $x) { return $false }
    }

    $blockedPrefixes = @(
        ".git/",
        ".automation/",
        "node_modules/",
        "dist/",
        "openclaw-extension-windows-fix/"
    )

    foreach ($prefix in $blockedPrefixes) {
        if ($p.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $false
        }
    }

    if ($p -match '(^|/)\.env(\.|$)') { return $false }

    $blockedLocks = @(
        "bun.lock",
        "bun.lockb",
        "pnpm-lock.yaml",
        "yarn.lock"
    )

    foreach ($lock in $blockedLocks) {
        if ($p -ieq $lock) { return $false }
    }

    return $true
}

function Validate-CodexPatch {
    param(
        [Parameter(Mandatory=$true)]$Response
    )

    if ($Response.status -eq "HUMAN_REVIEW_REQUIRED") {
        return [pscustomobject]@{
            Allowed = $false
            HumanGate = $true
            Reason = ($Response.reasons -join "; ")
            Paths = @()
        }
    }

    if ($Response.status -eq "NO_CHANGES") {
        return [pscustomobject]@{
            Allowed = $true
            HumanGate = $false
            Reason = "No changes required."
            Paths = @()
        }
    }

    if ($Response.status -ne "PATCH_READY") {
        throw "Unexpected Codex status: $($Response.status)"
    }

    $patch = [string]$Response.patch

    if ([string]::IsNullOrWhiteSpace($patch)) {
        throw "PATCH_READY response contains an empty patch."
    }

    $forbiddenMarkers = @(
        "GIT binary patch",
        "Binary files ",
        "deleted file mode ",
        "rename from ",
        "rename to ",
        "similarity index ",
        "old mode "
    )

    foreach ($marker in $forbiddenMarkers) {
        if ($patch.Contains($marker)) {
            throw "Automatic patch rejected because it contains forbidden operation: $marker"
        }
    }

    $paths = @(Get-PatchPaths $patch)

    if ($paths.Count -eq 0) {
        throw "Patch contains no recognized diff --git paths."
    }

    foreach ($p in $paths) {
        if (-not (Test-SafeRelativePath $p)) {
            throw "Automatic patch rejected for protected/unsafe path: $p"
        }
    }

    $declared = @(
        $Response.touched_files |
        ForEach-Object { ([string]$_).Replace("\", "/").Trim() } |
        Sort-Object -Unique
    )

    $actual = @(
        $paths |
        ForEach-Object { $_.Replace("\", "/").Trim() } |
        Sort-Object -Unique
    )

    if (($declared -join "`n") -ne ($actual -join "`n")) {
        throw "touched_files does not exactly match paths present in the patch."
    }

    return [pscustomobject]@{
        Allowed = $true
        HumanGate = $false
        Reason = "Patch safety validation PASS."
        Paths = $paths
    }
}

function Apply-PatchFile([string]$PatchFile) {
    & git apply --check --whitespace=nowarn $PatchFile
    if ($LASTEXITCODE -ne 0) {
        throw "git apply --check failed."
    }

    & git apply --whitespace=nowarn $PatchFile
    if ($LASTEXITCODE -ne 0) {
        throw "git apply failed."
    }
}

function Rollback-Patches([System.Collections.Generic.List[string]]$PatchFiles) {
    if ($PatchFiles.Count -eq 0) { return $true }

    $allOk = $true

    for ($i = $PatchFiles.Count - 1; $i -ge 0; $i--) {
        $p = $PatchFiles[$i]

        & git apply -R --check --whitespace=nowarn $p *> $null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Rollback check failed for $p"
            $allOk = $false
            continue
        }

        & git apply -R --whitespace=nowarn $p
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Rollback failed for $p"
            $allOk = $false
        }
    }

    return $allOk
}

function Invoke-DevLoop([string]$LogFile) {
    $devLoop = Join-Path $ProjectRoot "scripts\dev-loop.ps1"
    if (-not (Test-Path $devLoop)) {
        throw "Missing scripts\dev-loop.ps1"
    }

    & pwsh -ExecutionPolicy Bypass -File $devLoop -Mode Full 2>&1 |
        Tee-Object -FilePath $LogFile

    return $LASTEXITCODE
}

function Test-OverallPass([string]$LogFile) {
    if (-not (Test-Path $LogFile)) { return $false }
    $text = Get-Content -Raw $LogFile
    return $text -match 'OVERALL_STATUS:\s*PASS'
}

function Test-HumanGateFailure([string]$LogFile) {
    if (-not (Test-Path $LogFile)) { return $false }

    $text = Get-Content -Raw $LogFile

    $patterns = @(
        'MATH_REGRESSION_QA\s+FAIL',
        'MATH_GATE_QA\s+FAIL',
        'GEOMETRY[_A-Z]*QA\s+FAIL',
        'PROVENANCE_QA\s+FAIL',
        'ZERO_INFERENCE_QA\s+FAIL',
        'SOURCE_[A-Z_]*QA\s+FAIL',
        'DETERMINISTIC_[A-Z_]*QA\s+FAIL'
    )

    foreach ($pattern in $patterns) {
        if ($text -match $pattern) {
            return $true
        }
    }

    return $false
}

function New-BasePrompt([string]$UserTask) {
    return @"
# MATH AI VIDEO STUDIO — AUTOPILOT PATCH TASK

USER TASK:
$UserTask

ROLE:
You are the planning/coding agent, but this session is READ-ONLY.
Do NOT try to edit files directly.
Inspect the repository and return a unified Git patch in the required structured response.

MANDATORY RULES:
- Read and obey AGENTS.md.
- Work from the repository's CURRENT state, including existing uncommitted changes.
- Preserve all existing behavior unless the task explicitly requires a change.
- Do not propose git reset, git clean, commit, or push.
- Do not modify .env, secrets, governance files, node_modules, dist,
  .automation, the nested OpenClaw extension, or scripts/autopilot.ps1.
- Do not change package manager or dependency lockfiles.
- Avoid dependency changes.
- Never weaken tests, runtime schemas, provenance, source fingerprints,
  zero-inference, deterministic math verification, geometry locks,
  or fail-closed gates merely to make QA pass.
- Mathematical/geometry/source/provenance semantic uncertainty must return
  status HUMAN_REVIEW_REQUIRED rather than guessing.
- Implement the smallest coherent change.
- New source/test files are allowed.
- File deletion, rename/move, binary changes, and mode changes are not allowed
  in automatic patch mode.

OUTPUT CONTRACT:
- status = PATCH_READY when a safe patch is ready.
- status = NO_CHANGES when no change is required.
- status = HUMAN_REVIEW_REQUIRED for math/geometry/source/provenance ambiguity
  or any task that cannot be safely completed under these rules.
- touched_files must exactly equal the repository-relative paths changed by patch.
- patch must be a valid unified Git diff rooted at this repository.
- patch must contain no Markdown fences or prose.
"@
}

function Write-FinalReport {
    param(
        [string]$Path,
        [string]$Status,
        [string]$TaskText,
        [string]$RunDirectory,
        [int]$RepairAttempts,
        [string]$QaLog = "",
        [string]$Reason = "",
        [bool]$RollbackOk = $true
    )

    $obj = [ordered]@{
        timestamp = (Get-Date).ToString("o")
        task = $TaskText
        status = $Status
        runDirectory = $RunDirectory
        repairAttempts = $RepairAttempts
        qaLog = $QaLog
        reason = $Reason
        rollbackOk = $RollbackOk
    }

    $obj | ConvertTo-Json -Depth 10 | Out-File $Path -Encoding utf8
}

Ensure-PatchSchema
Set-Location $ProjectRoot

if ($Bootstrap -or [string]::IsNullOrWhiteSpace($Task)) {
    Write-Section "MATH AI VIDEO STUDIO — AUTOPILOT V2 BOOTSTRAP"

    $report = [ordered]@{
        timestamp = (Get-Date).ToString("o")
        projectRoot = $ProjectRoot
        powershell = $PSVersionTable.PSVersion.ToString()
        node = $null
        npm = $null
        codex = $null
        openclaw = $null
        devLoop = $false
        codexReadOnlyStructured = $false
        hostPatchApply = $false
        overall = "FAIL"
    }

    try { $report.node = (& node --version 2>$null | Select-Object -First 1) } catch {}
    try { $report.npm = (& npm --version 2>$null | Select-Object -First 1) } catch {}
    try { $report.codex = (& codex --version 2>$null | Select-Object -First 1) } catch {}
    try { $report.openclaw = (& openclaw --version 2>$null | Select-Object -First 1) } catch {}

    $report.devLoop = Test-Path (Join-Path $ProjectRoot "scripts\dev-loop.ps1")

    $probePrompt = Join-Path $AutomationRoot "readonly-probe-prompt.txt"
    $probeOutput = Join-Path $AutomationRoot "readonly-probe-output.json"
    $probeLog = Join-Path $AutomationRoot "readonly-probe.log"

    Write-Utf8NoBom $probePrompt @"
Return this structured result:
status: NO_CHANGES
summary: AutoPilot V2 read-only structured-output probe.
touched_files: []
patch: empty string
reasons: []
Do not modify any file.
"@

    try {
        $exit = Invoke-CodexReadOnly `
            -PromptFile $probePrompt `
            -OutputFile $probeOutput `
            -LogFile $probeLog

        if ($exit -eq 0 -and (Test-Path $probeOutput)) {
            $probe = Get-Content -Raw $probeOutput | ConvertFrom-Json
            $report.codexReadOnlyStructured = (
                $probe.status -eq "NO_CHANGES" -and
                @($probe.touched_files).Count -eq 0
            )
        }
    }
    catch {
        $report.codexReadOnlyStructured = $false
    }

    $hostProbePatch = Join-Path $AutomationRoot "host-patch-probe.diff"
    $hostProbeTarget = Join-Path $AutomationRoot "host-patch-probe.txt"

    if (Test-Path $hostProbeTarget) {
        Remove-Item $hostProbeTarget -Force
    }

    $fixedPatch = @"
diff --git a/.automation/host-patch-probe.txt b/.automation/host-patch-probe.txt
new file mode 100644
--- /dev/null
+++ b/.automation/host-patch-probe.txt
@@ -0,0 +1 @@
+HOST_PATCH_OK
"@

    Write-Utf8NoBom $hostProbePatch $fixedPatch

    try {
        & git apply --check --whitespace=nowarn $hostProbePatch *> $null
        if ($LASTEXITCODE -eq 0) {
            & git apply --whitespace=nowarn $hostProbePatch *> $null

            if ($LASTEXITCODE -eq 0 -and (Test-Path $hostProbeTarget)) {
                $content = (Get-Content -Raw $hostProbeTarget).Trim()

                if ($content -eq "HOST_PATCH_OK") {
                    & git apply -R --check --whitespace=nowarn $hostProbePatch *> $null
                    if ($LASTEXITCODE -eq 0) {
                        & git apply -R --whitespace=nowarn $hostProbePatch *> $null
                        $report.hostPatchApply = (
                            $LASTEXITCODE -eq 0 -and
                            -not (Test-Path $hostProbeTarget)
                        )
                    }
                }
            }
        }
    }
    catch {
        $report.hostPatchApply = $false
    }

    if (
        $report.node -and
        $report.npm -and
        $report.codex -and
        $report.openclaw -and
        $report.devLoop -and
        $report.codexReadOnlyStructured -and
        $report.hostPatchApply
    ) {
        $report.overall = "PASS"
    }

    $bootstrapReport = Join-Path $AutomationRoot "bootstrap-v2-report.json"
    $report | ConvertTo-Json -Depth 10 | Out-File $bootstrapReport -Encoding utf8
    $report | Format-List

    Write-Host ""
    Write-Host "BOOTSTRAP_REPORT: $bootstrapReport"
    Write-Host "OVERALL_STATUS: $($report.overall)"

    if ($report.overall -eq "PASS") {
        Write-Host "AUTOPILOT_V2_READY: PASS"
        exit 0
    }

    Write-Host "AUTOPILOT_V2_READY: FAIL"
    exit 1
}

$bootstrapPath = Join-Path $AutomationRoot "bootstrap-v2-report.json"
if (-not (Test-Path $bootstrapPath)) {
    throw "Run AutoPilot V2 bootstrap first."
}

$bootstrap = Get-Content -Raw $bootstrapPath | ConvertFrom-Json
if ($bootstrap.overall -ne "PASS") {
    throw "AutoPilot V2 bootstrap is not PASS."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runDir = Join-Path $RunsRoot $stamp
New-Item -ItemType Directory -Force $runDir | Out-Null

$finalReport = Join-Path $runDir "final-report.json"
$baselineStatus = Join-Path $runDir "git-status-before.txt"
$baselineDiff = Join-Path $runDir "git-diff-before.txt"
$appliedPatches = New-Object 'System.Collections.Generic.List[string]'

git status --short | Out-File $baselineStatus -Encoding utf8
git diff --stat | Out-File $baselineDiff -Encoding utf8

$initialPromptFile = Join-Path $runDir "task-prompt.txt"
$initialOutput = Join-Path $runDir "codex-response-00.json"
$initialLog = Join-Path $runDir "codex-00.log"
$initialPatch = Join-Path $runDir "patch-00.diff"
$qaLog = Join-Path $runDir "qa-00.log"

Write-Utf8NoBom $initialPromptFile (New-BasePrompt $Task)

Write-Section "AUTOPILOT V2 — CODEX READ-ONLY PATCH GENERATION"
$exit = Invoke-CodexReadOnly `
    -PromptFile $initialPromptFile `
    -OutputFile $initialOutput `
    -LogFile $initialLog

if ($exit -ne 0 -or -not (Test-Path $initialOutput)) {
    Write-FinalReport $finalReport "CODEX_FAILED" $Task $runDir 0 "" "Codex did not produce a structured response."
    Write-Host "AUTOPILOT_STATUS: CODEX_FAILED"
    Write-Host "REPORT: $finalReport"
    exit 1
}

$response = Get-Content -Raw $initialOutput | ConvertFrom-Json
$validation = Validate-CodexPatch $response

if ($validation.HumanGate) {
    Write-FinalReport $finalReport "HUMAN_REVIEW_REQUIRED" $Task $runDir 0 "" $validation.Reason
    Write-Host "AUTOPILOT_STATUS: HUMAN_REVIEW_REQUIRED"
    Write-Host "REPORT: $finalReport"
    exit 2
}

if ($response.status -eq "NO_CHANGES") {
    Write-FinalReport $finalReport "NO_CHANGES" $Task $runDir 0 "" $response.summary
    Write-Host "AUTOPILOT_STATUS: NO_CHANGES"
    Write-Host "REPORT: $finalReport"
    exit 0
}

Write-Utf8NoBom $initialPatch ([string]$response.patch)

Write-Section "AUTOPILOT V2 — SAFE HOST PATCH APPLY"
Apply-PatchFile $initialPatch
$appliedPatches.Add($initialPatch) | Out-Null

Write-Section "AUTOPILOT V2 — FULL DEV LOOP"
$qaExit = Invoke-DevLoop $qaLog

if ($qaExit -eq 0 -and (Test-OverallPass $qaLog)) {
    Write-FinalReport $finalReport "PASS" $Task $runDir 0 $qaLog
    Write-Host ""
    Write-Host "AUTOPILOT_STATUS: PASS"
    Write-Host "REPORT: $finalReport"
    exit 0
}

if (Test-HumanGateFailure $qaLog) {
    $rollbackOk = Rollback-Patches $appliedPatches
    Write-FinalReport $finalReport "HUMAN_REVIEW_REQUIRED" $Task $runDir 0 $qaLog "Math/geometry/provenance deterministic QA failed. Automatic changes were rolled back." $rollbackOk
    Write-Host ""
    Write-Host "AUTOPILOT_STATUS: HUMAN_REVIEW_REQUIRED"
    Write-Host "ROLLBACK_OK: $rollbackOk"
    Write-Host "REPORT: $finalReport"
    exit 2
}

$currentQaLog = $qaLog
$repairCount = 0

while ($repairCount -lt $MaxRepairAttempts) {
    $repairCount++

    $repairPrompt = Join-Path $runDir ("repair-prompt-{0:00}.txt" -f $repairCount)
    $repairOutput = Join-Path $runDir ("codex-response-{0:00}.json" -f $repairCount)
    $repairLog = Join-Path $runDir ("codex-{0:00}.log" -f $repairCount)
    $repairPatch = Join-Path $runDir ("patch-{0:00}.diff" -f $repairCount)
    $nextQaLog = Join-Path $runDir ("qa-{0:00}.log" -f $repairCount)

    $tail = (Get-Content $currentQaLog -Tail 220) -join "`n"

    $repairTask = @"
Repair the current implementation after the official Full Dev Loop failed.

This is an AUTOMATIC REPAIR attempt for CODE/INFRASTRUCTURE defects only.

If the failure concerns mathematical correctness, expected answers,
geometry relationships, source facts, provenance, zero-inference,
or deterministic verification semantics, return HUMAN_REVIEW_REQUIRED.

Do not weaken tests or safety gates.

FULL DEV LOOP FAILURE TAIL:

$tail
"@

    Write-Utf8NoBom $repairPrompt (New-BasePrompt $repairTask)

    Write-Section "AUTOPILOT V2 — REPAIR PATCH $repairCount/$MaxRepairAttempts"

    $repairExit = Invoke-CodexReadOnly `
        -PromptFile $repairPrompt `
        -OutputFile $repairOutput `
        -LogFile $repairLog

    if ($repairExit -ne 0 -or -not (Test-Path $repairOutput)) {
        break
    }

    $repairResponse = Get-Content -Raw $repairOutput | ConvertFrom-Json
    $repairValidation = Validate-CodexPatch $repairResponse

    if ($repairValidation.HumanGate) {
        $rollbackOk = Rollback-Patches $appliedPatches
        Write-FinalReport $finalReport "HUMAN_REVIEW_REQUIRED" $Task $runDir $repairCount $currentQaLog $repairValidation.Reason $rollbackOk
        Write-Host "AUTOPILOT_STATUS: HUMAN_REVIEW_REQUIRED"
        Write-Host "ROLLBACK_OK: $rollbackOk"
        Write-Host "REPORT: $finalReport"
        exit 2
    }

    if ($repairResponse.status -eq "NO_CHANGES") {
        break
    }

    Write-Utf8NoBom $repairPatch ([string]$repairResponse.patch)
    Apply-PatchFile $repairPatch
    $appliedPatches.Add($repairPatch) | Out-Null

    Write-Section "AUTOPILOT V2 — FULL DEV LOOP RETEST"
    $qaExit = Invoke-DevLoop $nextQaLog
    $currentQaLog = $nextQaLog

    if ($qaExit -eq 0 -and (Test-OverallPass $currentQaLog)) {
        Write-FinalReport $finalReport "PASS" $Task $runDir $repairCount $currentQaLog
        Write-Host ""
        Write-Host "AUTOPILOT_STATUS: PASS"
        Write-Host "REPAIR_ATTEMPTS: $repairCount"
        Write-Host "REPORT: $finalReport"
        exit 0
    }

    if (Test-HumanGateFailure $currentQaLog) {
        $rollbackOk = Rollback-Patches $appliedPatches
        Write-FinalReport $finalReport "HUMAN_REVIEW_REQUIRED" $Task $runDir $repairCount $currentQaLog "Math/geometry/provenance deterministic QA failed. Automatic changes were rolled back." $rollbackOk
        Write-Host ""
        Write-Host "AUTOPILOT_STATUS: HUMAN_REVIEW_REQUIRED"
        Write-Host "ROLLBACK_OK: $rollbackOk"
        Write-Host "REPORT: $finalReport"
        exit 2
    }
}

$rollbackOk = Rollback-Patches $appliedPatches
Write-FinalReport $finalReport "AUTO_REPAIR_EXHAUSTED" $Task $runDir $repairCount $currentQaLog "Automatic repair limit reached. Applied AutoPilot patches were rolled back." $rollbackOk

Write-Host ""
Write-Host "AUTOPILOT_STATUS: AUTO_REPAIR_EXHAUSTED"
Write-Host "ROLLBACK_OK: $rollbackOk"
Write-Host "REPORT: $finalReport"
exit 1
