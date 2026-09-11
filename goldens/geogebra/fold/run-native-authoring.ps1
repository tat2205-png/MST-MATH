[CmdletBinding()]
param([switch]$Launch, [string]$Block)
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
$selectedBlocks = $blocks
if($Block){
  $selectedBlocks = @($blocks | Where-Object { $_.Groups[1].Value -eq $Block })
  if($selectedBlocks.Count -ne 1){ throw "Unknown block: $Block" }
}
foreach($blockMatch in $selectedBlocks){
  $body=$blockMatch.Groups[2].Value.Trim()
  if($body -match '(?m)^\s*#|Configure in Properties'){ throw "Rejected instructional content in executable block [$($blockMatch.Groups[1].Value)]" }
  Set-Clipboard -Value $body
  Write-Host "READY BLOCK [$($blockMatch.Groups[1].Value)]: copied to clipboard; execute before continuing."
  if($Host.Name -notmatch 'ConsoleHost'){ break }
}
Write-Host 'MANUAL GATE (exactly one native property action): btnReset -> Properties -> Scripting -> On Click:'
Write-Host 'SetValue(t,0)'
Write-Host 'SetValue(showHelpers,0)'
Write-Host 'SAVE AS: D:\MST-MATH-MODULES\MST-07-GEOGEBRA-FOLD-GOLDEN-V1\goldens\geogebra\fold\rectangular-prism-fold-golden-v1.ggb'
if($Launch){ Start-Process -FilePath $exe }
Write-Host "TARGET: $target"
Write-Host 'Safety: runner does not send keys, does not save, and does not overwrite .ggb.'
