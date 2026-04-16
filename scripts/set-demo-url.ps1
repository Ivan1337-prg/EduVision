param(
    [Parameter(Mandatory = $true)]
    [string]$BackendUrl
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$rootEnvPath = Join-Path $repoRoot '.env'
$teacherEnvPath = Join-Path $repoRoot 'teacher-webapp\.env.local'

if (-not (Test-Path $rootEnvPath)) {
    throw "Could not find .env at $rootEnvPath"
}

$rootEnvContent = Get-Content $rootEnvPath -Raw
if ($rootEnvContent -match '(?m)^API_SERVER_URL=') {
    $rootEnvContent = [regex]::Replace($rootEnvContent, '(?m)^API_SERVER_URL=.*$', "API_SERVER_URL=$BackendUrl")
} else {
    if ($rootEnvContent.Length -gt 0 -and -not $rootEnvContent.EndsWith("`n")) {
        $rootEnvContent += "`r`n"
    }
    $rootEnvContent += "API_SERVER_URL=$BackendUrl`r`n"
}

Set-Content -Path $rootEnvPath -Value $rootEnvContent
Set-Content -Path $teacherEnvPath -Value "VITE_API_SERVER_URL=$BackendUrl`r`n"

Write-Host "Updated demo backend URL to: $BackendUrl"
Write-Host ".env -> $rootEnvPath"
Write-Host "teacher-webapp/.env.local -> $teacherEnvPath"