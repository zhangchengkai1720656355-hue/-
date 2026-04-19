param(
  [string]$ProjectName = "mengyi-yunjing",
  [string]$Area = "global",
  [string]$Env = "production",
  [switch]$SyncEnvAfterDeploy,
  [string]$PublicSiteUrl = ""
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying project $ProjectName to EdgeOne Pages..."
npx edgeone pages deploy . -n $ProjectName -e $Env -a $Area
if ($LASTEXITCODE -ne 0) {
  throw "EdgeOne deploy failed"
}

if ($SyncEnvAfterDeploy) {
  $scriptPath = Join-Path $PSScriptRoot "sync-edgeone-env.ps1"
  & $scriptPath -PublicSiteUrl $PublicSiteUrl
  if ($LASTEXITCODE -ne 0) {
    throw "EdgeOne env sync failed"
  }
}

Write-Host "EdgeOne deployment completed."
