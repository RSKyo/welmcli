import { getClient } from './client.js';
import { requireArg } from './assert.js';
import { buildStructuredExpression, evaluate } from './runtime.js';
import { ERROR_CODE, CliError } from '../infra/protocol.js';

/**
 * Wait 能力说明
 *
 * 这一层不是单一 CDP 域，而是“编排层”：
 * - Page 负责页面生命周期事件
 * - Runtime 负责执行 JS 条件判断
 * - 轮询、超时、间隔、错误语义，由这里统一处理
 *
 * 这一层专门解决：
 * - 等 selector 出现
 * - 等元素可见
 * - 等元素可点击
 * - 等文本变化
 * - 等某个 JS 条件成立
 * - 等导航完成
 */

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isPollMatched(value) {
  if (typeof value === 'boolean') {
    return value === true;
  }

  if (typeof value === 'string') {
    return value !== '';
  }

  return false;
}

async function poll(targetId, source, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(source, 'missing source');

  const timeout = options.timeout ?? 10000;
  const interval = options.interval ?? 200;
  const start = Date.now();
  let result;
  
  const expression = buildStructuredExpression(source);

  while (Date.now() - start < timeout) {
    // {ok: true, value: true|false|text|'',} 
    // {ok: false, error,}
    // success: ok=true, value=true|text
    // failed: ok=true, value=false|''
    // failed: ok=false, error
    result = await evaluate(targetId, expression);

    if (result.ok === true && isPollMatched(result.value)) {
      return {
        ...result,
        timeout,
        interval,
        elapsed: Date.now() - start,
      };
    }

    await sleep(interval);
  }

  return {
    ok: false,
    error: result?.error ?? 'condition not matched',
    timeout,
    interval,
    elapsed: Date.now() - start,
  };
}

/**
 * 等 selector 出现
 */
export async function waitSelector(targetId, selector, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const source = `
    () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      return !!el;
    }
  `;

  return poll(targetId, 'selector', source, options);
}

/**
 * 等元素可见
 */
export async function waitVisible(targetId, selector, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const expression = buildStructuredExpression(`
    () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0;

      return visible;
    }
  `);

  return poll(targetId, 'visible', async () => {
    return evaluate(targetId, expression);
  }, options);
}

/**
 * 等元素可点击
 *
 * 这里的“可点击”定义为：
 * - 元素存在
 * - 可见
 * - 未 disabled
 * - pointer-events 不是 none
 *
 * 这是工程上的可用定义，不是浏览器规范中的官方状态。
 */
export async function waitClickable(targetId, selector, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const expression = buildStructuredExpression(`
    () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style &&
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
    }
  `);

  return poll(targetId, 'clickable', async () => {
    return evaluate(targetId, expression);
  }, options);
}

/**
 * 等 selector 对应元素的文本满足条件
 *
 * options:
 * - mode: includes | equals | regex
 */
export async function waitText(targetId, selector, expectedText, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');
  requireArg(expectedText, 'missing expectedText');

  const mode = options.mode || 'includes';
  const expected = String(expectedText);

  const expression = buildStructuredExpression(`
    () => {
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
    }
  `);

  return poll(targetId, 'text', async () => {
    return evaluate(targetId, expression);
  }, options);
}

/**
 * 等某个 JS 条件成立
 *
 * expression 应该返回 truthy / falsy。
 */
export async function waitFunction(targetId, expression, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(expression, 'missing expression');

  const wrapped = buildStructuredExpression(`
    () => {
      return (${expression});
    }
  `);

  return poll(targetId, 'function', async () => {
    return evaluate(targetId, wrapped);
  }, options);
}

async function waitPageEvent(targetId, name, subscribe, options = {}) {
  requireArg(targetId, 'missing targetId');

  const timeout = options.timeout ?? 10000;

  return new Promise((resolve, reject) => {
    let settled = false;
    let off = null;

    const timer = setTimeout(() => {
      cleanup();
      reject(new CliError(
        ERROR_CODE.TIMEOUT,
        `wait timeout: ${name}`,
        { name, timeout },
      ));
    }, timeout);

    function cleanup() {
      clearTimeout(timer);

      if (typeof off === 'function') {
        const fn = off;
        off = null;
        fn();
      }
    }

    function resolveOnce(value) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        ok: true,
        name,
        value,
      });
    }

    function rejectOnce(error) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    }

    Promise.resolve()
      .then(() => subscribe(resolveOnce))
      .then(unsub => {
        off = unsub;
      })
      .catch(rejectOnce);
  });
}

/**
 * 等导航完成
 *
 * 这里用 Page.frameNavigated 监听主导航，适合“等发生一次导航”。
 * 真正要等页面资源加载完，通常还应继续 waitLoad。
 */
export async function waitNavigation(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(
    targetId,
    'navigation',
    (done) => Page.frameNavigated((params) => {
      done(params ?? null);
    }),
    options,
  );
}

/**
 * 等 load 事件
 */
export async function waitLoad(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(
    targetId,
    'load',
    (done) => Page.loadEventFired((params) => {
      done(params ?? null);
    }),
    options,
  );
}

/**
 * 等 DOMContentLoaded
 */
export async function waitDom(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(
    targetId,
    'dom',
    (done) => Page.domContentEventFired((params) => {
      done(params ?? null);
    }),
    options,
  );
}