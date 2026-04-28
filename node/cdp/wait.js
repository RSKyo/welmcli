import { getClient } from './client.js';
import { requireArg, requireEmitter } from './assert.js';
import { okResult, failResult, evaluate } from './runtime.js';
import { ensurePositiveNumber, sleep } from '../infra/core.js';

/**
 * 等待相关能力。
 *
 * 这一层负责统一封装：
 * - 轮询等待
 * - 页面事件等待
 * - 元素与文本状态等待
 *
 * 对外提供：
 * - 等元素出现、可见、可点击
 * - 等文本满足条件
 * - 等 JS 条件成立
 * - 等导航、DOMContentLoaded、load
 */

/**
 * 判断轮询结果是否命中。
 */
function isPollMatched(value) {
  if (typeof value === 'boolean') {
    return value === true;
  }

  if (typeof value === 'string') {
    return value !== '';
  }

  return false;
}

/**
 * 轮询执行表达式，直到命中或超时。
 */
async function poll(targetId, expression, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(expression, 'missing expression');

  const timeout = ensurePositiveNumber(options.timeout, 10000);
  const interval = ensurePositiveNumber(options.interval, 200);

  const start = Date.now();
  let result;

  while (Date.now() - start < timeout) {
    // {ok: true, value: true|false|text|'',} 
    // {ok: false, error,}
    // success: ok=true, value=true|text
    // failed: ok=true, value=false|''
    // failed: ok=false, error
    result = await evaluate(targetId, expression);

    if (result.ok === true && isPollMatched(result.value)) {
      return result;
    }

    await sleep(interval);
  }

  return failResult(result.error ?? result.value, result);
}

/**
 * 等 selector 对应元素出现。
 */
export function waitSelector(targetId, selector, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      return !!el;
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等元素可见。
 */
export function waitVisible(targetId, selector, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0
      );
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等元素可点击。
 */
export function waitClickable(targetId, selector, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        style.pointerEvents !== 'none' &&
        rect.width > 0 &&
        rect.height > 0;

      const enabled =
        !el.disabled &&
        el.getAttribute('aria-disabled') !== 'true';

      return visible && enabled;
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等元素文本满足条件。
 */
function waitTextByMode(targetId, selector, expectedText, mode, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');
  requireArg(expectedText, 'missing expectedText');

  const expected = String(expectedText);

  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const text = (el.innerText ?? el.textContent ?? '').trim();
      const mode = ${JSON.stringify(mode)};
      const expected = ${JSON.stringify(expected)};

      if (mode === 'equals') {
        return text === expected ? text : '';
      }

      if (mode === 'regex') {
        const re = new RegExp(expected);
        return re.test(text) ? text : '';
      }

      return text.includes(expected) ? text : '';
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等元素文本包含
 */
export function waitTextIncludes(targetId, selector, expectedText, options = {}) {
  return waitTextByMode(targetId, selector, expectedText, 'includes', options);
}

/**
 * 等元素文本一致
 */
export function waitTextEquals(targetId, selector, expectedText, options = {}) {
  return waitTextByMode(targetId, selector, expectedText, 'equals', options);
}

/**
 * 等元素文本正则匹配
 */
export function waitTextRegex(targetId, selector, expectedText, options = {}) {
  return waitTextByMode(targetId, selector, expectedText, 'regex', options);
}

export function waitText(targetId, selector, expectedText, options = {}) {
  return waitTextByMode(targetId, selector, expectedText, options.mode || 'includes', options);
}

/**
 * 等某个 JS 表达式成立。
 */
export async function waitCondition(targetId, expression, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(expression, 'missing expression');

  return poll(targetId, expression, options);
}

export const waitFunction = waitCondition;

/**
 * 等一次事件触发。
 */
function waitPageEvent(targetId, emitter, eventName, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(eventName, 'missing eventName');
  requireEmitter(emitter);

  const timeout = ensurePositiveNumber(options.timeout, 10000);
  
  return new Promise(resolve => {
    let settled = false;

    const timer = setTimeout(() => {
      finish(failResult(`${eventName} wait timeout`));
    }, timeout);

    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      emitter.off(eventName, eventHandler);
      resolve(result);
    }

    function eventHandler(...args) {
      finish(okResult(args.length <= 1 ? args[0] : args));
    }

    emitter.on(eventName, eventHandler);
  });
}

/**
 * 等发生一次主导航
 *
 * 这里监听 Page.frameNavigated，
 * 适合判断“页面已经跳到新文档”。
 * 它不表示 DOM 或资源已经加载完成；
 * 如果后续还要操作页面，通常应继续 waitDom 或 waitLoad。
 */
export async function waitNavigation(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(targetId, Page, 'frameNavigated', options);
}

/**
 * 等 DOMContentLoaded
 *
 * 这里监听 Page.domContentEventFired，
 * 表示初始 HTML 已解析完成，DOM 已基本可用。
 * 它通常早于 load，适合尽早开始查找或操作元素；
 * 但图片、样式等资源不一定已经加载完。
 */
export async function waitDom(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(targetId, Page, 'domContentEventFired', options);
}

/**
 * 等 load 事件
 *
 * 这里监听 Page.loadEventFired，
 * 表示页面进入更完整的加载阶段。
 * 它通常晚于 DOMContentLoaded，适合在依赖样式、
 * 图片或其他资源时再继续后续操作。
 */
export async function waitLoad(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(targetId, Page, 'loadEventFired', options);
}
