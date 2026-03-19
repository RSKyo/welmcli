#!/usr/bin/env bash
# Source-only library: config

# --- Source Guard ------------------------------------------------------------

[[ -n "${__CONFIG_SOURCED+x}" ]] && return
__CONFIG_SOURCED=1

# --- Constants ---------------------------------------------------------------

readonly WELMCLI_CONFIG_DIR="${HOME}/.config/welmcli"
readonly WELMCLI_CONFIG_FILE="$WELMCLI_CONFIG_DIR/config"

# --- Public API --------------------------------------------------------------

welmcli_config_ensure() {
  [[ -f "$WELMCLI_CONFIG_FILE" ]] && return 0

  mkdir -p "$WELMCLI_CONFIG_DIR" || return 1

  cat >"$WELMCLI_CONFIG_FILE" <<EOF
# welmcli config
WELMCLI_DATA_DIR="${HOME}/.local/share/welmcli"

# ChatGpt
CLICHATGPT_URL='https://chatgpt.com/?temporary-chat=true'
CLICHATGPT_REPLY_FILE_NAME="$(date '+%Y%m%d_%H%M%S')_reply"

EOF
}

welmcli_config_load() {
  [[ -f "$WELMCLI_CONFIG_FILE" ]] && source "$WELMCLI_CONFIG_FILE"
}

welmcli_config_read() {
  local key="${1:?welmcli_config_read: missing key}"
  local file="$WELMCLI_CONFIG_FILE"

  [[ -f "$file" ]] || return 1

  local line value

  while IFS= read -r line; do
    [[ -z "$line" || "$line" == \#* ]] && continue

    case "$line" in
      "$key="*)
        value="${line#*=}"
        printf '%s\n' "$value"
        return 0
        ;;
    esac
  done < "$file"

  return 1
}

welmcli_config_write() {
  local key="${1:?welmcli_config_write: missing key}"
  local value="${2:?welmcli_config_write: missing value}"

  local file="$WELMCLI_CONFIG_FILE"
  local dir
  dir="$(dirname "$file")"

  mkdir -p "$dir" || return 1

  local tmp
  tmp="$(mktemp "${TMPDIR}/welmcli.XXXXXX")" || return 1
  trap 'rm -f "$tmp"' RETURN

  local found=0 line

  if [[ -f "$file" ]]; then
    while IFS= read -r line; do
      if [[ "$line" == "$key="* ]]; then
        printf '%s=%s\n' "$key" "$value" >>"$tmp"
        found=1
      else
        printf '%s\n' "$line" >>"$tmp"
      fi
    done < "$file"
  fi

  if (( ! found )); then
    printf '%s=%s\n' "$key" "$value" >>"$tmp"
  fi

  mv "$tmp" "$file" || return 1

  # 重新加载
  welmcli_config_load
}