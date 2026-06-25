#!/usr/bin/env bash
#
# run-server.sh — launch the gServer WCF backend (.NET Framework 4.5.1 + IIS Express)
# from a WSL bash shell.
#
# The backend only runs on Windows, so this wrapper invokes run-server.ps1 via
# Windows PowerShell (powershell.exe). Any arguments are passed straight through.
#
# Usage:
#   ./run-server.sh                          # build + run on :52106
#   ./run-server.sh -Port 8080 -Configuration Release
#   ./run-server.sh -SkipBuild
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_FILE="$SCRIPT_DIR/run-server.ps1"

if [[ ! -f "$PS1_FILE" ]]; then
    echo "Error: run-server.ps1 not found next to this script." >&2
    exit 1
fi

if ! command -v powershell.exe >/dev/null 2>&1; then
    echo "Error: powershell.exe not found. This must run inside WSL on Windows." >&2
    exit 1
fi

# Translate the WSL path to a Windows path for PowerShell.
WIN_PS1="$(wslpath -w "$PS1_FILE")"

echo "Launching server via Windows PowerShell: $WIN_PS1"
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$WIN_PS1" "$@"
