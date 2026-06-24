<#
.SYNOPSIS
    Starts the gClient_ExtJS webpack-dev-server (no Visual Studio IDE required).

.DESCRIPTION
    Runs "npm start" inside gClient_ExtJS/g-client, which launches webpack-dev-server
    via portfinder starting at port 1962. Watch the terminal for the actual URL —
    if 1962 is occupied it picks the next free port.

.PARAMETER Port
    Override the base port passed to webpack (default 1962).

.EXAMPLE
    .\run-client.ps1
    .\run-client.ps1 -Port 3000
#>
[CmdletBinding()]
param(
    [int]$Port = 1962
)

$ErrorActionPreference = 'Stop'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClientDir  = Join-Path $ScriptDir 'gClient_ExtJS\g-client'

if (-not (Test-Path (Join-Path $ClientDir 'package.json'))) {
    throw "ExtJS app not found at: $ClientDir"
}

# Ensure node_modules exist
if (-not (Test-Path (Join-Path $ClientDir 'node_modules'))) {
    Write-Host '==> node_modules missing — running npm install first...' -ForegroundColor Yellow
    Push-Location $ClientDir
    try { npm install } finally { Pop-Location }
}

Write-Host '==> Starting ExtJS webpack-dev-server' -ForegroundColor Cyan
Write-Host "    Base port : $Port (portfinder picks the next free one if taken)" -ForegroundColor DarkGray
Write-Host "    App URL   : http://localhost:$Port" -ForegroundColor Green
Write-Host '    Watch the output below for the actual URL if the port changes.' -ForegroundColor DarkGray
Write-Host '    (Press Ctrl+C to stop.)' -ForegroundColor DarkGray
Write-Host ''

Push-Location $ClientDir
try {
    npm start -- --env port=$Port
} finally {
    Pop-Location
}
