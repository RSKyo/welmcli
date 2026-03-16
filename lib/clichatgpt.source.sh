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
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT:=60}"
: "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_SLEEP:=0.5}"

# --- Public API --------------------------------------------------------------

clichatgpt_talk() {
  chrome_tab_open "$CLICHATGPT_URL" || return 1
  app_activate "Terminal"

  local text

  if [[ $# -gt 0 ]]; then
    text="$*"
  else
    text="$(cat)"
  fi

  # 输入
  chrome_chatgpt_input "$text" || {
    loge "failed to input prompt"
    return 1
  }

  # 提交
  chrome_chatgpt_submit || {
    loge "failed to submit message"
    return 1
  }
  sleep 1

  # 等待回复
  chrome_chatgpt_wait_reply_complete || {
    loge "chatgpt reply timeout (${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT}s)"
    return 1
  }
  # 将 copy button 滚动到顶部
  chrome_chatgpt_scroll_copy_button

  # 激活 chrome
  app_activate "Google Chrome"
  

  local old_p old_pbpaste
  old_p="$(cliclick p)"
  old_pbpaste="$(pbpaste)"
  printf '' | pbcopy

  # 计算 copy button 位置
  local copy_button_xy
  copy_button_xy="$(chrome_chatgpt_locate_copy_button_screen)" || return 1
  
  # 点击 copy button
  cliclick c:"$copy_button_xy"
  sleep 0.2

  cliclick m:"$old_p"

  app_activate "Terminal"

  local result deadline=$((SECONDS+2))
  while ((SECONDS < deadline)); do
    result="$(pbpaste)"
    [[ -n "$result" ]] && break
    sleep 0.05
  done

  printf "$old_pbpaste" | pbcopy

  if [[ -n "$result" ]]; then
    printf '%s\n' "$result"
    return 0
  fi

  loge "copy failed: clipboard empty (xy=$copy_button_xy)"
  return 1
}

chrome_chatgpt_input() {
  local text="$1"

  js_escape() {
    local s="$1"
    s=${s//\\/\\\\}
    s=${s//\'/\\\'}
    s=${s//$'\n'/\\n}
    s=${s//$'\r'/\\r}
    s=${s//$'\t'/\\t}
    printf '%s' "$s"
  }

  text="$(js_escape "$text")"

  local encoded

  encoded="$(printf '%s' "$text" | base64)"

  osascript <<EOF >/dev/null
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      (function(){
        var e=document.querySelector('[contenteditable]');
        if(!e) return;

        e.focus();
        e.innerText='$text';
        e.dispatchEvent(new Event('input',{bubbles:true}));
      })();
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
          document.querySelector('button[aria-label*=\"Stop\"]') ||
          document.querySelector('button svg[data-icon=\"stop\"]');

        return btn ? '1' : '0';
      })()
    "
  end tell
end tell
EOF
}

chrome_chatgpt_scroll_copy_button() {
  osascript <<'EOF' >/dev/null
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      var btns=document.querySelectorAll('[data-testid=\"copy-turn-action-button\"]');
      if(btns.length){
        var btn=btns[btns.length-1];
        btn.scrollIntoView({behavior:'instant', block:'start'});
        window.scrollBy(0,-40);
      }
    "
  end tell
end tell
EOF
}

chrome_chatgpt_locate_copy_button() {
  osascript <<'EOF'
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "
      (function(){
        var btns = document.querySelectorAll('[data-testid=\"copy-turn-action-button\"]');
        if(!btns.length) return '';

        var btn = btns[btns.length-1];
        var r = btn.getBoundingClientRect();

        var x = Math.round(r.left + r.width/2);
        var y = Math.round(window.innerHeight - (r.top + r.height/2));

        return x + ',' + y;
      })();
    "
  end tell
end tell
EOF
}

chrome_chatgpt_locate_copy_button_screen() {
  local bx by
  IFS=, read -r bx by < <(chrome_chatgpt_locate_copy_button) || return 1

  local wl wt ww wh
  read -r wl wt ww wh < <(win_frame "Google Chrome") || return 1

  printf '%s\n' "$((wl + bx)),$((wt + wh - by))"
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
