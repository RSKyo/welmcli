#!/usr/bin/env bash
# Source-only library: macos/osascript

# --- Source Guard ------------------------------------------------------------

# Prevent multiple sourcing
[[ -n "${__MACOS_SCRIPT_SOURCED+x}" ]] && return 0
__MACOS_SCRIPT_SOURCED=1

# --- Internal Helpers --------------------------------------------------------

__fmt() {
  # shellcheck disable=SC2059
  printf "$1\n" "${@:2}"
}

__osascript() {
  osascript
}

# --- Screen Script Templates -------------------------------------------------

readonly __SCRIPT_SCREEN_WORKAREA_JXA=\
'ObjC.import("AppKit")

function run() {
  const screen = $.NSScreen.mainScreen
  const frame = screen.frame
  const visible = screen.visibleFrame

  const x = Math.round(visible.origin.x)
  const y = Math.round(frame.size.height - visible.origin.y - visible.size.height)
  const w = Math.round(visible.size.width)
  const h = Math.round(visible.size.height)

  return [x, y, w, h].join(" ")
}'

# --- App Script Templates ----------------------------------------------------

readonly __SCRIPT_APP_FRONT=\
'tell application "System Events"
  name of first process whose frontmost is true
end tell'

# args: $1=app
readonly __SCRIPT_APP_IS_RUNNING=\
'tell application "System Events"
  return (exists process "%s")
end tell'

# args: $1=app
readonly __SCRIPT_APP_ACTIVATE=\
'tell application "%s" to activate'

# --- Win Script Templates ----------------------------------------------------

# args: $1=app
readonly __SCRIPT_WIN_COUNT=\
'tell application "System Events"
  tell process "%s"
    return (count of windows)
  end tell
end tell'

# args: $1=app
readonly __SCRIPT_WIN_FOCUS=\
'tell application "System Events"
  tell process "%s"
    if (count of windows) is 0 then return
    set frontmost to true
  end tell
end tell'

# args: $1=app
readonly __SCRIPT_WIN_UNMINIMIZE=\
'tell application "System Events"
  tell process "%s"
    try
      if (count of windows) > 0 then
        tell window 1
          if value of attribute "AXMinimized" then
            set value of attribute "AXMinimized" to false
          end if
        end tell
      end if
    end try
  end tell
end tell'

# args: $1=app $2=w $3=h
readonly __SCRIPT_WIN_RESIZE=\
'tell application "System Events"
  tell process "%s"
    if (count of windows) is 0 then return
    set size of front window to {%s, %s}
  end tell
end tell'

# args: $1=app $2=l $3=t
readonly __SCRIPT_WIN_MOVE=\
'tell application "System Events"
  tell process "%s"
    if (count of windows) is 0 then return
    set position of front window to {%s, %s}
  end tell
end tell'

# args: $1=app
readonly __SCRIPT_WIN_FRAME=\
'tell application "System Events"
  tell process "%s"
    if (count of windows) is 0 then return ""
    set {x, y} to position of front window
    set {w, h} to size of front window
    set oldDelims to AppleScript'\''s text item delimiters
    set AppleScript'\''s text item delimiters to " "
    set resultText to {x, y, w, h} as text
    set AppleScript'\''s text item delimiters to oldDelims
    return resultText
  end tell
end tell'

# args: $1=app $2=l $3=t $4=w $5=h
readonly __SCRIPT_WIN_FRAME_SET=\
'tell application "System Events"
  tell process "%s"
    if (count of windows) = 0 then return
    set position of front window to {%s, %s}
    set size of front window to {%s, %s}
  end tell
end tell'