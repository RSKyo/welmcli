#!/usr/bin/env bash
# Source-only library: infra/log

# --- Source Guard ------------------------------------------------------------

[[ -n ${__INFRA_LOG_SOURCED+x} ]] && return
__INFRA_LOG_SOURCED=1

# --- Config ------------------------------------------------------------------

: "${LOG_VERBOSE:=1}"
: "${LOG_FD:=2}"

# Enable color only if terminal
[[ -t "$LOG_FD" ]] && __LOG_ERR_COLOR=1 || __LOG_ERR_COLOR=0

# --- Public API --------------------------------------------------------------

log() {
  (( LOG_VERBOSE )) || return

  local module="$1"
  shift

  printf '[%s] %s\n' "$module" "$*" >&"$LOG_FD"
}

loge() {
  if (( __LOG_ERR_COLOR )); then
    printf '\033[31m[ERROR]\033[0m %s\n' "$*" >&"$LOG_FD"
  else
    printf '[ERROR] %s\n' "$*" >&"$LOG_FD"
  fi
}

logh() {
  printf '  -> %s\n' "$*" >&"$LOG_FD"
}

logp() {
  (( LOG_VERBOSE )) || return

  local module="$1"
  shift

  printf '\r\033[K[%s] %s' "$module" "$*" >&"$LOG_FD"
}

# \r      回到行首
# \033[K  清除整行
logp_done() {
  printf '\n' >&"$LOG_FD"
}

die() {
  loge "$@"
  exit 1
}