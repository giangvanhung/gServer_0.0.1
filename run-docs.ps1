<#
.SYNOPSIS
    Serves or builds the MkDocs documentation for gServer/gClient.

.DESCRIPTION
    Wraps mkdocs serve / mkdocs build for the gServer_Introduction folder.

    Modes:
      serve  (default) — live-reload dev server, open in browser automatically.
      build             — build static HTML into gServer_Introduction/site/.

    Auto-installs mkdocs-material and required plugins via pip if missing.

.PARAMETER Mode
    'serve' (default) or 'build'.

.PARAMETER Port
    Port for mkdocs serve. Default 8000.

.PARAMETER NoBrowser
    Skip auto-opening the browser (serve mode only).

.EXAMPLE
    .\run-docs.ps1                          # serve on http://localhost:8000
    .\run-docs.ps1 -Mode build              # build static HTML to site/
    .\run-docs.ps1 -Port 8080               # serve on http://localhost:8080
    .\run-docs.ps1 -Mode serve -NoBrowser   # serve without opening browser
#>
[CmdletBinding()]
param(
    [ValidateSet('serve', 'build')]
    [string]$Mode = 'serve',

    [int]$Port = 8000,

    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DocsDir   = Join-Path $ScriptDir 'gServer_Introduction'
$MkdocsYml = Join-Path $DocsDir 'mkdocs.yml'

# ── Validate docs folder ────────────────────────────────────────────────────
if (-not (Test-Path $MkdocsYml)) {
    throw "mkdocs.yml not found at: $MkdocsYml"
}

# ── Check Python ─────────────────────────────────────────────────────────────
function Find-Python {
    foreach ($cmd in 'python', 'python3', 'py') {
        try {
            $ver = & $cmd --version 2>&1
            if ($ver -match 'Python 3') { return $cmd }
        } catch { }
    }
    throw 'Python 3 not found. Install from https://www.python.org/downloads/'
}

$python = Find-Python
Write-Host "==> Python : $(& $python --version)" -ForegroundColor DarkGray

# ── Check / install mkdocs + material ───────────────────────────────────────
function Test-PipPackage([string]$package) {
    $list = & $python -m pip show $package 2>&1
    return ($list -notmatch 'WARNING: Package(s) not found')
}

$required = @(
    'mkdocs',
    'mkdocs-material',
    'pymdown-extensions'
)

$missing = $required | Where-Object { -not (Test-PipPackage $_) }

if ($missing) {
    Write-Host "==> Installing missing packages: $($missing -join ', ')" -ForegroundColor Yellow
    & $python -m pip install --quiet $missing
    if ($LASTEXITCODE -ne 0) {
        throw "pip install failed."
    }
    Write-Host '==> Packages installed.' -ForegroundColor Green
} else {
    Write-Host '==> All packages present.' -ForegroundColor DarkGray
}

# ── Run ─────────────────────────────────────────────────────────────────────
Push-Location $DocsDir
try {
    if ($Mode -eq 'serve') {
        $url = "http://localhost:$Port"
        Write-Host ''
        Write-Host '==> Starting MkDocs dev server' -ForegroundColor Cyan
        Write-Host "    Docs URL : $url"             -ForegroundColor Green
        Write-Host "    Source   : $DocsDir"         -ForegroundColor DarkGray
        Write-Host '    (Press Ctrl+C to stop.)'     -ForegroundColor DarkGray
        Write-Host ''

        if (-not $NoBrowser) {
            # Open browser after a short delay so the server has time to start
            Start-Job -ScriptBlock {
                param($u)
                Start-Sleep -Seconds 2
                Start-Process $u
            } -ArgumentList $url | Out-Null
        }

        & $python -m mkdocs serve --dev-addr "127.0.0.1:$Port"

    } elseif ($Mode -eq 'build') {
        $siteDir = Join-Path $DocsDir 'site'
        Write-Host ''
        Write-Host '==> Building MkDocs static site'   -ForegroundColor Cyan
        Write-Host "    Source   : $DocsDir"            -ForegroundColor DarkGray
        Write-Host "    Output   : $siteDir"            -ForegroundColor DarkGray
        Write-Host ''

        & $python -m mkdocs build --clean

        if ($LASTEXITCODE -ne 0) {
            throw "mkdocs build failed (exit code $LASTEXITCODE)."
        }

        $indexHtml = Join-Path $siteDir 'index.html'
        Write-Host ''
        Write-Host '==> Build succeeded.' -ForegroundColor Green
        Write-Host "    Open : $indexHtml" -ForegroundColor Green

        # Ask to open in browser
        $answer = Read-Host '    Open in browser now? [y/N]'
        if ($answer -match '^[Yy]') {
            Start-Process $indexHtml
        }
    }
} finally {
    Pop-Location
}
