#!/usr/bin/env bash
# Source-only library: clichatgpt

# --- Source Guard ------------------------------------------------------------

# Prevent multiple sourcing
[[ -n "${__CLICHATGPT_SOURCED+x}" ]] && return 0
__CLICHATGPT_SOURCED=1

# --- Config ---------------------------------------------------------------

# Configurable parameters (can be overridden via environment)
: "${CLICHATGPT_URL:=https://chatgpt.com/?temporary-chat=true}"

# Configurable parameters (can be overridden via environment)
readonly CLICHATGPT_WIDTH=600
readonly CLICHATGPT_HEIGHT=500
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT:=60}"
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_SLEEP:=0.5}"

# --- Public API --------------------------------------------------------------

clichatgpt_workarea() {
  [[ -n ${CLICHATGPT_BROWSER_WORKAREA+x} ]] && return

  local sl st sw sh
  read -r sl st sw sh < <(screen_workarea)

  local bw=$CLICHATGPT_WIDTH
  local bh=$CLICHATGPT_HEIGHT

  local bl=$((sl + sw - bw))
  local bt=$st

  readonly CLICHATGPT_BROWSER_WORKAREA="$bl $bt $bw $bh"
  readonly CLICHATGPT_COPY_XY="$((bl + 25)),$((bt + bh - 227))"
}

clichatgpt_browser_ensure() {
  clichatgpt_workarea

  chrome_tab_open "$CLICHATGPT_URL" || return 1
  app_activate "Terminal"

  local wl wt ww wh
  read -r wl wt ww wh < <(win_frame "Google Chrome") || return

  local bl bt bw bh
  read -r bl bt bw bh <<<"$CLICHATGPT_BROWSER_WORKAREA"

  (( wl == bl && wt == bt && ww == bw && wh == bh )) ||
    win_frame_set "Google Chrome" "$bl" "$bt" "$bw" "$bh" || return
}

clichatgpt_talk() {
  clichatgpt_browser_ensure

  local text
  text="$(cat)"

  chrome_chatgpt_input "$text" || {
    loge "failed to input prompt"
    return 1
  }

  chrome_chatgpt_submit || {
    loge "failed to submit message"
    return 1
  }

  sleep 1

  chrome_chatgpt_wait_reply_complete || {
    loge "chatgpt reply timeout (${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT}s)"
    return 1
  }
  chrome_chatgpt_scroll_last_copy_button_top

  printf '' | pbcopy
  app_activate "Google Chrome"

  local xy
  xy="$(cliclick p)"

  cliclick c:"$CLICHATGPT_COPY_XY"
  sleep 0.2

  [[ -n "$xy" ]] && cliclick m:"$xy"

  app_activate "Terminal"

  local result
  for ((i=0;i<20;i++)); do
    result="$(pbpaste)"
    [[ -n "$result" ]] && break
    sleep 0.1
  done

  if [[ -n "$result" ]]; then
    printf '%s\n' "$result"
    return 0
  fi

  loge "failed to copy reply: clipboard empty (xy=${CLICHATGPT_COPY_XY})"
  return 1
}

chrome_chatgpt_input() {
  local text="$1"

  osascript <<EOF >/dev/null
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      var e=document.querySelector('[contenteditable]');
      if(e){
        e.focus();
        e.innerText='$text';
        e.dispatchEvent(new Event('input',{bubbles:true}));
      }
    "
  end tell
end tell
EOF
}

chrome_chatgpt_submit() {
  osascript <<EOF >/dev/null
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      var b=document.querySelector('[data-testid=\"send-button\"]');
      if(b) b.click();
      true;
    "
  end tell
end tell
EOF
}

chrome_chatgpt_has_stop_button() {
  osascript <<'EOF'
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      (function(){
        var btn =
          document.querySelector('[data-testid=\"stop-button\"]') ||
          document.querySelector('button[aria-label*=\"停止\"]') ||
          document.querySelector('button[aria-label*=\"Stop\"]');

        return btn ? '1' : '0';
      })()
    "
  end tell
end tell
EOF
}


chrome_chatgpt_scroll_last_copy_button_top() {
  osascript <<'EOF' >/dev/null
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      var btns=document.querySelectorAll('[data-testid=\"copy-turn-action-button\"]');
      if(btns.length){
        var btn=btns[btns.length-1];
        btn.scrollIntoView({block:'start', inline:'nearest'});
      }
    "
  end tell
end tell
EOF
}

chrome_chatgpt_wait_reply_complete() {
  local timeout="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT"
  local sleep="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_SLEEP"
  local start=$SECONDS

  while :; do
    if [[ "$(chrome_chatgpt_has_stop_button)" == "0" ]]; then
      return 0
    fi

    (( SECONDS - start >= timeout )) && {
      loge "wait reply complete timeout (${timeout}s)"
      return 1
    }

    sleep "$sleep"
  done
}
