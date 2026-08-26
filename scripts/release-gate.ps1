$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$bridgeHealthUri = "http://127.0.0.1:8765/health"

try {
    $bridgeHealth = Invoke-RestMethod -Uri $bridgeHealthUri -Method Get -TimeoutSec 10
    if ([string]$bridgeHealth.status -ne "READY") {
        throw "unexpected health status '$($bridgeHealth.status)'"
    }
    Write-Host "LOCAL_RENDER_BRIDGE_PREREQUISITE=PASS | $bridgeHealthUri"
}
catch {
    throw "LOCAL_RENDER_BRIDGE_PREREQUISITE=FAIL | Start the repository bridge with 'npm run bridge:start' before running the release gate. $($_.Exception.Message)"
}

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
