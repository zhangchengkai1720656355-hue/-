param(
  [string]$EnvFile = ".env.vercel.production",
  [string]$PublicSiteUrl = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

$allowedKeys = @(
  "AUTH_TOKEN_SECRET",
  "EMAIL_CODE_LENGTH",
  "EMAIL_CODE_TTL_SECONDS",
  "EMAIL_FROM_ADDRESS",
  "EMAIL_FROM_NAME",
  "EMAIL_HOST",
  "EMAIL_PASS",
  "EMAIL_PORT",
  "EMAIL_SECURE",
  "EMAIL_USER",
  "QQ_APP_ID",
  "QQ_APP_KEY",
  "QQ_REDIRECT_URI",
  "QQ_SCOPE",
  "QQ_STATE_TTL_SECONDS",
  "PUBLIC_SITE_URL"
)

$envMap = @{}

Get-Content -LiteralPath $EnvFile | ForEach-Object {
  $line = [string]$_
  if ([string]::IsNullOrWhiteSpace($line)) {
    return
  }

  $trimmed = $line.Trim()
  if ($trimmed.StartsWith("#")) {
    return
  }

  if ($trimmed -notmatch '^([A-Z0-9_]+)=(.*)$') {
    return
  }

  $key = $matches[1]
  $rawValue = $matches[2].Trim()

  if ($rawValue.Length -ge 2 -and $rawValue.StartsWith('"') -and $rawValue.EndsWith('"')) {
    $rawValue = $rawValue.Substring(1, $rawValue.Length - 2)
  }

  $envMap[$key] = $rawValue.Trim()
}

if ($PublicSiteUrl) {
  $envMap["PUBLIC_SITE_URL"] = $PublicSiteUrl.Trim()
}

foreach ($key in $allowedKeys) {
  if (-not $envMap.ContainsKey($key)) {
    continue
  }

  $value = [string]$envMap[$key]
  if ([string]::IsNullOrWhiteSpace($value)) {
    continue
  }

  Write-Host "Syncing $key"
  npx edgeone pages env set $key $value
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to sync $key"
  }
}

Write-Host "EdgeOne environment sync completed."
