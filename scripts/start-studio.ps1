$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$started = New-Object System.Collections.Generic.List[System.Diagnostics.Process]

function Test-Service {
    param([int]$Port, [string]$Uri, [string]$ExpectedStatus)

    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $listener) { return $false }

    $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
    try {
        $health = Invoke-RestMethod -Uri $Uri -Method Get -TimeoutSec 5
        if ([string]$health.status -ne $ExpectedStatus) {
            throw "Unexpected health status: $($health.status)"
        }
        Write-Host "Reusing project service on port $Port (PID $($listener.OwningProcess), $($owner.Name))."
        return $true
    }
    catch {
        throw "Port $Port is owned by PID $($listener.OwningProcess) ($($owner.Name)), but it is not a healthy Math AI Video Studio service."
    }
}

function Wait-Service {
    param([string]$Uri, [string]$ExpectedStatus)

    for ($attempt = 1; $attempt -le 20; $attempt++) {
        try {
            $health = Invoke-RestMethod -Uri $Uri -Method Get -TimeoutSec 5
            if ([string]$health.status -eq $ExpectedStatus) { return }
        }
        catch {}
        Start-Sleep -Milliseconds 500
    }
    throw "Service did not become healthy at $Uri."
}

try {
    Set-Location $projectRoot
    if (-not (Test-Path -LiteralPath ".\dist\server.cjs")) {
        Write-Host "Production bundle not found; building it once..."
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw "Production build failed." }
    }

    if (-not (Test-Service -Port 8765 -Uri "http://127.0.0.1:8765/health" -ExpectedStatus "READY")) {
        $bridge = Start-Process -FilePath "python" -ArgumentList @("local_bridge/bridge.py") -WorkingDirectory $projectRoot -PassThru -WindowStyle Hidden
        $started.Add($bridge)
        Wait-Service -Uri "http://127.0.0.1:8765/health" -ExpectedStatus "READY"
    }

    if (-not (Test-Service -Port 3000 -Uri "http://127.0.0.1:3000/api/health" -ExpectedStatus "ok")) {
        $app = Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "start") -WorkingDirectory $projectRoot -PassThru -WindowStyle Hidden
        $started.Add($app)
        Wait-Service -Uri "http://127.0.0.1:3000/api/health" -ExpectedStatus "ok"
    }

    Write-Host "Math AI Video Studio is ready: http://127.0.0.1:3000"
    Write-Host "Press Ctrl+C to stop services started by this command."
    while ($true) { Start-Sleep -Seconds 1 }
}
finally {
    foreach ($process in $started) {
        if (-not $process.HasExited) { Stop-Process -Id $process.Id }
    }
}
