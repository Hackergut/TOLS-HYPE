# Apply 16 Sep lobby banner pack into public/brand (promo + affiliate).
# Usage (from repo root or with -BrandRoot):
#   .\scripts\apply-lobby-banners.ps1 -SourceDir .\tols-lobby-banners
# Default BrandRoot matches owner machine layout.
param(
  [string]$SourceDir = "",
  [string]$BrandRoot = "C:\Users\HACKGUT\TOLS-HYPE\public\brand"
)

$ErrorActionPreference = "Stop"
if (-not $SourceDir) {
  $SourceDir = Join-Path $PSScriptRoot "..\..\tols-lobby-banners"
  if (-not (Test-Path $SourceDir)) { $SourceDir = Join-Path (Get-Location) "tols-lobby-banners" }
}
if (-not (Test-Path $BrandRoot)) { throw "BrandRoot not found: $BrandRoot" }
if (-not (Test-Path $SourceDir)) { throw "SourceDir not found: $SourceDir" }

# HOLD: never copy HOLD-monopoly-mascot.jpg
$map = @{
  "1-hero-hands-chips.jpg" = @(
    "promo\hero-main.jpg", "affiliate\hero-brand.jpg", "affiliate\banner-brand.jpg", "promo\welcome.jpg"
  )
  "2-rakeback-money.jpg" = @(
    "promo\rakeback.jpg", "affiliate\banner-info.jpg", "affiliate\card-info.jpg"
  )
  "3-clutch-cards-dice.jpg" = @(
    "promo\clutch.jpg", "affiliate\banner-promote.jpg", "affiliate\card-promote.jpg"
  )
  "4-cashback-aces.jpg" = @(
    "promo\cashback.jpg", "promo\level-up.jpg", "affiliate\banner-income.jpg", "affiliate\card-income.jpg"
  )
  "5-race-trophy.jpg" = @(
    "promo\race.jpg", "promo\challenges.jpg", "affiliate\banner-rank-win.jpg", "affiliate\card-rank-win.jpg"
  )
  "6-jackpot-cards.jpg" = @(
    "promo\jackpot.jpg", "promo\reload.jpg", "affiliate\banner-referrals.jpg", "affiliate\card-referrals.jpg"
  )
}

foreach ($srcName in $map.Keys) {
  $src = Join-Path $SourceDir $srcName
  if (-not (Test-Path $src)) { throw "Missing source: $src" }
  foreach ($rel in $map[$srcName]) {
    $dest = Join-Path $BrandRoot $rel
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
    Copy-Item -LiteralPath $src -Destination $dest -Force
    Write-Host "OK $srcName -> $rel"
  }
}
Write-Host "Done. HERO_SLIDES[0] = /brand/affiliate/hero-brand.jpg · OG = /brand/promo/hero-main.jpg"
Write-Host "Monopoly mascot HOLD — not copied."
