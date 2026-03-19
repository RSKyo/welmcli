#!/usr/bin/env bash
# Source-only library: infra/config

# --- Source Guard ------------------------------------------------------------

[[ -n "${__INFRA_CONFIG_SOURCED+x}" ]] && return
__INFRA_CONFIG_SOURCED=1

# --- Constants ---------------------------------------------------------------

readonly CONFIG_DIR="${HOME}/.config/welmcli"
readonly CONFIG_FILE="$CONFIG_DIR/config"

# --- Public API --------------------------------------------------------------

config_ensure() {
  [[ -f "$CONFIG_FILE" ]] && return 0
  
  mkdir -p "$CONFIG_DIR" || return 1

  cat >"$CONFIG_FILE" <<EOF
# welmcli config
DATA_DIR="${HOME}/.local/share/welmcli"

# ChatGpt
CHATGPT_URL='https://chatgpt.com/?temporary-chat=true'
CHATGPT_REPLY_FILE_NAME="$(date '+%Y%m%d_%H%M%S')_reply"

EOF
}

config_load() {
  [[ -f "$CONFIG_FILE" ]] || return 0
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
}

config_get() {
  local key="${1:?config_get: missing key}"
 
  [[ -f "$CONFIG_FILE" ]] || return 1

  local line value
  while IFS= read -r line; do
    [[ -z "$line" || "$line" == \#* ]] && continue

    case "$line" in
      "${key}="*)
        value="$(config_unquote "${line#*=}")"
        printf '%s\n' "$value"
        return 0
        ;;
    esac
  done < "$CONFIG_FILE"

  return 1
}

config_set() {
  local key="${1:?config_set: missing key}"
  local value="${2:?config_set: missing value}"

  [[ -f "$CONFIG_FILE" ]] || return 1

  local tmp
  tmp="$(mktemp "${TMPDIR:-/tmp}/welmcli.XXXXXX")" || return 1
  trap 'rm -f "$tmp"' RETURN

  local found=0 line
  while IFS= read -r line; do
    if [[ "$line" == "${key}="* ]]; then
      printf '%s=%q\n' "${key}" "$value" >>"$tmp"
      found=1
    else
      printf '%s\n' "$line" >>"$tmp"
    fi
  done < "$CONFIG_FILE"

  if (( ! found )); then
    printf '%s=%q\n' "${key}" "$value" >>"$tmp"
  fi

  mv "$tmp" "$CONFIG_FILE" || return 1

  # 重新加载
  config_load
}

config_unquote() {
  local v="$1"

  v="${v#\'}"
  v="${v%\'}"
  v="${v#\"}"
  v="${v%\"}"

  printf '%s\n' "$v"
}