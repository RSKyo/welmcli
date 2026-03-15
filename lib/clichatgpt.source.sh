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
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_TIMEOUT:=10}"
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_SLEEP:=0.2}"
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT:=60}"
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_SLEEP:=1}"
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_THRESHOLD:=2}"

# --- Public API --------------------------------------------------------------

clichatgpt_talk() {
  local text
  text="$(cat)"

  chrome_tab_open "$CLICHATGPT_URL" || return 1
  app_activate "Google Chrome"

  local old_num
  old_num="$(chrome_chatgpt_reply_num)" || return 1

  chrome_chatgpt_input "$text" || return 1
  chrome_chatgpt_submit || return 1

  chrome_chatgpt_wait_reply "$old_num" || return 1
  chrome_chatgpt_wait_reply_complete || return 1

  chrome_chatgpt_last_reply
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

chrome_chatgpt_last_reply() {
  osascript <<'EOF'
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      var m=document.querySelectorAll('[data-message-author-role=\"assistant\"]');
      if(m.length){
        m[m.length-1].scrollIntoView({block:'end'});
        m[m.length-1].innerText;
      }
    "
  end tell
end tell
EOF
}

chrome_chatgpt_reply_num() {
  osascript <<'EOF'
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      document.querySelectorAll('[data-message-author-role=\"assistant\"]').length
    "
  end tell
end tell
EOF
}

chrome_chatgpt_wait_reply() {
  local old_num="$1"
  local timeout="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_TIMEOUT"
  local sleep="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_SLEEP"
  local num
  local start=$SECONDS

  while :; do
    num="$(chrome_chatgpt_reply_num)" || num=

    if [[ -n "$num" && "$num" -gt "$old_num" ]]; then
      return 0
    fi

    if(( SECONDS - start >= timeout )); then
      loge "wait reply timeout (${timeout}s)"
     return 1
    fi

    sleep "$sleep"
  done
}

chrome_chatgpt_wait_reply_complete() {
  local threshold="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_THRESHOLD"
  local timeout="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT"
  local sleep="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_SLEEP"
  local reply prev_reply=""
  local stable=0
  local start=$SECONDS

  while :; do
    reply="$(chrome_chatgpt_last_reply)" || reply=""

    if [[ -n "$reply" && "$reply" == "$prev_reply" ]]; then
      (( stable++ ))
      (( stable >= threshold )) && return 0
    else
      stable=0
      prev_reply="$reply"
    fi

    if(( SECONDS - start >= timeout )); then
      loge "wait reply complete timeout (${timeout}s)"
      return 1
    fi

    sleep "$sleep"
  done
}