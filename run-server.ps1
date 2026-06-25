<#
.SYNOPSIS
    Builds and runs the gServer WCF service (.NET Framework 4.5.1) under IIS Express.

.DESCRIPTION
    The gServer_0.0.1 backend is a WCF service hosted as an ASP.NET web application
    (LayerService.svc). This script builds it with MSBuild and launches it with
    IIS Express on the configured port. Windows-only (requires .NET Framework,
    MSBuild and IIS Express).

.PARAMETER Port
    Port for IIS Express. Defaults to 52106 (matches the project's IISUrl).

.PARAMETER Configuration
    Build configuration: Debug (default) or Release.

.PARAMETER SkipBuild
    Skip MSBuild and just launch IIS Express against the existing build.

.EXAMPLE
    .\run-server.ps1
    .\run-server.ps1 -Port 8080 -Configuration Release
    .\run-server.ps1 -SkipBuild
#>
[CmdletBinding()]
param(
    [int]$Port = 52106,
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Debug',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

# Resolve paths relative to this script.
$ScriptRoot  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir  = Join-Path $ScriptRoot 'gServer_0.0.1'          # web app physical path
$ProjectFile = Join-Path $ProjectDir 'gServer_0.0.1.csproj'

if (-not (Test-Path $ProjectFile)) {
    throw "Project not found: $ProjectFile"
}

function Find-MSBuild {
    # Prefer the VS-installed MSBuild located via vswhere.
    $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
    if (Test-Path $vswhere) {
        $path = & $vswhere -latest -requires Microsoft.Component.MSBuild `
            -find 'MSBuild\**\Bin\MSBuild.exe' | Select-Object -First 1
        if ($path -and (Test-Path $path)) { return $path }
    }
    # Fallback to the .NET Framework 4.x MSBuild.
    $fallback = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe'
    if (Test-Path $fallback) { return $fallback }
    throw "MSBuild not found. Install Visual Studio Build Tools or .NET Framework SDK."
}

function Find-IISExpress {
    $candidates = @(
        (Join-Path $env:ProgramFiles 'IIS Express\iisexpress.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'IIS Express\iisexpress.exe')
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    throw "IIS Express not found. Install IIS Express (ships with Visual Studio)."
}

if (-not $SkipBuild) {
    $msbuild = Find-MSBuild
    Write-Host "Building ($Configuration) with: $msbuild" -ForegroundColor Cyan
    & $msbuild $ProjectFile /t:Build /p:Configuration=$Configuration /v:minimal /nologo
    if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)." }
    Write-Host "Build succeeded." -ForegroundColor Green
}

$iisexpress = Find-IISExpress
$baseUrl    = "http://localhost:$Port"

Write-Host ""
Write-Host "Starting IIS Express..." -ForegroundColor Cyan
Write-Host "  Site path : $ProjectDir"
Write-Host "  Base URL  : $baseUrl/"
Write-Host "  Service   : $baseUrl/LayerService.svc"
Write-Host "  (Ctrl+C to stop)" -ForegroundColor DarkGray
Write-Host ""

& $iisexpress /path:"$ProjectDir" /port:$Port /clr:v4.0
