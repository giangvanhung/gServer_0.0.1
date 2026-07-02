<#
.SYNOPSIS
    Runs Sencha Cmd for the Apptest Ext JS app.

.DESCRIPTION
    Wraps "sencha app watch/build/clean" for the Apptest project (Ext JS 8.0.0.43).
    Requires Sencha Cmd on PATH (sencha.cmd).

.PARAMETER Mode
    watch      -> sencha app watch (dev server with auto-rebuild, default)
    build      -> sencha app build (development)
    testing    -> sencha app build testing
    production -> sencha app build production
    clean      -> sencha app clean (removes build/ output)

.EXAMPLE
    .\run-apptest.ps1
    .\run-apptest.ps1 -Mode build
    .\run-apptest.ps1 -Mode production
#>
[CmdletBinding()]
param(
    [ValidateSet('watch', 'build', 'testing', 'production', 'clean')]
    [string]$Mode = 'watch',
    [string]$RootDir = ''
)

$ErrorActionPreference = 'Stop'

$ScriptRoot = if ($RootDir) { $RootDir } else { $PSScriptRoot }
$AppDir     = Join-Path $ScriptRoot 'Apptest'

if (-not (Test-Path (Join-Path $AppDir 'app.json'))) {
    throw "Apptest project not found: $AppDir"
}

$sencha = Get-Command sencha -ErrorAction SilentlyContinue
if (-not $sencha) {
    throw "sencha not found on PATH. Install Sencha Cmd (https://www.sencha.com/products/extjs/cmd-download/)."
}

Push-Location $AppDir
try {
    switch ($Mode) {
        'watch' {
            Write-Host "Starting Sencha app watch (auto-rebuild on change)..." -ForegroundColor Cyan
            & sencha app watch
        }
        'build' {
            Write-Host "Building Apptest (development)..." -ForegroundColor Cyan
            & sencha app build development
            if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)." }
            Write-Host "Build complete -> $(Join-Path $AppDir 'build\development')" -ForegroundColor Green
        }
        'testing' {
            Write-Host "Building Apptest (testing)..." -ForegroundColor Cyan
            & sencha app build testing
            if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)." }
            Write-Host "Testing build complete -> $(Join-Path $AppDir 'build\testing')" -ForegroundColor Green
        }
        'production' {
            Write-Host "Building Apptest (production)..." -ForegroundColor Cyan
            & sencha app build production
            if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)." }
            Write-Host "Production build complete -> $(Join-Path $AppDir 'build\production')" -ForegroundColor Green
        }
        'clean' {
            Write-Host "Cleaning Apptest build output..." -ForegroundColor Cyan
            & sencha app clean
            if ($LASTEXITCODE -ne 0) { throw "Clean failed (exit $LASTEXITCODE)." }
            Write-Host "Clean complete." -ForegroundColor Green
        }
    }
}
finally {
    Pop-Location
}
