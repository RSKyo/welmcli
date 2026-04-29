// ========================
// CLI input commands
// ========================

import {
  mouseMove,
  mouseDown,
  mouseUp,
  click,
  doubleClick,
  mouseWheel,
  keyDown,
  keyUp,
  pressKey,
  insertText,
  pressEnter,
  pressTab,
  pressEscape,
} from '../cdp/input.js';

// input 命令注册表
// 负责“底层输入事件”这一层：
// - 鼠标移动、按下、抬起、点击、双击、滚轮
// - 键盘按下、抬起、整键发送
// - 文本输入
// - 常用快捷键：Enter / Tab / Escape
//
// 这一层偏底层，直接面向坐标和按键。
// 如果后面要做“按 selector 点击 / 输入”，更适合放到 action 层。
export const INPUT_COMMANDS = {
  move: cmd_move,
  down: cmd_down,
  up: cmd_up,
  click: cmd_click,
  dblclick: cmd_dblclick,
  wheel: cmd_wheel,
  keydown: cmd_keydown,
  keyup: cmd_keyup,
  key: cmd_key,
  text: cmd_text,
  enter: cmd_enter,
  tab: cmd_tab,
  esc: cmd_esc,
  escape: cmd_esc,
};

/**
 * 鼠标移动到指定坐标
 *
 * 用法：
 *   welm input move <targetId> <x> <y>
 *
 * 示例：
 *   welm input move ABC123 100 200
 */
async function cmd_move(args) {
  const [targetId, x, y] = args;
  await mouseMove(targetId, x, y);
}

/**
 * 在指定坐标按下鼠标
 *
 * 用法：
 *   welm input down <targetId> <x> <y>
 *
 * 示例：
 *   welm input down ABC123 100 200
 */
async function cmd_down(args) {
  const [targetId, x, y] = args;
  await mouseDown(targetId, x, y);
}

/**
 * 在指定坐标抬起鼠标
 *
 * 用法：
 *   welm input up <targetId> <x> <y>
 *
 * 示例：
 *   welm input up ABC123 100 200
 */
async function cmd_up(args) {
  const [targetId, x, y] = args;
  await mouseUp(targetId, x, y);
}

/**
 * 在指定坐标单击
 *
 * 用法：
 *   welm input click <targetId> <x> <y>
 *
 * 示例：
 *   welm input click ABC123 100 200
 */
async function cmd_click(args) {
  const [targetId, x, y] = args;
  await click(targetId, x, y);
}

/**
 * 在指定坐标双击
 *
 * 用法：
 *   welm input dblclick <targetId> <x> <y>
 *
 * 示例：
 *   welm input dblclick ABC123 100 200
 */
async function cmd_dblclick(args) {
  const [targetId, x, y] = args;
  await doubleClick(targetId, x, y);
}

/**
 * 在指定坐标发送滚轮事件
 *
 * 用法：
 *   welm input wheel <targetId> <x> <y> [deltaX] [deltaY]
 *
 * 说明：
 * - deltaX / deltaY 可选，默认 0
 * - 一般垂直滚动主要改 deltaY
 *
 * 示例：
 *   welm input wheel ABC123 100 200 0 300
 *   welm input wheel ABC123 100 200 0 -300
 */
async function cmd_wheel(args) {
  const [targetId, x, y, deltaX = 0, deltaY = 0] = args;
  await mouseWheel(targetId, x, y, deltaX, deltaY);
}

/**
 * 按下一个键，但不抬起
 *
 * 用法：
 *   welm input keydown <targetId> <key>
 *
 * 示例：
 *   welm input keydown ABC123 Shift
 *   welm input keydown ABC123 Enter
 */
async function cmd_keydown(args) {
  const [targetId, key] = args;
  await keyDown(targetId, key);
}

/**
 * 抬起一个键
 *
 * 用法：
 *   welm input keyup <targetId> <key>
 *
 * 示例：
 *   welm input keyup ABC123 Shift
 *   welm input keyup ABC123 Enter
 */
async function cmd_keyup(args) {
  const [targetId, key] = args;
  await keyUp(targetId, key);
}

/**
 * 发送一个完整按键
 *
 * 用法：
 *   welm input key <targetId> <key>
 *
 * 说明：
 * - 相当于 keydown + keyup
 *
 * 示例：
 *   welm input key ABC123 Enter
 *   welm input key ABC123 Tab
 */
async function cmd_key(args) {
  const [targetId, key] = args;
  await pressKey(targetId, key);
}

/**
 * 向当前焦点元素输入文本
 *
 * 用法：
 *   welm input text <targetId> <text...>
 *
 * 说明：
 * - targetId 之后的所有参数会重新用空格拼接成一个字符串
 * - 适合向当前已聚焦的输入框或可编辑区域写入文本
 *
 * 示例：
 *   welm input text ABC123 hello
 *   welm input text ABC123 hello world
 */
async function cmd_text(args) {
  const [targetId, ...rest] = args;
  const text = rest.join(' ');
  await insertText(targetId, text);
}

/**
 * 发送 Enter 键
 *
 * 用法：
 *   welm input enter <targetId>
 *
 * 示例：
 *   welm input enter ABC123
 */
async function cmd_enter(args) {
  const [targetId] = args;
  await pressEnter(targetId);
}

/**
 * 发送 Tab 键
 *
 * 用法：
 *   welm input tab <targetId>
 *
 * 示例：
 *   welm input tab ABC123
 */
async function cmd_tab(args) {
  const [targetId] = args;
  await pressTab(targetId);
}

/**
 * 发送 Escape 键
 *
 * 用法：
 *   welm input esc <targetId>
 *   welm input escape <targetId>
 *
 * 示例：
 *   welm input esc ABC123
 */
async function cmd_esc(args) {
  const [targetId] = args;
  await pressEscape(targetId);
}