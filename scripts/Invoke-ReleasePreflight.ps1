[CmdletBinding()]
param(
    [string]$BackendEnv = "backend/.env",
    [string]$MobileEnv = "mobile/.env",
    [string]$MavenCommand = "mvn",
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$script:Failures = [System.Collections.Generic.List[string]]::new()

function Add-Failure([string]$Message) {
    $script:Failures.Add($Message)
}

function Read-DotEnv([string]$Path) {
    $values = @{}
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Add-Failure "No existe $Path"
        return $values
    }
    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) {
            continue
        }
        $name, $value = $trimmed.Split("=", 2)
        $values[$name.Trim()] = $value.Trim().Trim('"').Trim("'")
    }
    return $values
}

function Require-Value($Values, [string]$Name, [string]$Scope) {
    if (-not $Values.ContainsKey($Name) -or [string]::IsNullOrWhiteSpace($Values[$Name])) {
        Add-Failure "$Scope`: falta $Name"
        return $false
    }
    $lower = $Values[$Name].ToLowerInvariant()
    if ($lower -match "replace|example|changeme|your-|placeholder") {
        Add-Failure "$Scope`: $Name conserva un marcador de posición"
        return $false
    }
    return $true
}

$backend = Read-DotEnv $BackendEnv
$mobile = Read-DotEnv $MobileEnv

foreach ($name in @(
    "DB_PASSWORD", "JWT_SECRET", "CORS_ALLOWED_ORIGINS",
    "MAIL_HOST", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM"
)) {
    [void](Require-Value $backend $name "Backend")
}

if ($backend.ContainsKey("JWT_SECRET") -and $backend["JWT_SECRET"].Length -lt 32) {
    Add-Failure "Backend: JWT_SECRET debe tener al menos 32 caracteres"
}
if ($backend.ContainsKey("CORS_ALLOWED_ORIGINS") -and
    -not $backend["CORS_ALLOWED_ORIGINS"].StartsWith("https://")) {
    Add-Failure "Backend: CORS_ALLOWED_ORIGINS debe usar HTTPS"
}
if ($backend["FIREBASE_ENABLED"] -eq "true") {
    [void](Require-Value $backend "FIREBASE_CREDENTIALS_FILE" "Backend")
}
if ($backend["DIRECTIONS_ENABLED"] -eq "true") {
    [void](Require-Value $backend "DIRECTIONS_API_KEY" "Backend")
}

foreach ($name in @(
    "EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID",
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS", "EXPO_PUBLIC_EAS_PROJECT_ID",
    "EXPO_PUBLIC_PRIVACY_URL", "EXPO_PUBLIC_TERMS_URL", "EXPO_PUBLIC_SUPPORT_URL"
)) {
    [void](Require-Value $mobile $name "Mobile")
}

foreach ($name in @(
    "EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_PRIVACY_URL",
    "EXPO_PUBLIC_TERMS_URL", "EXPO_PUBLIC_SUPPORT_URL"
)) {
    if ($mobile.ContainsKey($name) -and -not $mobile[$name].StartsWith("https://")) {
        Add-Failure "Mobile: $name debe usar HTTPS"
    }
}
if ($mobile.ContainsKey("EXPO_PUBLIC_API_URL") -and -not $mobile["EXPO_PUBLIC_API_URL"].EndsWith("/api")) {
    Add-Failure "Mobile: EXPO_PUBLIC_API_URL debe terminar en /api"
}
if (($mobile.Values -join " ") -match "localhost|10\.0\.2\.2|192\.168\.") {
    Add-Failure "Mobile: existen URLs locales; no son válidas para un build de producción"
}

foreach ($asset in @("icon.png", "adaptive-icon.png", "splash.png")) {
    $assetPath = Join-Path "mobile/assets" $asset
    if (-not (Test-Path -LiteralPath $assetPath)) {
        Add-Failure "Mobile: falta assets/$asset"
    } elseif ((Get-Item -LiteralPath $assetPath).Length -lt 10000) {
        Add-Failure "Mobile: assets/$asset parece un placeholder"
    }
}

if (-not $SkipTests) {
    $maven = Get-Command $MavenCommand -ErrorAction SilentlyContinue
    if (-not $maven) {
        Add-Failure "Backend: no se encontró Maven; usa -MavenCommand con la ruta correcta"
    } else {
        Push-Location "backend"
        try {
            & $maven.Source --batch-mode verify
            if ($LASTEXITCODE -ne 0) { Add-Failure "Backend: Maven verify falló" }
        } finally {
            Pop-Location
        }
    }

    Push-Location "mobile"
    try {
        & npm.cmd run lint
        if ($LASTEXITCODE -ne 0) { Add-Failure "Mobile: ESLint falló" }
        & npm.cmd run typecheck
        if ($LASTEXITCODE -ne 0) { Add-Failure "Mobile: TypeScript falló" }
        & npm.cmd test -- --runInBand
        if ($LASTEXITCODE -ne 0) { Add-Failure "Mobile: Jest falló" }
    } finally {
        Pop-Location
    }
}

if ($script:Failures.Count -gt 0) {
    Write-Host "PRE-FLIGHT BLOQUEADO ($($script:Failures.Count) requisito(s))" -ForegroundColor Red
    $script:Failures | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "PRE-FLIGHT APROBADO: configuración y validaciones locales correctas." -ForegroundColor Green
