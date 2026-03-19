#!/usr/bin/env bash
# Source-only library: infra/deps

# --- Source Guard ------------------------------------------------------------

[[ -n "${__INFRA_DEPS_SOURCED+x}" ]] && return
__INFRA_DEPS_SOURCED=1

# --- Package Manager ---------------------------------------------------------

deps_pm_init() {
  [[ -n "${PLATFORM+x}" ]] || return 1
  [[ -n "${DEPS_PM+x}" ]] && return 0

  case "$PLATFORM" in
    macos)
      command -v brew >/dev/null && DEPS_PM='brew'
      ;;
    linux)
      if command -v apt >/dev/null 2>&1; then
        DEPS_PM='apt'
      elif command -v dnf >/dev/null 2>&1; then
        DEPS_PM='dnf'
      elif command -v yum >/dev/null 2>&1; then
        DEPS_PM='yum'
      elif command -v pacman >/dev/null 2>&1; then
        DEPS_PM='pacman'
      fi
      ;;
    windows)
      if command -v choco >/dev/null 2>&1; then
        DEPS_PM='choco'
      elif command -v winget >/dev/null 2>&1; then
        DEPS_PM='winget'
      fi
      ;;
  esac

  readonly DEPS_PM
}

# --- Install Strategy --------------------------------------------------------

deps_install_hint() {
  local pkg="${1:?deps_install_hint: missing pkg}"

  case "$DEPS_PM" in
    brew)   printf 'brew install %s\n' "$pkg" ;;
    apt)    printf 'sudo apt install -y %s\n' "$pkg" ;;
    dnf)    printf 'sudo dnf install -y %s\n' "$pkg" ;;
    yum)    printf 'sudo yum install -y %s\n' "$pkg" ;;
    pacman) printf 'sudo pacman -S %s\n' "$pkg" ;;
    choco)  printf 'choco install %s\n' "$pkg" ;;
    winget) printf 'winget install %s\n' "$pkg" ;;
    *)
      printf 'install %s manually\n' "$pkg"
      ;;
  esac
}

# --- Dependency API ----------------------------------------------------------

deps_has() {
  local cmd="$1"

  if [[ "$cmd" == /* ]]; then
    [[ -x "$cmd" ]]
  else
    command -v "$cmd" >/dev/null 2>&1
  fi
}

deps_require() {
  (( $# > 0 )) || return 0

  deps_pm_init

  local cmd missing=0

  for cmd in "$@"; do
    if ! deps_has "$cmd"; then
      loge "deps: missing command: $cmd"
      logh "$(deps_install_hint "$cmd")"
      missing=1
    fi
  done

  (( missing == 0 ))
}