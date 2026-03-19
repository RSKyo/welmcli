#!/usr/bin/env bash
# Source-only library: browser/chrome

# --- Source Guard ------------------------------------------------------------

[[ -n "${__BROWSER_CHROME_SOURCED+x}" ]] && return
__BROWSER_CHROME_SOURCED=1

: "${CHROME_DEBUG_DEFAULT_URL:=about:blank}"
: "${CHROME_DEBUG_PORT:=9222}"
: "${CHROME_DEBUG_PROFILE_DIR:=$HOME/.local/share/welmcli/chrome-cdp-profile}"

chrome_debug_is_running() {
  local port="$CHROME_DEBUG_PORT"

  case "$PLATFORM" in
    macos|linux)
      if command -v nc >/dev/null 2>&1; then
        nc -z localhost "$port" >/dev/null 2>&1
      else
        (echo >/dev/tcp/localhost/"$port") >/dev/null 2>&1
      fi
      ;;
    windows)
      netstat -ano | findstr LISTENING | findstr ":$port" >nul 2>&1
      ;;
  esac
}

chrome_debug_ensure() {
  if chrome_debug_is_running; then
    return 0
  fi

  case "$PLATFORM" in
    macos|linux)
      chrome_debug_unix
      ;;
    windows)
      chrome_debug_windows
      ;;
    *)
      loge "unsupported platform"
      return 1
      ;;
  esac

  local i=0 timeout=5
  local deadline=$((SECONDS+timeout))
  while ((SECONDS < deadline)); do
    if chrome_debug_is_running; then
      logp "chrome" "CDP ready ✔"
      logp_done
      return 0
    fi

    logp "chrome" "waiting CDP... $(spinner_tick "$i")"
    ((i++))
    sleep 0.1
  done
  
  logp "chrome" "CDP timeout ✖"
  logp_done
  return 1
}

chrome_debug_unix() {
  local url="$CHROME_DEBUG_DEFAULT_URL"
  local port="$CHROME_DEBUG_PORT"
  local profile="$CHROME_DEBUG_PROFILE_DIR"

  mkdir -p "$profile" || return 1

  "$CHROME_BIN" \
    --remote-debugging-port="$port" \
    --user-data-dir="$profile" \
    "$url" >/dev/null 2>&1 &
}

chrome_debug_windows() {
  local url="$CHROME_DEBUG_DEFAULT_URL"
  local port="$CHROME_DEBUG_PORT"
  local profile="$CHROME_DEBUG_PROFILE_DIR"

  mkdir -p "$profile" || return 1
  profile="$(cygpath -w "$profile")"

  cmd.exe /c start "" "$CHROME_BIN" \
    --remote-debugging-port="$port" \
    --user-data-dir="$profile" \
    "$url"
}
