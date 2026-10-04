# DTCBOOTH — read-only preflight before opening the booth.
# Run from the project root: powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
param([int]$Port = 3000)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$failed = 0
function Report([bool]$ok, [string]$label, [string]$detail) {
  if ($ok) { Write-Host "[OK]  $label : $detail" -ForegroundColor Green }
  else { Write-Host "[!!]  $label : $detail" -ForegroundColor Yellow; $script:failed++ }
}
Write-Host "`nDTCBOOTH / PRE-FLIGHT CHECK`n" -ForegroundColor Cyan
$required = @(
  "src\app\page.js", "src\app\booth\page.js", "src\app\frame\page.js",
  "src\app\editor\page.js", "src\app\d\[id]\page.js", "src\proxy.js",
  "src\components\qr\QrTicket.jsx", "src\lib\photoServer.js", "src\lib\shareConfig.js",
  "public\models\gesture_recognizer.task", "public\mediapipe\wasm\vision_wasm_internal.wasm"
)
foreach ($path in $required) {
  $exists = Test-Path -LiteralPath (Join-Path $root $path) -PathType Leaf
  Report $exists "SOURCE" $path
}
$envFile = Join-Path $root ".env.local"
function Read-EnvValue([string]$name) {
  if (-not (Test-Path $envFile)) { return "" }
  $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$name\s*=" } | Select-Object -First 1
  if ($line) { return ($line -split '=', 2)[1].Trim().Trim('"', "'") }
  return ""
}
if (Test-Path $envFile) {
  $mode = Read-EnvValue "NEXT_PUBLIC_DOWNLOAD_MODE"
  if (-not $mode) { $mode = "local" }
  $localUrl = Read-EnvValue "NEXT_PUBLIC_LOCAL_URL"
  if (-not $localUrl) { $localUrl = Read-EnvValue "NEXT_PUBLIC_BOOTH_URL" }
  $publicUrl = Read-EnvValue "NEXT_PUBLIC_PUBLIC_URL"
  Report ($mode -in @("local", "public")) "QR MODE" $mode
  $isLan = $localUrl -match '^https?://(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^/]+(?::\d+)?/?$'
  $localRequired = $mode -eq "local"
  Report ($isLan -or -not $localRequired) "LOCAL URL" $(if ($localUrl) { $localUrl } else { "NEXT_PUBLIC_LOCAL_URL missing" + $(if ($localRequired) { "" } else { " (fallback off)" }) })
  if ($mode -eq "public") {
    Report ($publicUrl -match '^https://[^/]+/?$') "PUBLIC URL" $(if ($publicUrl) { $publicUrl } else { "NEXT_PUBLIC_PUBLIC_URL missing" })
  }
} else {
  Report $false "ENV" ".env.local not found"
}
$store = Join-Path $root "storage\photos"
if (-not (Test-Path $store)) { New-Item -ItemType Directory -Path $store -Force | Out-Null }
$files = @(Get-ChildItem -Path $store -File -Filter "*.jpg" -ErrorAction SilentlyContinue)
$totalMb = [math]::Round((($files | Measure-Object -Property Length -Sum).Sum / 1MB), 1)
Report $true "STORAGE" "$($files.Count) JPG files / $totalMb MB (nothing deleted)"
try {
  $response = Invoke-WebRequest -Uri "http://localhost:$Port/" -UseBasicParsing -Method Get -TimeoutSec 8
  Report ($response.StatusCode -eq 200) "SERVER" "http://localhost:$Port/ (HTTP $($response.StatusCode))"
  # Server yang menilai alamat QR; mode public ikut ping tunnel sungguhan.
  $share = Invoke-RestMethod -Uri "http://localhost:$Port/api/share/status" -TimeoutSec 15
  if ($share.active -eq "public") { Report $true "QR LINK" "public $($share.public.origin) (tunnel OK)" }
  elseif ($share.active -eq "local" -and $share.mode -eq "public") { Report $false "QR LINK" "tunnel unreachable, falling back to Wi-Fi $($share.local.origin)" }
  elseif ($share.active -eq "local") { Report $true "QR LINK" "Wi-Fi $($share.local.origin)" }
  else { Report $false "QR LINK" "not ready: $($share.public.error) $($share.local.error)".Trim() }
} catch {
  Report $false "SERVER" "Not responding on port $Port; start npm run start -- --hostname 0.0.0.0"
}
$ips = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
  Select-Object -ExpandProperty IPAddress)
if ($ips.Count) { Write-Host "[INFO] Candidate laptop IPv4: $($ips -join ', ')" }
else { Write-Host "[INFO] Run ipconfig to find the laptop Wi-Fi IPv4." }
Write-Host "`nRemember: scan one real QR on a PHONE (mobile data for public mode, booth Wi-Fi for local mode)." -ForegroundColor Cyan
Write-Host "This script cannot verify camera, speaker, hand gestures, or phone access." -ForegroundColor Cyan
if ($failed -gt 0) { Write-Host "`n$failed checks need attention." -ForegroundColor Yellow; exit 1 }
Write-Host "`nMachine-level checks passed. Complete the manual operator test." -ForegroundColor Green
