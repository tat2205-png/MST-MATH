param(
    [switch]$SkipInstall,
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Results = New-Object System.Collections.Generic.List[object]

function Add-Result {
    param(
        [string]$Check,
        [string]$Status,
        [string]$Detail = ""
    )
    $Results.Add([pscustomobject]@{
        CHECK  = $Check
        STATUS = $Status
        DETAIL = $Detail
    }) | Out-Null
}

function Invoke-Step {
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

Write-Host ""
Write-Host "=== MATH AI VIDEO STUDIO | PHASE 0-1 BASELINE ==="
Write-Host "Working directory: $(Get-Location)"
Write-Host ""

# 0. Root validation
if (-not (Test-Path ".\package.json")) {
    Add-Result "PROJECT_ROOT" "FAIL" "Không tìm thấy package.json. Hãy chạy script tại thư mục gốc dự án."
    $Results | Format-Table -AutoSize
    exit 1
}
Add-Result "PROJECT_ROOT" "PASS" (Resolve-Path ".").Path

# 1. Git baseline (read-only)
if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
        $gitRoot = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            Add-Result "GIT_REPOSITORY" "PASS" $gitRoot
            Write-Host "`n--- git status --short ---"
            git status --short
        } else {
            Add-Result "GIT_REPOSITORY" "WARN" "Thư mục chưa được git init."
        }
    } catch {
        Add-Result "GIT_REPOSITORY" "WARN" "Không đọc được trạng thái Git."
    }
} else {
    Add-Result "GIT_COMMAND" "FAIL" "Không tìm thấy git."
}

# 2. Security/config checks
if (Test-Path ".\.env") {
    Add-Result "ENV_FILE" "PASS" ".env tồn tại cục bộ. Không in nội dung."
} else {
    Add-Result "ENV_FILE" "WARN" "Không có .env."
}

if (Test-Path ".\.gitignore") {
    $ignore = Get-Content ".\.gitignore" -Raw
    if ($ignore -match '(?m)^\.env\*?\s*$' -or $ignore -match '(?m)^\.env\s*$') {
        Add-Result "ENV_GITIGNORE" "PASS" ".env được ignore."
    } else {
        Add-Result "ENV_GITIGNORE" "FAIL" ".gitignore chưa loại .env."
    }
} else {
    Add-Result "ENV_GITIGNORE" "FAIL" "Không có .gitignore."
}

# 3. Package manager lock
$hasNpmLock = Test-Path ".\package-lock.json"
$hasBunLock = (Test-Path ".\bun.lock") -or (Test-Path ".\bun.lockb")
$hasYarnLock = Test-Path ".\yarn.lock"
$hasPnpmLock = Test-Path ".\pnpm-lock.yaml"

if ($hasNpmLock -and -not $hasBunLock -and -not $hasYarnLock -and -not $hasPnpmLock) {
    Add-Result "PACKAGE_MANAGER" "PASS" "npm + package-lock.json"
} elseif ($hasNpmLock) {
    $others = @()
    if ($hasBunLock) { $others += "bun" }
    if ($hasYarnLock) { $others += "yarn" }
    if ($hasPnpmLock) { $others += "pnpm" }
    Add-Result "PACKAGE_MANAGER" "FAIL" ("Đã chọn npm nhưng còn lockfile cạnh tranh: " + ($others -join ", "))
} else {
    Add-Result "PACKAGE_MANAGER" "FAIL" "Không tìm thấy package-lock.json."
}

# 4. Toolchain
foreach ($cmd in @("node", "npm")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $ver = & $cmd --version
        Add-Result ($cmd.ToUpper() + "_COMMAND") "PASS" $ver
    } else {
        Add-Result ($cmd.ToUpper() + "_COMMAND") "FAIL" "Không tìm thấy $cmd."
    }
}

# 5. Detect known source defects without modifying files
if (Test-Path ".\package.json") {
    $packageText = Get-Content ".\package.json" -Raw
    if ($packageText -match '"clean"\s*:\s*"rm\s+-rf') {
        Add-Result "WINDOWS_CLEAN_SCRIPT" "FAIL" "package.json còn dùng rm -rf."
    } else {
        Add-Result "WINDOWS_CLEAN_SCRIPT" "PASS"
    }
}

if (Test-Path ".\server.ts") {
    $serverText = Get-Content ".\server.ts" -Raw

    $routeCount = ([regex]::Matches(
        $serverText,
        'app\.post\("/api/cinematic/master-canvas"'
    )).Count

    if ($routeCount -eq 1) {
        Add-Result "MASTER_CANVAS_ROUTE" "PASS" "1 declaration"
    } else {
        Add-Result "MASTER_CANVAS_ROUTE" "FAIL" "$routeCount declarations"
    }

    if ($serverText -match 'health\.ok\s*\?\s*"ACTIVE"\s*:\s*"ACTIVE"') {
        Add-Result "OPENCLAW_HEALTH_STATUS" "FAIL" 'Nhánh false vẫn trả ACTIVE.'
    } else {
        Add-Result "OPENCLAW_HEALTH_STATUS" "PASS"
    }
} else {
    Add-Result "SERVER_TS" "FAIL" "Không tìm thấy server.ts."
}

# 6. Install dependencies only when needed
if (-not $SkipInstall) {
    if (-not (Test-Path ".\node_modules")) {
        Invoke-Step "NPM_CI" {
            npm ci
            if ($LASTEXITCODE -ne 0) { throw "npm ci exit code $LASTEXITCODE" }
        } | Out-Null
    } else {
        Add-Result "NPM_CI" "PASS" "node_modules đã tồn tại; không cài lại."
    }
} else {
    Add-Result "NPM_CI" "WARN" "Đã bỏ qua theo -SkipInstall."
}

# 7. Static QA
$lintPass = Invoke-Step "TYPESCRIPT_QA" {
    npm run lint
    if ($LASTEXITCODE -ne 0) { throw "npm run lint exit code $LASTEXITCODE" }
}

$buildPass = Invoke-Step "BUILD_QA" {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build exit code $LASTEXITCODE" }
}

# 8. Server/health QA
$existingListener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
$startedProcess = $null

try {
    if ($existingListener) {
        Add-Result "PORT_CHECK" "PASS" "Port $Port đã có listener; sẽ kiểm tra health, không khởi động server thứ hai."
    } else {
        Add-Result "PORT_CHECK" "PASS" "Port $Port đang trống."
        if ($lintPass -and $buildPass) {
            $stdout = Join-Path $env:TEMP "math-ai-phase01-server.out.log"
            $stderr = Join-Path $env:TEMP "math-ai-phase01-server.err.log"
            $startedProcess = Start-Process `
                -FilePath "npm.cmd" `
                -ArgumentList @("run", "start") `
                -WorkingDirectory (Get-Location).Path `
                -RedirectStandardOutput $stdout `
                -RedirectStandardError $stderr `
                -PassThru `
                -WindowStyle Hidden

            Start-Sleep -Seconds 3
        }
    }

    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -Method Get -TimeoutSec 8
        if ($health.status -eq "ok") {
            Add-Result "SERVER_QA" "PASS" "GET /api/health => ok"
        } else {
            Add-Result "SERVER_QA" "FAIL" "Health endpoint không trả status=ok."
        }
    } catch {
        Add-Result "SERVER_QA" "FAIL" $_.Exception.Message
    }
}
finally {
    if ($startedProcess -and -not $startedProcess.HasExited) {
        Stop-Process -Id $startedProcess.Id -Force
        Add-Result "TEST_SERVER_CLEANUP" "PASS" "Chỉ dừng process do script tự khởi động: PID $($startedProcess.Id)"
    }
}

# 9. Final report
Write-Host ""
Write-Host "=== PHASE 0-1 REPORT ==="
$Results | Format-Table -AutoSize -Wrap

$failCount = @($Results | Where-Object { $_.STATUS -eq "FAIL" }).Count
$warnCount = @($Results | Where-Object { $_.STATUS -eq "WARN" }).Count

Write-Host ""
Write-Host "FAIL: $failCount | WARN: $warnCount"

if ($failCount -eq 0) {
    Write-Host "OVERALL_STATUS: PASS"
    exit 0
} else {
    Write-Host "OVERALL_STATUS: FAIL"
    exit 1
}
