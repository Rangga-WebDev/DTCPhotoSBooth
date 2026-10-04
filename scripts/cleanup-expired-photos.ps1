# Dry-run by default. Run only when no active visitor relies on old links.
# Preview: powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-expired-photos.ps1
# Delete:  powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-expired-photos.ps1 -Delete
param([switch]$Delete, [int]$Hours = 24)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$folder = Join-Path $root "storage\photos"
if (-not (Test-Path $folder)) { Write-Host "No photos folder."; exit 0 }
$threshold = (Get-Date).AddHours(-$Hours)
$old = @(Get-ChildItem -Path $folder -File -Filter '*.jpg' | Where-Object {
  $_.CreationTime -lt $threshold -and $_.BaseName -cmatch '^([0-9a-z]{20}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$'
})
Write-Host "$($old.Count) expired photo files (older than $Hours hours)."
$old | Select-Object Name, CreationTime, @{N='MB';E={[math]::Round($_.Length / 1MB, 2)}} | Format-Table
if ($Delete) {
  foreach ($file in $old) { Remove-Item -LiteralPath $file.FullName -Force }
  Write-Host "Deleted $($old.Count) expired files."
} else { Write-Host "DRY RUN: nothing deleted. Re-run with -Delete to remove these files." }
