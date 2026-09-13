param(
  [Parameter(Mandatory = $true)][string]$PdfName,
  [int]$BatchSize = 5,
  [string]$GoldenRoot = "D:\MST-MATH-INPUT-GOLDENS",
  [string]$VisionPython = "D:\MST-MATH-LOCAL-RUNTIME\successor-paddle-322\.venv\Scripts\python.exe",
  [string]$PaddlePackages = "D:\MST-MATH-LOCAL-RUNTIME\successor-paddle-322\.venv\Lib\site-packages"
)

$ErrorActionPreference = "Stop"
if ($BatchSize -lt 1) { throw "BATCH_SIZE_INVALID" }
$pdf = Join-Path $GoldenRoot $PdfName
if (!(Test-Path -LiteralPath $pdf)) { throw "PDF_MISSING:$pdf" }
$info = (& pdfinfo $pdf 2>&1 | Out-String)
$match = [regex]::Match($info, 'Pages:\s+(\d+)')
if (!$match.Success) { throw "PDF_PAGE_COUNT_UNAVAILABLE:$PdfName" }
$totalPages = [int]$match.Groups[1].Value

$env:MST_MATH_INPUT_GOLDEN_ROOT = $GoldenRoot
$env:MST_MATH_INPUT_VISION_PYTHON = $VisionPython
$env:MST_MATH_INPUT_PADDLE_PACKAGES = $PaddlePackages
$env:MST_MATH_INPUT_PDF_ONLY = "1"
$env:MST_MATH_INPUT_PDF_NAME = $PdfName

for ($start = 1; $start -le $totalPages; $start += $BatchSize) {
  $end = [Math]::Min($totalPages, $start + $BatchSize - 1)
  $env:MST_MATH_INPUT_PDF_START = "$start"
  $env:MST_MATH_INPUT_PDF_END = "$end"
  Write-Host "BATCH_START pdf=$PdfName pages=$start-$end/$totalPages"
  & npm run qa:input-v1
  if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) { throw "BATCH_RUNTIME_FAILED:${PdfName}:${start}-${end}" }
}

Remove-Item Env:MST_MATH_INPUT_PDF_START -ErrorAction SilentlyContinue
Remove-Item Env:MST_MATH_INPUT_PDF_END -ErrorAction SilentlyContinue
Write-Host "AGGREGATE_START pdf=$PdfName pages=1-$totalPages"
& npm run qa:input-v1
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
