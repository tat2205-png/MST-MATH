param(
    [ValidateSet("Quick","Full","RepairSmoke")]
    [string]$Mode = "Full",

    [int]$Port = 3000,

    [switch]$KeepServer,

    [switch]$SkipPostRepairBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = (Get-Location).Path
$Results = New-Object System.Collections.Generic.List[object]
$StartedServer = $null

function Add-Result {
    param(
        [string]$Check,
        [ValidateSet("PASS","FAIL","WARN","BLOCKED","NOT_TESTED")]
        [string]$Status,
        [string]$Detail = ""
    )

    $Results.Add([pscustomobject]@{
        CHECK  = $Check
        STATUS = $Status
        DETAIL = $Detail
    }) | Out-Null
}

function Invoke-Checked {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    try {
        & $Action
        Add-Result $Name "PASS"
        return $true
    }
    catch {
        Add-Result $Name "FAIL" $_.Exception.Message
        return $false
    }
}

function Test-HttpJson {
    param(
        [string]$Uri,
        [int]$TimeoutSec = 10
    )

    return Invoke-RestMethod -Uri $Uri -Method Get -TimeoutSec $TimeoutSec
}

function Wait-ForHealth {
    param(
        [string]$Uri,
        [int]$Attempts = 12,
        [int]$DelaySeconds = 1
    )

    for ($i = 1; $i -le $Attempts; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $Uri -Method Get -TimeoutSec 5
            if ($response.status -eq "ok") {
                return $response
            }
        }
        catch {
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    throw "Server did not become healthy at $Uri"
}

function Get-PortOwner {
    param([int]$LocalPort)

    $conn = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if (-not $conn) {
        return $null
    }

    $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($conn.OwningProcess)" -ErrorAction SilentlyContinue

    return [pscustomobject]@{
        PID         = $conn.OwningProcess
        Name        = if ($proc) { $proc.Name } else { "" }
        CommandLine = if ($proc) { $proc.CommandLine } else { "" }
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host " MATH AI VIDEO STUDIO — AUTONOMOUS DEV LOOP V1"
Write-Host " Mode: $Mode"
Write-Host " Root: $ProjectRoot"
Write-Host "============================================================"
Write-Host ""

# ------------------------------------------------------------
# GATE 0 — Project root
# ------------------------------------------------------------
if (-not (Test-Path ".\package.json")) {
    Add-Result "PROJECT_ROOT" "FAIL" "package.json not found. Run from project root."
    $Results | Format-Table -AutoSize -Wrap
    exit 1
}
Add-Result "PROJECT_ROOT" "PASS" $ProjectRoot

# ------------------------------------------------------------
# GATE 1 — Git baseline (READ ONLY)
# ------------------------------------------------------------
if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
        $gitRoot = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            Add-Result "GIT_BASELINE" "PASS" $gitRoot

            Write-Host "`n--- git status --short ---"
            git status --short

            Write-Host "`n--- git diff --stat ---"
            git diff --stat
        }
        else {
            Add-Result "GIT_BASELINE" "WARN" "Current folder is not a Git repository."
        }
    }
    catch {
        Add-Result "GIT_BASELINE" "WARN" $_.Exception.Message
    }
}
else {
    Add-Result "GIT_BASELINE" "WARN" "git command not found."
}

# ------------------------------------------------------------
# GATE 2 — Package manager
# ------------------------------------------------------------
$hasNpmLock  = Test-Path ".\package-lock.json"
$hasBunLock  = (Test-Path ".\bun.lock") -or (Test-Path ".\bun.lockb")
$hasPnpmLock = Test-Path ".\pnpm-lock.yaml"
$hasYarnLock = Test-Path ".\yarn.lock"

if ($hasNpmLock -and -not $hasBunLock -and -not $hasPnpmLock -and -not $hasYarnLock) {
    Add-Result "PACKAGE_MANAGER_QA" "PASS" "npm + package-lock.json"
}
elseif ($hasNpmLock) {
    $conflicts = @()
    if ($hasBunLock)  { $conflicts += "bun" }
    if ($hasPnpmLock) { $conflicts += "pnpm" }
    if ($hasYarnLock) { $conflicts += "yarn" }

    Add-Result "PACKAGE_MANAGER_QA" "FAIL" ("Competing root lockfiles: " + ($conflicts -join ", "))
}
else {
    Add-Result "PACKAGE_MANAGER_QA" "FAIL" "package-lock.json not found."
}

# ------------------------------------------------------------
# GATE 3 — Static QA
# ------------------------------------------------------------
$lintPass = Invoke-Checked "TYPESCRIPT_QA" {
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        throw "npm run lint exited with code $LASTEXITCODE"
    }
}

if (-not $lintPass) {
    Add-Result "BUILD_QA" "BLOCKED" "TypeScript QA failed."
}
else {
    $buildPass = Invoke-Checked "BUILD_QA" {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build exited with code $LASTEXITCODE"
        }
    }
}

$mathPass = $false
$regressionPass = $false
if ($lintPass -and $buildPass) {
    $mathPass = Invoke-Checked "MATH_REGRESSION_QA" {
        npm run qa:math
        if ($LASTEXITCODE -ne 0) {
            throw "npm run qa:math exited with code $LASTEXITCODE"
        }
    }

    if ($mathPass) {
        $regressionPass = Invoke-Checked "TEST_REGRESSION_QA" {
            npm run qa:regression
            if ($LASTEXITCODE -ne 0) {
                throw "npm run qa:regression exited with code $LASTEXITCODE"
            }
        }
    }
    else {
        Add-Result "TEST_REGRESSION_QA" "BLOCKED" "Math regression QA failed."
    }
}
else {
    Add-Result "MATH_REGRESSION_QA" "BLOCKED" "TypeScript or build QA failed."
    Add-Result "TEST_REGRESSION_QA" "BLOCKED" "TypeScript or build QA failed."
}

if (-not $lintPass -or -not $buildPass -or -not $mathPass -or -not $regressionPass) {
    Add-Result "SERVER_QA" "BLOCKED" "Static or regression QA failed."
    Add-Result "OPENCLAW_HEALTH_QA" "BLOCKED" "Static or regression QA failed."
    Add-Result "REPAIR_SMOKE_TEST" "BLOCKED" "Static or regression QA failed."
}
else {
    # ------------------------------------------------------------
    # GATE 4 — Server
    # ------------------------------------------------------------
    $owner = Get-PortOwner -LocalPort $Port

    if ($owner) {
        Write-Host "`n--- port $Port owner ---"
        $owner | Format-List
        Add-Result "PORT_QA" "PASS" "Existing listener reused. PID=$($owner.PID)"
    }
    else {
        Add-Result "PORT_QA" "PASS" "Port $Port free; starting built server."

        $stdout = Join-Path $env:TEMP "math-ai-dev-loop-server.out.log"
        $stderr = Join-Path $env:TEMP "math-ai-dev-loop-server.err.log"

        $StartedServer = Start-Process `
            -FilePath "npm.cmd" `
            -ArgumentList @("run", "start") `
            -WorkingDirectory $ProjectRoot `
            -RedirectStandardOutput $stdout `
            -RedirectStandardError $stderr `
            -PassThru `
            -WindowStyle Hidden
    }

    try {
        $health = Wait-ForHealth -Uri "http://127.0.0.1:$Port/api/health"
        Add-Result "SERVER_QA" "PASS" ("status=" + $health.status)
    }
    catch {
        Add-Result "SERVER_QA" "FAIL" $_.Exception.Message
    }

    $serverPass = @($Results | Where-Object { $_.CHECK -eq "SERVER_QA" -and $_.STATUS -eq "PASS" }).Count -gt 0

    # ------------------------------------------------------------
    # QUICK mode ends after server health
    # ------------------------------------------------------------
    if ($Mode -eq "Quick") {
        Add-Result "OPENCLAW_HEALTH_QA" "NOT_TESTED" "Quick mode"
        Add-Result "REPAIR_SMOKE_TEST" "NOT_TESTED" "Quick mode"
    }
    elseif ($serverPass) {
        # ------------------------------------------------------------
        # GATE 5 — OpenClaw
        # ------------------------------------------------------------
        try {
            $openclaw = Test-HttpJson -Uri "http://127.0.0.1:$Port/api/openclaw/status"

            if ($openclaw.status -eq "ACTIVE" -and $openclaw.health.ok -eq $true) {
                $detail = "ACTIVE"
                if ($openclaw.health.version) {
                    $detail += " | " + [string]$openclaw.health.version
                }
                Add-Result "OPENCLAW_HEALTH_QA" "PASS" $detail
            }
            else {
                $detail = "status=" + [string]$openclaw.status
                if ($openclaw.health.error) {
                    $detail += " | " + [string]$openclaw.health.error
                }
                Add-Result "OPENCLAW_HEALTH_QA" "FAIL" $detail
            }
        }
        catch {
            Add-Result "OPENCLAW_HEALTH_QA" "FAIL" $_.Exception.Message
        }

        $openclawPass = @($Results | Where-Object { $_.CHECK -eq "OPENCLAW_HEALTH_QA" -and $_.STATUS -eq "PASS" }).Count -gt 0

        # ------------------------------------------------------------
        # GATE 6 — Repair smoke test
        # ------------------------------------------------------------
        if ($Mode -in @("Full","RepairSmoke") -and $openclawPass) {
            try {
                $body = @{} | ConvertTo-Json
                $smoke = Invoke-RestMethod `
                    -Uri "http://127.0.0.1:$Port/api/video/repair-smoke-test" `
                    -Method Post `
                    -ContentType "application/json" `
                    -Body $body `
                    -TimeoutSec 180

                $finalStatus = [string]$smoke.report.finalStatus
                $protectedQa = [string]$smoke.report.qaSummary.protectedDataMutationQa
                $realPatchQa = [string]$smoke.report.qaSummary.realOpenclawPatchQa
                $frameQa = [string]$smoke.report.qaSummary.postRepairFrameQa
                $mathQa = [string]$smoke.report.qaSummary.mathRegressionQa
                $geometryQa = [string]$smoke.report.qaSummary.geometryLockQa

                $successStatuses = @("PASS","AUTO_REPAIR_SUCCESS","SUCCESS","REPAIRED")

                if (
                    $successStatuses -contains $finalStatus -and
                    $protectedQa -eq "PASS" -and
                    $realPatchQa -eq "PASS" -and
                    $frameQa -eq "PASS" -and
                    $mathQa -eq "PASS" -and
                    $geometryQa -eq "PASS"
                ) {
                    Add-Result "REPAIR_SMOKE_TEST" "PASS" (
                        "finalStatus=$finalStatus | attempts=$($smoke.report.totalAttempts)"
                    )
                }
                else {
                    Add-Result "REPAIR_SMOKE_TEST" "FAIL" (
                        "finalStatus=$finalStatus | attempts=$($smoke.report.totalAttempts) | protected=$protectedQa | patch=$realPatchQa | frame=$frameQa | math=$mathQa | geometry=$geometryQa"
                    )
                }
            }
            catch {
                Add-Result "REPAIR_SMOKE_TEST" "FAIL" $_.Exception.Message
            }
        }
        else {
            Add-Result "REPAIR_SMOKE_TEST" "BLOCKED" "OpenClaw health is not PASS."
        }
    }
    else {
        Add-Result "OPENCLAW_HEALTH_QA" "BLOCKED" "Server QA failed."
        Add-Result "REPAIR_SMOKE_TEST" "BLOCKED" "Server QA failed."
    }
}

# ------------------------------------------------------------
# GATE 7 — Post-repair regression
# ------------------------------------------------------------
$smokePass = @($Results | Where-Object { $_.CHECK -eq "REPAIR_SMOKE_TEST" -and $_.STATUS -eq "PASS" }).Count -gt 0

if ($smokePass -and -not $SkipPostRepairBuild) {
    Invoke-Checked "POST_REPAIR_TYPESCRIPT_QA" {
        npm run lint
        if ($LASTEXITCODE -ne 0) {
            throw "npm run lint exited with code $LASTEXITCODE"
        }
    } | Out-Null

    Invoke-Checked "POST_REPAIR_BUILD_QA" {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build exited with code $LASTEXITCODE"
        }
    } | Out-Null
}
elseif ($Mode -eq "Quick") {
    Add-Result "POST_REPAIR_TYPESCRIPT_QA" "NOT_TESTED" "Quick mode"
    Add-Result "POST_REPAIR_BUILD_QA" "NOT_TESTED" "Quick mode"
}
elseif (-not $smokePass) {
    Add-Result "POST_REPAIR_TYPESCRIPT_QA" "BLOCKED" "Repair smoke test did not PASS."
    Add-Result "POST_REPAIR_BUILD_QA" "BLOCKED" "Repair smoke test did not PASS."
}

# ------------------------------------------------------------
# Final Git inspection (READ ONLY)
# ------------------------------------------------------------
if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
        Write-Host "`n--- final git status --short ---"
        git status --short

        Write-Host "`n--- final git diff --stat ---"
        git diff --stat

        Add-Result "FINAL_GIT_INSPECTION" "PASS" "Read-only inspection completed."
    }
    catch {
        Add-Result "FINAL_GIT_INSPECTION" "WARN" $_.Exception.Message
    }
}

# ------------------------------------------------------------
# Stop only the server that THIS script started
# ------------------------------------------------------------
if ($StartedServer -and -not $KeepServer) {
    try {
        if (-not $StartedServer.HasExited) {
            Stop-Process -Id $StartedServer.Id -Force
            Add-Result "SERVER_CLEANUP" "PASS" "Stopped only script-started PID $($StartedServer.Id)"
        }
    }
    catch {
        Add-Result "SERVER_CLEANUP" "WARN" $_.Exception.Message
    }
}
elseif ($StartedServer -and $KeepServer) {
    Add-Result "SERVER_CLEANUP" "PASS" "Server left running by -KeepServer. PID=$($StartedServer.Id)"
}

# ------------------------------------------------------------
# Report
# ------------------------------------------------------------
Write-Host ""
Write-Host "============================================================"
Write-Host " DEV LOOP REPORT"
Write-Host "============================================================"

$Results | Format-Table -AutoSize -Wrap

$failCount    = @($Results | Where-Object { $_.STATUS -eq "FAIL" }).Count
$blockedCount = @($Results | Where-Object { $_.STATUS -eq "BLOCKED" }).Count

Write-Host ""
Write-Host "FAIL=$failCount | BLOCKED=$blockedCount"

if ($failCount -eq 0 -and $blockedCount -eq 0) {
    Write-Host "OVERALL_STATUS: PASS"
    exit 0
}
else {
    Write-Host "OVERALL_STATUS: FAIL"
    exit 1
}
