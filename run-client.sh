#!/usr/bin/env bash
#
# run-client.sh — run the gClient Ext JS frontend from WSL Ubuntu.
#
# Sencha Cmd in node_modules is a Windows-only binary, so this script
# delegates to Windows PowerShell (powershell.exe) — same pattern as run-server.sh.
# The PS1 is copied to Windows TEMP first to avoid the UNC security block.
#
# Usage:
#   ./run-client.sh                    # dev server at http://localhost:1962/
#   ./run-client.sh -Mode build        # production build
#   ./run-client.sh -Install -Mode dev # npm install first, then dev
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_FILE="$SCRIPT_DIR/run-client.ps1"
echo $SCRIPT_DIR

if [[ ! -f "$PS1_FILE" ]]; then
    echo "ERROR: run-client.ps1 not found at: $PS1_FILE" >&2
    exit 1
fi

if ! command -v powershell.exe >/dev/null 2>&1; then
    echo "ERROR: powershell.exe not found. This script must run inside WSL on Windows." >&2
    exit 1
fi

# Copy PS1 to Windows TEMP to avoid the UNC (\\wsl.localhost\...) security block.
WIN_TEMP="$(powershell.exe -NoProfile -Command 'Write-Host $env:TEMP' | tr -d '\r\n')"
WSL_TEMP="$(wslpath "$WIN_TEMP")"
TEMP_PS1="$WSL_TEMP/gserver-run-client.ps1"
cp "$PS1_FILE" "$TEMP_PS1"

WIN_TEMP_PS1="$WIN_TEMP\\gserver-run-client.ps1"
WIN_ROOT="$(wslpath -w "$SCRIPT_DIR")"

echo "Starting gClient frontend (Windows PowerShell)..."
echo "  Project root : $WIN_ROOT"
echo "  Script       : $WIN_TEMP_PS1"
echo ""

powershell.exe -NoProfile -ExecutionPolicy Bypass \
    -File "$WIN_TEMP_PS1" \
    -RootDir "$WIN_ROOT" \
    "$@"
