$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$manifestPath = Join-Path $root 'rectangular-prism-fold-golden-v1.manifest.json'
$commandsPath = Join-Path $root 'rectangular-prism-fold-golden-v1.commands.txt'
$m = Get-Content -Raw $manifestPath | ConvertFrom-Json
$c = Get-Content -Raw $commandsPath
$errors = [System.Collections.Generic.List[string]]::new()
if($m.module -ne 'MST-07'){ $errors.Add('module mismatch') }
if($m.goldenId -ne 'GOLDEN_RECTANGULAR_PRISM_FOLD'){ $errors.Add('goldenId mismatch') }
if(@($m.objects | Where-Object face).Count -ne 6){ $errors.Add('expected 6 faces') }
if(@($m.objects | Where-Object hinge).Count -ne 5){ $errors.Add('expected 5 hinges') }
if(($c -split "`n" | Where-Object { $_ -match '^t=0$' }).Count -ne 1){ $errors.Add('single t clock missing') }
foreach($name in 'theta1','theta2','theta3','theta4','theta5'){ if($c -notmatch "(?m)^$name="){ $errors.Add("missing $name") } }
if($c -notmatch '(?m)^H15=Line\(A1t,B1t\)'){ $errors.Add('H15 moving frame missing') }
if($c -notmatch '(?m)^F5=Rotate\(F5local,theta5,H15\)'){ $errors.Add('F5 parent-dependent transform missing') }
if($c -match '(?im)^\s*SetVisible\s*\('){ $errors.Add('forbidden SetVisible in GeoGebraScript') }
if($c -match '(?im)^\s*(GetValue|ggbApplet|evalCommand|document\.|window\.)'){ $errors.Add('JavaScript API in GeoGebraScript') }
$buttonIds = @([regex]::Matches($c,'(?m)^\s*(\w+)\s*=\s*Button\(') | ForEach-Object { $_.Groups[1].Value })
foreach($hit in [regex]::Matches($c,'(?im)^\s*SetValue\s*\(\s*([^,]+),')) { if($buttonIds -contains $hit.Groups[1].Value.Trim()){ $errors.Add("SetValue targets button: $($hit.Groups[1].Value.Trim())") }; if($hit.Groups[1].Value.Trim() -in @('stage','showHinges','showLabels')){ $errors.Add("SetValue targets dependent object: $($hit.Groups[1].Value.Trim())") } }
if($c -notmatch '(?m)^showHelpers=Checkbox\("Show helpers"\)$' -or $c -notmatch '(?m)^stage='){ $errors.Add('checkbox/dependent reveal state missing') }
if($c -match '(?m)^\[09_[^\]]+\]\r?\n(?:\s*#|\s*$)'){ $errors.Add('visibility block has no executable commands') }
if($c -match '(?im)^\[09_[^\]]+\][\s\S]*?Configure in Properties'){ $errors.Add('instructional property action inside executable block') }
if($m.controls.resetId -ne 'btnReset' -or $m.controls.resetCaption -ne 'Reset'){ $errors.Add('stable reset identity/caption missing') }
if(@($m.controls.resetOnClick) -join ';' -ne 'SetValue(t,0);SetValue(showHelpers,0)'){ $errors.Add('reset state contract missing') }
if($c -match '(?m)^\s*btnReveal\s*='){ $errors.Add('one-way reveal button remains') }
foreach($pair in $m.controls.visibilityConditions.psobject.Properties){ if(!$pair.Value){ $errors.Add("staged object has no visibility condition: $($pair.Name)") } }
foreach($pair in $m.controls.visibilityConditions.psobject.Properties){ $escaped=[regex]::Escape($pair.Value); if($c -notmatch "(?m)^SetConditionToShowObject\($($pair.Name),$escaped\)$"){ $errors.Add("visibility command missing: $($pair.Name)") } }
if($errors.Count){ $errors | ForEach-Object { Write-Error $_ }; exit 1 }
Write-Output 'PASS_STATIC_SYNTAX_POLICY: manifest JSON, stateful reset, visibility mappings, 6 faces, 5 hinges, dependencies.'
