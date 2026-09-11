[CmdletBinding()]
param([switch]$Launch, [string]$Block, [int]$Command=-1, [switch]$List)
$ErrorActionPreference='Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$expected='D:\MST-MATH-MODULES\MST-07-GEOGEBRA-FOLD-GOLDEN-V1'
if($repo -ne $expected){ throw "Wrong repository: $repo" }
$branch = (git -C $repo branch --show-current).Trim()
if($branch -ne 'feature/mst07-geogebra-fold-golden-v1'){ throw "Wrong branch: $branch" }
$exe='C:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe'
if(!(Test-Path $exe)){ throw "GeoGebra executable not found: $exe" }
& (Join-Path $PSScriptRoot 'validate-fold-package.ps1')
$target=Join-Path $repo 'goldens\geogebra\fold\rectangular-prism-fold-golden-v1.ggb'
if(Test-Path $target){ throw "Refusing to overwrite existing .ggb: $target" }
$commandText=Get-Content -Raw (Join-Path $PSScriptRoot 'rectangular-prism-fold-golden-v1.commands.txt')
$blocks=[regex]::Matches($commandText,'(?ms)^\[(\d{2}_[^\]]+)\]\r?\n(.*?)(?=^\[\d{2}_[^\]]+\]|\z)')
$selectedBlocks = @($blocks)
if($Block){ $selectedBlocks = @($blocks | Where-Object { $_.Groups[1].Value -eq $Block }) }
if($Block -and $selectedBlocks.Count -ne 1){ throw "Unknown block: $Block" }
if($Command -ge 0 -and $Command -lt 1){ throw 'Command index must be 1-based.' }
if($Command -ge 1 -and !$Block){ throw '-Block is required when selecting a command.' }
if($List){
  foreach($blockMatch in $selectedBlocks){
    $commands=@($blockMatch.Groups[2].Value -split '\r?\n' | Where-Object { $_ -notmatch '^\s*$' })
    Write-Host "BLOCK: $($blockMatch.Groups[1].Value)"
    for($i=0; $i -lt $commands.Count; $i++){ Write-Host "[$($i+1)/$($commands.Count)] $($commands[$i])" }
  }
} elseif($Command -ge 1){
  $blockMatch=$selectedBlocks[0]
  $commands=@($blockMatch.Groups[2].Value -split '\r?\n' | Where-Object { $_ -notmatch '^\s*$' })
  if($Command -gt $commands.Count){ throw "Command index $Command is out of range for block [$Block] (1-$($commands.Count))." }
  $selectedCommand=$commands[$Command-1]
  if($selectedCommand -match '^\s*#|Configure in Properties'){ throw "Rejected instructional content in executable block [$Block]" }
  Set-Clipboard -Value $selectedCommand
  Write-Host "READY COMMAND [$Block][$Command/$($commands.Count)]"
  Write-Host $selectedCommand
  Write-Host "BLOCK: $Block"
  Write-Host "COMMAND: $Command/$($commands.Count)"
  Write-Host 'READY: copied one command to clipboard.'
} elseif($Block){
  Write-Host "BLOCK: $Block"
  Write-Host 'Use -Command <1-based index> to copy exactly one command.'
}
Write-Host 'MANUAL GATE (exactly one native property action): btnReset -> Properties -> Scripting -> On Click:'
Write-Host 'SetValue(t,0)'
Write-Host 'SetValue(showHelpers,0)'
Write-Host 'SAVE AS: D:\MST-MATH-MODULES\MST-07-GEOGEBRA-FOLD-GOLDEN-V1\goldens\geogebra\fold\rectangular-prism-fold-golden-v1.ggb'
if($Launch){ Start-Process -FilePath $exe }
Write-Host "TARGET: $target"
Write-Host 'Safety: runner does not send keys, does not save, and does not overwrite .ggb.'
