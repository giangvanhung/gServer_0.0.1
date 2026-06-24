<#
.SYNOPSIS
    Builds and runs the gServer_0.0.1 WCF service under IIS Express (no Visual Studio IDE required).

.DESCRIPTION
    1. Locates MSBuild (via vswhere, then common VS2022 paths).
    2. Builds gServer_0.0.1.csproj in the chosen configuration.
    3. Launches IIS Express against the project folder on the given port.

.PARAMETER Configuration
    Build configuration: Debug (default) or Release.

.PARAMETER Port
    HTTP port for IIS Express. Default 52106 (matches the project's IISUrl).

.PARAMETER NoBuild
    Skip the MSBuild step and just start IIS Express against the last build.

.EXAMPLE
    .\run-server.ps1
    .\run-server.ps1 -Configuration Release -Port 8080
    .\run-server.ps1 -NoBuild
#>
[CmdletBinding()]
param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Debug',

    [int]$Port = 52106,

    [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir  = Join-Path $ScriptDir 'gServer_0.0.1'
$ProjectFile = Join-Path $ProjectDir 'gServer_0.0.1.csproj'

if (-not (Test-Path $ProjectFile)) {
    throw "Project not found: $ProjectFile"
}

function Find-MSBuild {
    # Prefer vswhere (handles any VS2022 edition/install path).
    $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
    if (Test-Path $vswhere) {
        $path = & $vswhere -latest -requires Microsoft.Component.MSBuild `
            -find 'MSBuild\**\Bin\MSBuild.exe' | Select-Object -First 1
        if ($path -and (Test-Path $path)) { return $path }
    }
    # Fallback: probe common VS2022 editions.
    foreach ($edition in 'Enterprise', 'Professional', 'Community', 'BuildTools') {
        $candidate = "C:\Program Files\Microsoft Visual Studio\2022\$edition\MSBuild\Current\Bin\MSBuild.exe"
        if (Test-Path $candidate) { return $candidate }
    }
    throw 'MSBuild.exe not found. Install Visual Studio 2022 or the Build Tools.'
}

function Find-IISExpress {
    foreach ($p in @(
            'C:\Program Files\IIS Express\iisexpress.exe',
            'C:\Program Files (x86)\IIS Express\iisexpress.exe')) {
        if (Test-Path $p) { return $p }
    }
    throw 'iisexpress.exe not found. Install IIS Express.'
}

if (-not $NoBuild) {
    $msbuild = Find-MSBuild
    Write-Host "==> Building ($Configuration) with:" -ForegroundColor Cyan
    Write-Host "    $msbuild" -ForegroundColor DarkGray
    & $msbuild $ProjectFile /p:Configuration=$Configuration /p:Platform=AnyCPU /v:minimal /nologo
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed (exit code $LASTEXITCODE)."
    }
    Write-Host '==> Build succeeded.' -ForegroundColor Green
}

$iisexpress = Find-IISExpress
$baseUrl = "http://localhost:$Port"

Write-Host ''
Write-Host "==> Starting IIS Express on port $Port" -ForegroundColor Cyan
Write-Host "    Service : $baseUrl/LayerService.svc"      -ForegroundColor Green
Write-Host "    Help    : $baseUrl/LayerService.svc/help" -ForegroundColor Green
Write-Host "    WSDL    : $baseUrl/LayerService.svc?wsdl" -ForegroundColor Green
Write-Host '    (Press Q then Enter, or Ctrl+C, to stop.)' -ForegroundColor DarkGray
Write-Host ''

& $iisexpress /path:$ProjectDir /port:$Port
