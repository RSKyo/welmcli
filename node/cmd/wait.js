import { toInt } from '../infra/core.js'
import {
  waitSelector,
  waitVisible,
  waitClickable,
  waitText,
  waitFunction,
  waitNavigation,
  waitLoad,
  waitDom,
} from '../cdp/wait.js';

// wait 命令注册表
// 负责“等待编排”这一层：
// - 等 selector 出现
// - 等元素可见
// - 等元素可点击
// - 等文本满足条件
// - 等 JS 条件成立
// - 等导航事件
// - 等页面 load 完成
// - 等 DOMContentLoaded 完成
export const WAIT_COMMANDS = {
  selector: cmd_selector,
  visible: cmd_visible,
  clickable: cmd_clickable,
  text: cmd_text,
  fn: cmd_fn,
  nav: cmd_nav,
  load: cmd_load,
  dom: cmd_dom,
};

function getWaitOptions(timeout, interval) {
  return {
    timeout: timeout == null ? 10000 : toInt(timeout, 'timeout'),
    interval: interval == null ? 200 : toInt(interval, 'interval'),
  };
}

/**
 * wait selector <targetId> <selector> [timeout] [interval]
 *
 * 等 selector 出现。
 */
export async function cmd_selector(ctx) {
  const { args, options } = ctx;
  const [targetId, selector] = args;
  const timeout = Number(options.timeout ?? 10000);
  const interval = Number(options.interval ?? 200);

  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!selector) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }

  return await waitSelector(targetId, selector, getWaitOptions(timeout, interval));
}

/**
 * wait visible <targetId> <selector> [timeout] [interval]
 *
 * 等元素可见。
 */
export async function cmd_visible(args = []) {
  const [targetId, selector, timeout, interval] = args;

  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!selector) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }

  return await waitVisible(targetId, selector, getWaitOptions(timeout, interval));
}

/**
 * wait clickable <targetId> <selector> [timeout] [interval]
 *
 * 等元素可点击。
 */
export async function cmd_clickable(args = []) {
  const [targetId, selector, timeout, interval] = args;

  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!selector) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }

  return await waitClickable(targetId, selector, getWaitOptions(timeout, interval));
}

/**
 * wait text <targetId> <selector> <expectedText> [mode] [timeout] [interval]
 *
 * mode:
 * - includes
 * - equals
 * - regex
 */
export async function cmd_text(args = []) {
  const [targetId, selector, expectedText, mode, timeout, interval] = args;

  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!selector) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }

  if (expectedText == null || expectedText === '') {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing expectedText');
  }

  return await waitText(targetId, selector, expectedText, {
    mode: mode || 'includes',
    ...getWaitOptions(timeout, interval),
  });
}

/**
 * wait fn <targetId> <expression> [timeout] [interval]
 *
 * 等 JS 条件成立。
 *
 * expression 示例：
 *   document.readyState === 'complete'
 *   !!document.querySelector('#app')
 *   window.__done === true
 */
export async function cmd_fn(args = []) {
  const [targetId, expression, timeout, interval] = args;

  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!expression) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing expression');
  }

  return await waitFunction(targetId, expression, getWaitOptions(timeout, interval));
}

/**
 * wait nav <targetId> [timeout]
 *
 * 等导航事件发生。
 */
export async function cmd_nav(args = []) {
  const [targetId, timeout] = args;

  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await waitNavigation(targetId, {
    timeout: timeout == null ? 10000 : toInt(timeout, 'timeout'),
  });
}

/**
 * wait load <targetId> [timeout]
 *
 * 等 load 事件。
 */
export async function cmd_load(args = []) {
  const [targetId, timeout] = args;

  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await waitLoad(targetId, {
    timeout: timeout == null ? 10000 : toInt(timeout, 'timeout'),
  });
}

/**
 * wait dom <targetId> [timeout]
 *
 * 等 DOMContentLoaded。
 */
export async function cmd_dom(args = []) {
  const [targetId, timeout] = args;

  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await waitDom(targetId, {
    timeout: timeout == null ? 10000 : toInt(timeout, 'timeout'),
  });
}
