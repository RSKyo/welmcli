#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Config
# -------------------------------------------------------------------

REPO="RSKyo/clichatgpt"
BIN_NAME="clichatgpt"
INSTALL_DIR="/usr/local/bin"
URL="https://raw.githubusercontent.com/${REPO}/main/dist/${BIN_NAME}"

# -------------------------------------------------------------------
# Check platform
# -------------------------------------------------------------------

if [[ "$(uname)" != "Darwin" ]]; then
  echo "error: ${BIN_NAME} currently supports macOS only" >&2
  exit 1
fi

# -------------------------------------------------------------------
# Check dependencies
# -------------------------------------------------------------------

if ! command -v curl >/dev/null 2>&1; then
  echo "error: curl is required to install ${BIN_NAME}" >&2
  exit 1
fi

# -------------------------------------------------------------------
# Prepare temp dir
# -------------------------------------------------------------------

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

TMP_FILE="$TMP_DIR/$BIN_NAME"

echo "Installing ${BIN_NAME}..."

# -------------------------------------------------------------------
# Download
# -------------------------------------------------------------------

echo "Downloading binary..."

if ! curl -fsSL "$URL?nocache=$(date +%s)" -o "$TMP_FILE"; then
  echo "error: failed to download ${BIN_NAME}" >&2
  exit 1
fi

# -------------------------------------------------------------------
# Install
# -------------------------------------------------------------------

echo "Installing to ${INSTALL_DIR}..."

sudo mv "$TMP_FILE" "${INSTALL_DIR}/${BIN_NAME}"
sudo chmod +x "${INSTALL_DIR}/${BIN_NAME}"

# -------------------------------------------------------------------
# Done
# -------------------------------------------------------------------

echo
echo "✔ Installed ${BIN_NAME}"
echo

if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
  echo "warning: ${INSTALL_DIR} is not in PATH"
fi