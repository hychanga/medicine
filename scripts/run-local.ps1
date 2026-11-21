# Run the Spring Boot backend locally against the production TiDB database.
# Secrets are read from Google Secret Manager (same ones Cloud Run uses).
#
# Usage (from the repo root, in PowerShell):
#     powershell -ExecutionPolicy Bypass -File scripts\run-local.ps1
#
# Prerequisites: Java 21 (Maven is fetched by the wrapper), gcloud logged in
#   (gcloud auth login + gcloud auth application-default login)
#   and the default project set (gcloud config set project <PROJECT_ID>).

$ErrorActionPreference = "Stop"

function Get-Secret([string]$name) {
    $value = (& gcloud secrets versions access latest --secret=$name 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($value)) {
        throw "Cannot read secret '$name'. Check 'gcloud auth login' and 'gcloud config set project <PROJECT_ID>'."
    }
    return $value
}

Write-Host "Reading secrets from Secret Manager..."
$env:SPRING_PROFILES_ACTIVE     = "prod"
$env:SPRING_DATASOURCE_URL      = Get-Secret "tidb-url"
$env:SPRING_DATASOURCE_USERNAME = Get-Secret "tidb-username"
$env:SPRING_DATASOURCE_PASSWORD = Get-Secret "tidb-password"
$env:GEMINI_API_KEY             = Get-Secret "gemini-api-key"

# Leave AUTH_SHARED_SECRET unset so the backend and the local Next.js BFF
# both use the same built-in dev default.
Remove-Item Env:AUTH_SHARED_SECRET -ErrorAction SilentlyContinue

Write-Host "Starting backend on http://localhost:8080 (Ctrl+C to stop)..."
Set-Location (Join-Path $PSScriptRoot "..\backend")
.\mvnw.cmd spring-boot:run
