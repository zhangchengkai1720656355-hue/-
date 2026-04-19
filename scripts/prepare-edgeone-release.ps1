param(
  [string]$OutputDir = ".edgeone-release"
)

$ErrorActionPreference = "Stop"

$sourceRoot = (Get-Location).Path
$targetRoot = Join-Path $sourceRoot $OutputDir

if (Test-Path -LiteralPath $targetRoot) {
  Remove-Item -LiteralPath $targetRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $targetRoot | Out-Null

$copyItems = @(
  "about.html",
  "about.js",
  "admin.html",
  "admin.js",
  "api",
  "app.js",
  "archive.html",
  "archive.js",
  "assets",
  "atlas.html",
  "atlas.js",
  "auth-guard.js",
  "auth.js",
  "classics.html",
  "classics.js",
  "cloud-functions",
  "data.js",
  "detail.html",
  "detail.js",
  "edgeone.json",
  "guard-index.png",
  "home-mengyi.png",
  "index.html",
  "login-mengyi.png",
  "login-page-2.png",
  "login-page-password.png",
  "login-page-qq.png",
  "login-page.png",
  "login.html",
  "login.js",
  "package-lock.json",
  "package.json",
  "profile.html",
  "profile.js",
  "styles.css"
)

foreach ($item in $copyItems) {
  $sourcePath = Join-Path $sourceRoot $item
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Missing required release item: $item"
  }

  $targetPath = Join-Path $targetRoot $item
  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Recurse -Force
}

Write-Host "Prepared EdgeOne release directory: $targetRoot"
