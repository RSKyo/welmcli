#!/usr/bin/env bash
# Source-only library: clichatgpt

# --- Source Guard ------------------------------------------------------------

# Prevent multiple sourcing
[[ -n "${__CHATGPT_SOURCED+x}" ]] && return 0
__CHATGPT_SOURCED=1

# --- Config ---------------------------------------------------------------

# Configurable parameters (can be overridden via environment)
: "${DATA_DIR:="${HOME}/.local/share/welmcli"}"

: "${CHATGPT_URL:=https://chatgpt.com/?temporary-chat=true}"
: "${CHATGPT_REPLY_FILE_NAME:="$(date '+%Y%m%d_%H%M%S')_reply"}"

# Configurable parameters (can be overridden via environment)
# : "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT:=60}"
# : "${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_SLEEP:=0.5}"


# --- Public API --------------------------------------------------------------

chatgpt_talk() {

  chrome_debug_ensure || return 1

  log "xxxxx"
  # local tab_id
  # tab_id="$(cdp_find_tab_id 'chatgpt.com')"

  # local input
  # input="$(cdp_text "$tab_id" '[contenteditable]')"
  # log clichatgpt "$input"







  # chrome_tab_open "$CHATGPT_URL" || return 1
  # sleep 0.1
  # app_activate "Terminal"

  # local text

  # if [[ $# -gt 0 ]]; then
  #   text="$*"
  # else
  #   text="$(cat)"
  # fi

  # # 输入
  # chrome_chatgpt_input "$text" || {
  #   loge "failed to input prompt"
  #   return 1
  # }

  # # 提交
  # chrome_chatgpt_submit || {
  #   loge "failed to submit message"
  #   return 1
  # }
  # sleep 1

  # # 等待回复
  # chrome_chatgpt_wait_reply_complete || {
  #   loge "chatgpt reply timeout (${CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT}s)"
  #   return 1
  # }
  # # 将 copy button 滚动到顶部
  # chrome_chatgpt_scroll_copy_button

  # # 激活 chrome
  # app_activate "Google Chrome"
  
  #   # 保存快照
  # clichatgpt_snapshot

  # # 复制
  # clichatgpt_copy || {
  #   loge "failed to copy reply"
  #   return 1
  # }

  # # 获取回复
  # local reply
  # reply="$(clichatgpt_get_reply)"

  # # 从快照中恢复
  # clichatgpt_restore

  # app_activate "Terminal"

  # if [[ -n "$reply" ]]; then
  #   printf '%s\n' "$reply"
  #   return 0
  # else
  #   loge "copy failed: clipboard empty"
  #   return 1
  # fi
}

# clichatgpt_snapshot() {
#   __clichatgpt_state_pbpaste="$(pbpaste)"
#   __clichatgpt_state_p="$(cliclick p)"
#   pbcopy </dev/null
# }

# clichatgpt_restore() {
#   [[ -n "${__clichatgpt_state_pbpaste+x}" ]] || return 0
#   printf '%s' "$__clichatgpt_state_pbpaste" | pbcopy
#   cliclick m:"$__clichatgpt_state_p"
# }

# clichatgpt_copy() {
#   local copy_button_xy
#   copy_button_xy="$(chrome_chatgpt_locate_copy_button_screen)" || return 1

#   cliclick c:"$copy_button_xy"
#   sleep 0.2
# }

# clichatgpt_get_reply() {
#   local reply deadline=$((SECONDS+2))

#   while ((SECONDS < deadline)); do
#     reply="$(pbpaste)"
#     if [[ -n "$reply" ]]; then
#       printf '%s' "$reply"
#       return 0
#     fi
#     sleep 0.05
#   done

#   return 1
# }

# clichatgpt_reply_filename() {
#   local input="${1:-}"
#   local prefix text

#   # 1️⃣ 取前 20 个字符（UTF-8 安全）
#   text="$(printf '%s' "$input" | cut -c1-20)"

#   # 2️⃣ 去换行
#   text="${text//$'\n'/ }"

#   # 3️⃣ 替换非法文件名字符
#   # macOS / Linux 常见非法字符
#   text="${text//\//_}"
#   text="${text//:/_}"
#   text="${text//\*/_}"
#   text="${text//\?/_}"
#   text="${text//\"/_}"
#   text="${text//</_}"
#   text="${text//>/_}"
#   text="${text//|/_}"

#   # 4️⃣ 压缩多余空格
#   text="$(printf '%s' "$text" | tr -s ' ')"

#   # 5️⃣ 去首尾空格
#   text="${text#"${text%%[! ]*}"}"
#   text="${text%"${text##*[! ]}"}"

#   # 6️⃣ 防止为空
#   [[ -z "$text" ]] && text="reply"

#   # 7️⃣ 组合
#   printf '%s_%s\n' "$(date '+%Y%m%d_%H%M%S')" "$text"
# }
  

# chrome_chatgpt_input() {
#   local text="$1"

#   js_escape() {
#     local s="$1"
#     s=${s//\\/\\\\}
#     s=${s//\'/\\\'}
#     s=${s//$'\n'/\\n}
#     s=${s//$'\r'/\\r}
#     s=${s//$'\t'/\\t}
#     printf '%s' "$s"
#   }

#   text="$(js_escape "$text")"


#   osascript <<EOF >/dev/null
# tell application "Google Chrome"
#   tell active tab of front window
#     execute javascript "
#       (function(){
#         var e=document.querySelector('[contenteditable]');
#         if(!e) return;

#         e.focus();
#         e.innerText='$text';
#         e.dispatchEvent(new Event('input',{bubbles:true}));
#       })();
#     "
#   end tell
# end tell
# EOF
# }

# chrome_chatgpt_submit() {
#   osascript <<EOF >/dev/null
# tell application "Google Chrome"
#   tell active tab of front window
#     execute javascript "
#       var b=document.querySelector('[data-testid=\"send-button\"]');
#       if(b) b.click();
#       true;
#     "
#   end tell
# end tell
# EOF
# }

# chrome_chatgpt_has_stop_button() {
#   osascript <<'EOF'
# tell application "Google Chrome"
#   tell active tab of front window
#     execute javascript "
#       (function(){
#         var btn =
#           document.querySelector('[data-testid=\"stop-button\"]') ||
#           document.querySelector('button[aria-label*=\"停止\"]') ||
#           document.querySelector('button[aria-label*=\"Stop\"]') ||
#           document.querySelector('button svg[data-icon=\"stop\"]');

#         return btn ? '1' : '0';
#       })()
#     "
#   end tell
# end tell
# EOF
# }

# chrome_chatgpt_scroll_copy_button() {
#   osascript <<'EOF' >/dev/null
# tell application "Google Chrome"
#   tell active tab of front window
#     execute javascript "
#       var btns=document.querySelectorAll('[data-testid=\"copy-turn-action-button\"]');
#       if(btns.length){
#         var btn=btns[btns.length-1];
#         btn.scrollIntoView({behavior:'instant', block:'start'});
#         window.scrollBy(0,-40);
#       }
#     "
#   end tell
# end tell
# EOF
# }

# chrome_chatgpt_locate_copy_button() {
#   osascript <<'EOF'
# tell application "Google Chrome"
#   tell active tab of front window
#     execute javascript "
#       (function(){
#         var btns = document.querySelectorAll('[data-testid=\"copy-turn-action-button\"]');
#         if(!btns.length) return '';

#         var btn = btns[btns.length-1];
#         var r = btn.getBoundingClientRect();

#         var x = Math.round(r.left + r.width/2);
#         var y = Math.round(window.innerHeight - (r.top + r.height/2));

#         return x + ',' + y;
#       })();
#     "
#   end tell
# end tell
# EOF
# }

# chrome_chatgpt_locate_copy_button_screen() {
#   local bx by
#   IFS=, read -r bx by < <(chrome_chatgpt_locate_copy_button) || return 1

#   local wl wt ww wh
#   read -r wl wt ww wh < <(win_frame "Google Chrome") || return 1

#   printf '%s\n' "$((wl + bx)),$((wt + wh - by))"
# }

# chrome_chatgpt_wait_reply_complete() {
#   local timeout="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_TIMEOUT"
#   local sleep="$CLICHATGPT_CHROME_CHATGPT_WAIT_REPLY_COMPLETE_SLEEP"
#   local start=$SECONDS

#   while :; do
#     if [[ "$(chrome_chatgpt_has_stop_button)" == "0" ]]; then
#       return 0
#     fi

#     (( SECONDS - start >= timeout )) && {
#       loge "wait reply complete timeout (${timeout}s)"
#       return 1
#     }

#     sleep "$sleep"
#   done
# }
