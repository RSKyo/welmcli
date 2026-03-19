#!/usr/bin/env bash
# Source-only library: node

cdp() {
  node "$PROJECT_DIR/node/cdp.js" "$@"
}

__unwrap() {
  local out="$1"

  if ! jq -e '.ok' <<< "$out" > /dev/null; then
    loge 'node cdp' "$(jq -r '.error' <<< "$out")"
    return 1
  fi

  printf '%s\n' "$(jq -r '.value' <<< "$out")"
}

cdp_find_tab_id() {
  local keyword="${1:?missing keyword}"
  local result

  result=$(cdp find-tab "$keyword" --id-only)
  __unwrap "$result"
}

cdp_find_tab() {
  local keyword="${1:?missing keyword}"
  local result

  result=$(cdp find-tab "$keyword")
  __unwrap "$result"
}

cdp_text() {
  local tabId="${1:?missing tab id}"
  local selector="${2:?missing selector}"

  local result
  result=$(cdp text "$tabId" "$selector")
  __unwrap "$result"
}