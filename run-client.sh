#!/usr/bin/env bash
#
# run-client.sh — launch the gClient Ext JS (modern toolkit, v8.x) front-end
# from a WSL bash shell.
#
# The client's Sencha Cmd / JRE in node_modules is the Windows build, so this
# wrapper invokes run-client.ps1 via Windows PowerShell (powershell.exe).
# Any arguments are passed straight through.
#
# Usage:
#   ./run-client.sh                    # dev server (hot reload) at http://localhost:1962/
#   ./run-client.sh -Mode build        # production build
#   ./run-client.sh -Install -Mode dev # reinstall deps, then dev
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_FILE="$SCRIPT_DIR/run-client.ps1"

if [[ ! -f "$PS1_FILE" ]]; then
    echo "Error: run-client.ps1 not found next to this script." >&2
    exit 1
fi

if ! command -v powershell.exe >/dev/null 2>&1; then
    echo "Error: powershell.exe not found. This must run inside WSL on Windows." >&2
    exit 1
fi

# Translate the WSL path to a Windows path for PowerShell.
WIN_PS1="$(wslpath -w "$PS1_FILE")"

echo "Launching client via Windows PowerShell: $WIN_PS1"
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$WIN_PS1" "$@"
