#!/usr/bin/env bash
#
# serve-docs.sh — build/serve the gServer_Introduction MkDocs site (Material theme).
#
# Runs natively in WSL/Linux (MkDocs is Python). On first run it creates a local
# virtualenv and installs MkDocs + the plugins the config needs. The site config
# enables `md_in_html`, so raw HTML embedded in the Markdown is rendered as-is.
#
# Usage:
#   ./serve-docs.sh                # serve with live reload at http://127.0.0.1:8000
#   ./serve-docs.sh -a 0.0.0.0:8001  # serve on a custom host:port
#   ./serve-docs.sh build          # build static HTML into ../gServer_Introduction_html
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$SCRIPT_DIR/gServer_Introduction"          # contains mkdocs.yml
HTML_OUT="$SCRIPT_DIR/gServer_Introduction_html"     # prebuilt/static HTML output
VENV_DIR="$DOCS_DIR/.venv"

if [[ ! -f "$DOCS_DIR/mkdocs.yml" ]]; then
    echo "Error: mkdocs.yml not found in $DOCS_DIR" >&2
    exit 1
fi

# --- Ensure a venv with MkDocs + required plugins ----------------------------
if [[ ! -x "$VENV_DIR/bin/mkdocs" ]]; then
    echo "Setting up MkDocs virtualenv (first run)..."
    # WSL2: venv may fail to create the lib64->lib symlink (non-critical).
    # Allow that error, then check the venv is actually usable.
    python3 -m venv "$VENV_DIR" 2>&1 || true
    if [[ ! -x "$VENV_DIR/bin/python" ]]; then
        echo "ERROR: Failed to create virtualenv at $VENV_DIR" >&2
        exit 1
    fi
    # shellcheck disable=SC1091
    source "$VENV_DIR/bin/activate"
    python -m pip install --upgrade pip >/dev/null
    # mkdocs-material pulls in mkdocs; pymdown-extensions covers pymdownx.* fences.
    python -m pip install mkdocs mkdocs-material pymdown-extensions
else
    # shellcheck disable=SC1091
    source "$VENV_DIR/bin/activate"
fi

cd "$DOCS_DIR"

# --- Run ---------------------------------------------------------------------
if [[ "${1:-}" == "build" ]]; then
    shift || true
    echo "Building static site -> $HTML_OUT"
    mkdocs build --clean --site-dir "$HTML_OUT" "$@"
    echo "Done."
else
    echo "Serving docs at http://127.0.0.1:8000  (Ctrl+C to stop)"
    mkdocs serve "$@"
fi
