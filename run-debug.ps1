<#
.SYNOPSIS
    Build va chay ca WCF (gServer_0.0.1) lan ASP.NET Web Forms (gServerWeb) cung luc.

.DESCRIPTION
    - Build ca 2 project bang MSBuild
    - Start WCF tren port 52106
    - Start gServerWeb tren port 63329
    - Ctrl+C de stop ca hai

.PARAMETER Configuration
    Debug (default) hoac Release.

.PARAMETER SkipBuild
    Bo qua buoc build, chi start IIS Express.

.PARAMETER NoBrowser
    Khong mo browser sau khi start.

.EXAMPLE
    .\run-debug.ps1
    .\run-debug.ps1 -SkipBuild
    .\run-debug.ps1 -Configuration Release
#>
[CmdletBinding()]
param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Debug',
    [switch]$SkipBuild,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$ScriptRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($ScriptRoot)) {
    $ScriptRoot = (Get-Location).Path
}

$WcfDir     = Join-Path $ScriptRoot 'gServer_0.0.1'
$WcfProj    = Join-Path $WcfDir     'gServer_0.0.1.csproj'
$WebDir     = Join-Path $ScriptRoot 'gServerWeb'
$WebProj    = Join-Path $WebDir     'gServerWeb.csproj'
$WcfPort    = 52106
$WebPort    = 63329

function Find-MSBuild {
    $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
    if (Test-Path $vswhere) {
        $path = & $vswhere -latest -requires Microsoft.Component.MSBuild `
            -find 'MSBuild\**\Bin\MSBuild.exe' | Select-Object -First 1
        if ($path -and (Test-Path $path)) { return $path }
    }
    $fallback = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe'
    if (Test-Path $fallback) { return $fallback }
    throw "MSBuild not found."
}

function Find-IISExpress {
    $candidates = @(
        (Join-Path $env:ProgramFiles         'IIS Express\iisexpress.exe'),
        (Join-Path ${env:ProgramFiles(x86)}  'IIS Express\iisexpress.exe')
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    throw "IIS Express not found."
}

# ── Build ────────────────────────────────────────────────────────────────────
if (-not $SkipBuild) {
    $msbuild = Find-MSBuild
    Write-Host ""
    Write-Host "[1/2] Building WCF ($Configuration)..." -ForegroundColor Cyan
    & $msbuild $WcfProj /t:Build /p:Configuration=$Configuration /v:minimal /nologo
    if ($LASTEXITCODE -ne 0) { throw "WCF build failed." }

    Write-Host "[2/2] Building ASP.NET Web Forms ($Configuration)..." -ForegroundColor Cyan
    & $msbuild $WebProj /t:Build /p:Configuration=$Configuration /v:minimal /nologo
    if ($LASTEXITCODE -ne 0) { throw "gServerWeb build failed." }

    Write-Host "Build OK." -ForegroundColor Green
}

# ── Start ────────────────────────────────────────────────────────────────────
$iisexpress = Find-IISExpress

Write-Host ""
Write-Host "Starting WCF on http://localhost:$WcfPort/ ..." -ForegroundColor Yellow
$wcfProc = Start-Process -FilePath $iisexpress `
    -ArgumentList "/path:`"$WcfDir`" /port:$WcfPort /clr:v4.0" `
    -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host "Starting gServerWeb on http://localhost:$WebPort/ ..." -ForegroundColor Yellow
$webProc = Start-Process -FilePath $iisexpress `
    -ArgumentList "/path:`"$WebDir`" /port:$WebPort /clr:v4.0" `
    -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  WCF      : http://localhost:$WcfPort/"
Write-Host "  WCF svc  : http://localhost:$WcfPort/LayerService.svc"
Write-Host "  Login    : http://localhost:$WebPort/Login.aspx"
Write-Host "  ExtJS    : http://localhost:1962/  (can chay rieng: npm start)"
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Nhan Enter de stop ca hai..." -ForegroundColor DarkGray
Write-Host ""

if (-not $NoBrowser) {
    Start-Process "http://localhost:$WebPort/"
}

# ── Wait / Cleanup ───────────────────────────────────────────────────────────
try {
    $null = Read-Host
}
finally {
    Write-Host "Stopping..." -ForegroundColor DarkGray
    if ($wcfProc -and -not $wcfProc.HasExited) { $wcfProc.Kill() }
    if ($webProc -and -not $webProc.HasExited) { $webProc.Kill() }
    Write-Host "Done." -ForegroundColor Green
}
