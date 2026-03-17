#!/usr/bin/env bash
# Source-only library: macos/gui

# --- Source Guard ------------------------------------------------------------

# Prevent multiple sourcing
[[ -n "${__MACOS_GUI_SOURCED+x}" ]] && return 0
__MACOS_GUI_SOURCED=1



# --- Internal Helpers --------------------------------------------------------

__fmt() {
  # shellcheck disable=SC2059
  printf "$1\n" "${@:2}"
}

# --- Screen Script API -------------------------------------------------------

screen_workarea() {
  __osascript -l JavaScript <<<"$__SCRIPT_SCREEN_WORKAREA_JXA"
}

# --- App Script API ----------------------------------------------------------

app_front() {
  local delay="${1:-0}"
  ((delay > 0)) && sleep "$delay"

  printf '%s\n' "$__SCRIPT_APP_FRONT" | __osascript
}

app_is_running() {
  local app="${1:?app_is_running: missing app name}"
  local result

  result="$(__fmt "$__SCRIPT_APP_IS_RUNNING" "$app" | __osascript)" || return 1
  [[ "$result" == "true" ]]
}

app_activate() {
  local app="${1:?app_activate: missing app name}"

  {
    __fmt "$__SCRIPT_APP_ACTIVATE" "$app"
    __fmt "$__SCRIPT_WIN_UNMINIMIZE" "$app"
    __fmt "$__SCRIPT_WIN_FOCUS" "$app"
  } | __osascript
}

# --- Win Script API ----------------------------------------------------------

win_exists() {
  local app="${1:?win_exists: missing app}"
  local count
  count="$(win_count "$app")" || return 1
  (( count > 0 ))
}

win_count() {
  local app="${1:?win_count: missing app}"

  __fmt "$__SCRIPT_WIN_COUNT" "$app" | __osascript
}

win_focus() {
  local app="${1:?win_focus: missing app}"

  __fmt "$__SCRIPT_WIN_FOCUS" "$app" | __osascript
}

win_unminimize() {
  local app="${1:?win_unminimize: missing app name}"

  __fmt "$__SCRIPT_WIN_UNMINIMIZE" "$app" | __osascript
}

win_activate() {
  local app="${1:?win_activate: missing app name}"

  {
    __fmt "$__SCRIPT_WIN_UNMINIMIZE" "$app"
    __fmt "$__SCRIPT_WIN_FOCUS" "$app"
  } | __osascript
}

win_resize() {
  local app="${1:?missing app}"
  local w="${2:-1200}"
  local h="${3:-800}"

  __fmt "$__SCRIPT_WIN_RESIZE" "$app" "$w" "$h" | __osascript
}

win_move() {
  local app="${1:?missing app}"
  local l="${2:-0}"
  local t="${3:-0}"

  __fmt "$__SCRIPT_WIN_MOVE" "$app" "$l" "$t" | __osascript
}

win_frame() {
  local app="${1:?win_frame: missing app}"

  __fmt "$__SCRIPT_WIN_FRAME" "$app" | __osascript
}

win_frame_set() {
  local app="${1:?win_frame_set: missing app}"
  local l="${2:-0}"
  local t="${3:-0}"
  local w="${4:-1200}"
  local h="${5:-800}"

  __fmt "$__SCRIPT_WIN_FRAME_SET" "$app" "$l" "$t" "$w" "$h" | __osascript
}

win_place() {
  local app="${1:?missing app}"
  local pos="${2:?missing position}"

  local sl st sw sh
  read -r sl st sw sh <<< "$(screen_workarea)"

  local frame l t w h
  frame="$(win_frame "$app")" || return 1
  [[ -n "$frame" ]] || return 1
  read -r l t w h <<< "$frame"

  case "$pos" in
    center)
      l=$((sl + (sw - w) / 2))
      t=$((st + (sh - h) / 2))
      ;;

    left)
      l="$sl"
      t=$((st + (sh - h) / 2))
      ;;

    right)
      l=$((sl + sw - w))
      t=$((st + (sh - h) / 2))
      ;;

    top)
      l=$((sl + (sw - w) / 2))
      t="$st"
      ;;

    bottom)
      l=$((sl + (sw - w) / 2))
      t=$((st + sh - h))
      ;;

    topleft)
      l="$sl"
      t="$st"
      ;;

    topright)
      l=$((sl + sw - w))
      t="$st"
      ;;

    bottomleft)
      l="$sl"
      t=$((st + sh - h))
      ;;

    bottomright)
      l=$((sl + sw - w))
      t=$((st + sh - h))
      ;;

    left-half)
      l="$sl"
      t="$st"
      w=$((sw / 2))
      h="$sh"
      ;;

    right-half)
      l=$((sl + sw / 2))
      t="$st"
      w=$((sw / 2))
      h="$sh"
      ;;

    top-half)
      l="$sl"
      t="$st"
      w="$sw"
      h=$((sh / 2))
      ;;

    bottom-half)
      l="$sl"
      t=$((st + sh / 2))
      w="$sw"
      h=$((sh / 2))
      ;;

    fullscreen)
      l="$sl"
      t="$st"
      w="$sw"
      h="$sh"
      ;;

    *)
      printf 'invalid position: %s\n' "$pos" >&2
      return 1
      ;;
  esac

  win_frame_set "$app" "$l" "$t" "$w" "$h"
}
