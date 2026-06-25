#!/usr/bin/env bash
#
# run-server.sh — build & run the gServer WCF backend from WSL Ubuntu.
#
# Copies run-server.ps1 to the Windows TEMP folder before running, to avoid
# PowerShell's security block on UNC paths (\\wsl.localhost\...).
# Passes the real project root via -RootDir so paths resolve correctly.
#
# Usage:
#   ./run-server.sh                          # build + run on :52106
#   ./run-server.sh -SkipBuild               # skip MSBuild, just start IIS Express
#   ./run-server.sh -Port 8080
#   ./run-server.sh -Configuration Release
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_FILE="$SCRIPT_DIR/run-server.ps1"

if [[ ! -f "$PS1_FILE" ]]; then
    echo "ERROR: run-server.ps1 not found at: $PS1_FILE" >&2
    exit 1
fi

if ! command -v powershell.exe >/dev/null 2>&1; then
    echo "ERROR: powershell.exe not found. This script must run inside WSL on Windows." >&2
    exit 1
fi

echo "Resolving Windows paths..."

# Get the Windows TEMP directory via cmd.exe (lighter than PowerShell, avoids WSL hang).
WIN_TEMP="$(cmd.exe /c 'echo %TEMP%' 2>/dev/null | tr -d '\r\n')"
if [[ -z "$WIN_TEMP" ]]; then
    echo "ERROR: Could not read %%TEMP%% from cmd.exe." >&2
    exit 1
fi
WSL_TEMP="$(wslpath "$WIN_TEMP")"
TEMP_PS1="$WSL_TEMP/gserver-run-server.ps1"
cp "$PS1_FILE" "$TEMP_PS1"

WIN_TEMP_PS1="$WIN_TEMP\\gserver-run-server.ps1"
WIN_ROOT="$(wslpath -w "$SCRIPT_DIR")"

echo "Starting gServer backend (Windows PowerShell)..."
echo "  Project root : $WIN_ROOT"
echo "  Script       : $WIN_TEMP_PS1"
echo ""

powershell.exe -NoProfile -ExecutionPolicy Bypass \
    -File "$WIN_TEMP_PS1" \
    -RootDir "$WIN_ROOT" \
    "$@"
