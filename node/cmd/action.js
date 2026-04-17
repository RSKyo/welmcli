import { toBool } from '../infra/core.js'
import {
  click,
  type,
  press,
  scrollIntoView,
  getText,
  getHtml,
} from '../cdp/action.js';

// action 命令注册表
// 负责“高阶元素动作”这一层：
// - 点击元素
// - 向元素输入文本
// - 发送按键
// - 滚动到元素
// - 获取元素文本
// - 获取元素 HTML
export const ACTION_COMMANDS = {
  click: cmd_click,
  type: cmd_type,
  press: cmd_press,
  scroll: cmd_scroll,
  text: cmd_text,
  html: cmd_html,
};

/**
 * action click <targetId> <selector>
 *
 * 点击元素。
 *
 * 默认流程：
 * - 等元素可点击
 * - 滚动到元素
 * - 点击元素中心点
 *
 * 适用场景：
 * - 点按钮
 * - 点链接
 * - 点复选框、单选框等可点击元素
 *
 * 示例：
 *   welm action click <targetId> '#submit'
 *   welm action click <targetId> '.login-button'
 */
export async function cmd_click(args = []) {
  const [targetId, selector] = args;
  return await click(targetId, selector);
}

/**
 * action type <targetId> <selector> <text> [clear]
 *
 * 向元素输入文本。
 *
 * 参数：
 * - clear 可选，true / false，默认 false
 *   true 表示输入前先清空
 *
 * 默认流程：
 * - 等元素可见
 * - 滚动到元素
 * - focus
 * - 可选清空
 * - 输入文本
 *
 * 适用场景：
 * - 输入用户名
 * - 输入密码
 * - 输入搜索词
 * - 向 contenteditable 区域写入文本
 *
 * 示例：
 *   welm action type <targetId> '#username' 'alice'
 *   welm action type <targetId> '#username' 'alice' true
 */
export async function cmd_type(args = []) {
  const [targetId, selector, text, clear] = args;
  return await type(targetId, selector, text, {
    clear: toBool(clear, false),
  });
}

/**
 * action press <targetId> <key>
 *
 * 向当前聚焦元素发送按键。
 *
 * 常见 key：
 * - Enter
 * - Tab
 * - Escape
 * - Backspace
 * - Delete
 * - ArrowLeft
 * - ArrowRight
 * - ArrowUp
 * - ArrowDown
 * - Space
 *
 * 适用场景：
 * - 输入后回车提交
 * - tab 切换焦点
 * - 关闭弹层
 * - 键盘导航
 *
 * 示例：
 *   welm action press <targetId> Enter
 *   welm action press <targetId> Tab
 */
export async function cmd_press(args = []) {
  const [targetId, key] = args;
  return await press(targetId, key);
}

/**
 * action scroll <targetId> <selector>
 *
 * 滚动到元素进入视口。
 *
 * 默认行为：
 * - 等 selector 出现
 * - 调用 scrollIntoView
 *
 * 适用场景：
 * - 元素在可视区外，先滚过去
 * - 配合 click / text / html 使用
 *
 * 示例：
 *   welm action scroll <targetId> '.footer'
 *   welm action scroll <targetId> '#submit'
 */
export async function cmd_scroll(args = []) {
  const [targetId, selector] = args;
  return await scrollIntoView(targetId, selector);
}

/**
 * action text <targetId> <selector> [useTextContent]
 *
 * 获取元素文本。
 *
 * 参数：
 * - useTextContent 可选，true / false，默认 false
 *   false 时返回 innerText
 *   true 时返回 textContent
 *
 * 适用场景：
 * - 读取标题文本
 * - 读取按钮文字
 * - 读取状态提示
 *
 * 示例：
 *   welm action text <targetId> '.title'
 *   welm action text <targetId> '.title' true
 */
export async function cmd_text(args = []) {
  const [targetId, selector, useTextContent] = args;
  return await getText(targetId, selector, {
    useTextContent: toBool(useTextContent, false),
  });
}

/**
 * action html <targetId> <selector> [inner]
 *
 * 获取元素 html。
 *
 * 参数：
 * - inner 可选，true / false，默认 false
 *   false 时返回 outerHTML
 *   true 时返回 innerHTML
 *
 * 适用场景：
 * - 查看某个节点本身及其子树
 * - 只取节点内部内容
 *
 * 示例：
 *   welm action html <targetId> '#app'
 *   welm action html <targetId> '#app' true
 */
export async function cmd_html(args = []) {
  const [targetId, selector, inner] = args;
  return await getHtml(targetId, selector, {
    inner: toBool(inner, false),
  });
}
