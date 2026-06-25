<#
.SYNOPSIS
    Runs the gClient Ext JS (modern toolkit, v8.x) front-end.

.DESCRIPTION
    The g-client app uses Sencha's open tooling (webpack + @sencha/ext-webpack-plugin).
    This script runs the npm dev server (hot reload) or a production build.
    Windows-only: the installed Sencha Cmd / JRE in node_modules is the Windows build.

.PARAMETER Mode
    dev          -> webpack-dev-server with hot reload (default)
    build        -> production build (output in ./build)
    build-testing-> testing build

.PARAMETER Install
    Run "npm install" before building (use after a fresh checkout or dependency change).

.EXAMPLE
    .\run-client.ps1
    .\run-client.ps1 -Mode build
    .\run-client.ps1 -Install -Mode dev
#>
[CmdletBinding()]
param(
    [ValidateSet('dev', 'build', 'build-testing')]
    [string]$Mode = 'dev',
    [switch]$Install,
    [string]$RootDir = ''
)

$ErrorActionPreference = 'Stop'

# $RootDir is passed from run-client.sh so this script works from any location.
$ScriptRoot = if ($RootDir) { $RootDir } else { $PSScriptRoot }
$ClientDir  = Join-Path $ScriptRoot 'gClient_ExtJS\g-client'

if (-not (Test-Path (Join-Path $ClientDir 'package.json'))) {
    throw "Client project not found: $ClientDir"
}

# Verify npm is available.
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    throw "npm not found on PATH. Install Node.js (https://nodejs.org)."
}

Push-Location $ClientDir
try {
    if ($Install -or -not (Test-Path (Join-Path $ClientDir 'node_modules'))) {
        Write-Host "Installing dependencies (npm install)..." -ForegroundColor Cyan
        & npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed (exit $LASTEXITCODE)." }
    }

    switch ($Mode) {
        'dev' {
            Write-Host "Starting dev server (Ext JS modern 8.x)..." -ForegroundColor Cyan
            Write-Host "  URL: http://localhost:1962/  (Ctrl+C to stop)" -ForegroundColor DarkGray
            & npm run dev
        }
        'build' {
            Write-Host "Building production bundle..." -ForegroundColor Cyan
            & npm run build
            if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)." }
            Write-Host "Build complete -> $(Join-Path $ClientDir 'build')" -ForegroundColor Green
        }
        'build-testing' {
            Write-Host "Building testing bundle..." -ForegroundColor Cyan
            & npm run build:testing
            if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)." }
            Write-Host "Testing build complete." -ForegroundColor Green
        }
    }
}
finally {
    Pop-Location
}
