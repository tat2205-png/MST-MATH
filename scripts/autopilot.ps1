param(
    [string]$Task = "",
    [string]$ContractFile = "",
    [switch]$Bootstrap,
    [ValidateRange(1,3)]
    [int]$MaxRepairAttempts = 3
)

$ErrorActionPreference = "Stop"

$PythonExe = $null
$PythonPrefix = @()

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCmd) {
    $PythonExe = $pythonCmd.Source
}
else {
    $pyCmd = Get-Command py -ErrorAction SilentlyContinue
    if ($pyCmd) {
        $PythonExe = $pyCmd.Source
        $PythonPrefix = @("-3")
    }
}

if (-not $PythonExe) {
    throw "Python was not found. Install/repair Python before running AutoPilot V4."
}

$Orchestrator = Join-Path $PSScriptRoot "autopilot_v4.py"
if (-not (Test-Path -LiteralPath $Orchestrator)) {
    throw "Missing scripts\autopilot_v4.py"
}

$argsList = @()
$argsList += $PythonPrefix
$argsList += @($Orchestrator)

if ($Bootstrap) {
    $argsList += "--bootstrap"
}

if (-not [string]::IsNullOrWhiteSpace($Task)) {
    $argsList += @("--task", $Task)
}

if (-not [string]::IsNullOrWhiteSpace($ContractFile)) {
    $argsList += @("--contract-file", $ContractFile)
}

$argsList += @("--max-repair-attempts", [string]$MaxRepairAttempts)

& $PythonExe @argsList
exit $LASTEXITCODE
