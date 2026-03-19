#!/usr/bin/env bash
# Source-only library: infra/runtime

# --- Source Guard ------------------------------------------------------------

[[ -n "${__INFRA_RUNTIME_SOURCED+x}" ]] && return
__INFRA_RUNTIME_SOURCED=1

# --- Platform ----------------------------------------------------------------

# Detect and set PLATFORM (macos/linux/windows) once based on OSTYPE.
platform_detect() {
  [[ -n "${PLATFORM+x}" ]] && return 0

  case "$OSTYPE" in
    darwin*)  PLATFORM='macos' ;;
    linux*)   PLATFORM='linux' ;;
    msys*|cygwin*|win32*) PLATFORM='windows' ;;
    *)
      loge "unsupported platform"
      return 1
      ;;
  esac

  readonly PLATFORM
}

# --- Chrome Bin --------------------------------------------------------------

# Resolve CHROME_BIN from PLATFORM if not already provided by user.
chrome_bin_resolve() {
  [[ -n "${PLATFORM+x}" ]] || return 1
  [[ -n "${CHROME_BIN+x}" ]] && return 0

  case "$PLATFORM" in
    macos)
      CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      ;;
    linux)
      CHROME_BIN="google-chrome"
      ;;
    windows)
      CHROME_BIN="chrome"
      ;;
  esac
}

# Validate that CHROME_BIN exists and is executable (path or command).
chrome_bin_check() {
  [[ -n "${CHROME_BIN+x}" ]] || {
    loge "CHROME_BIN not set"
    return 1
  }

  if [[ "$CHROME_BIN" == /* ]]; then
    [[ -x "$CHROME_BIN" ]] || {
      loge "chrome not executable: $CHROME_BIN"
      return 1
    }
  else
    command -v "$CHROME_BIN" >/dev/null 2>&1 || {
      loge "chrome not found: $CHROME_BIN"
      return 1
    }
  fi
}

# --- UI ----------------------------------------------------------------------

readonly -a SPINNER_FRAMES=( "|" "/" "-" "\\" )

# Return spinner frame by index (cyclic, no newline).
spinner_tick() {
  local i="${1:-0}"
  printf '%s' "${SPINNER_FRAMES[i % ${#SPINNER_FRAMES[@]}]}"
}
