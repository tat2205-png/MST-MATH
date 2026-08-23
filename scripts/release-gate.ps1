$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Invoke-ReleaseStep {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "=== $Name ==="
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
    Write-Host "$Name=PASS"
}

Invoke-ReleaseStep "SOURCE_QA_FULL" { npm run qa:full }
Invoke-ReleaseStep "REAL_GOLDEN_PATH_RUNTIME" { node --import tsx scripts/run-golden-runtime.ts }

Write-Host ""
Write-Host "RELEASE_GATE=PASS"
