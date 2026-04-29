import { ClientError } from '../core/error.js';
import { ERROR_CODE } from '../core/error-code.js';
import { getClient } from './client.js';
import {
  waitSelector,
  waitVisible,
  waitClickable,
} from './wait.js';

/**
 * Action 能力说明
 *
 * 这一层是“元素动作层”。
 *
 * 它不是单一 CDP 域，而是对这些底层能力的组合封装：
 * - Runtime：查元素、读属性、执行 DOM 操作
 * - Input：发鼠标、键盘事件
 * - Wait：确保在正确时机动作
 *
 * 它解决的是“更顺手的高阶动作”：
 * - click(targetId, selector)
 * - type(targetId, selector, text)
 * - press(targetId, key)
 * - scrollIntoView(targetId, selector)
 * - getText(targetId, selector)
 * - getHtml(targetId, selector)
 */

function ensureTargetId(targetId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }
}

function ensureSelector(selector) {
  if (!selector) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }
}

function ensureText(text) {
  if (text == null) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing text');
  }
}

function ensureKey(key) {
  if (!key) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing key');
  }
}

async function getActionClient(targetId) {
  ensureTargetId(targetId);

  const client = await getClient(targetId);
  const { Runtime, Input } = client;

  return { client, Runtime, Input };
}

async function runtimeEvalValue(targetId, expression) {
  const { Runtime } = await getActionClient(targetId);

  const res = await Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (res.exceptionDetails) {
    throw new ClientError(
      ERROR_CODE.INTERNAL_ERROR,
      'runtime evaluate failed',
      { exceptionDetails: res.exceptionDetails },
    );
  }

  return res.result?.value ?? null;
}

function q(value) {
  return JSON.stringify(value);
}

async function getElementBox(targetId, selector) {
  ensureSelector(selector);

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) return null;

      const rect = el.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };
    })()
  `;

  return await runtimeEvalValue(targetId, expression);
}

async function focusElement(targetId, selector) {
  ensureSelector(selector);

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) return false;
      el.focus();
      return document.activeElement === el;
    })()
  `;

  return await runtimeEvalValue(targetId, expression);
}

async function clearElementValue(targetId, selector) {
  ensureSelector(selector);

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) return false;

      if ('value' in el) {
        el.focus();
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      if (el.isContentEditable) {
        el.focus();
        el.innerHTML = '';
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }));
        return true;
      }

      return false;
    })()
  `;

  return await runtimeEvalValue(targetId, expression);
}

function getKeyDefinition(key) {
  const map = {
    Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 },
    Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
    Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
    Backspace: { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 },
    Delete: { key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46 },
    ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 },
    ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 },
    ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 },
    ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 },
    Space: { key: ' ', text: ' ', code: 'Space', windowsVirtualKeyCode: 32 },
  };

  return map[key] || {
    key,
    text: key.length === 1 ? key : undefined,
    code: key,
    windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0,
  };
}

/**
 * scrollIntoView(targetId, selector)
 *
 * 滚动到元素进入视口。
 */
export async function scrollIntoView(targetId, selector, options = {}) {
  ensureTargetId(targetId);
  ensureSelector(selector);

  await waitSelector(targetId, selector, options.wait || {});

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) return false;

      el.scrollIntoView({
        block: ${q(options.block || 'center')},
        inline: ${q(options.inline || 'center')},
        behavior: ${q(options.behavior || 'instant')},
      });

      return true;
    })()
  `;

  const ok = await runtimeEvalValue(targetId, expression);

  if (!ok) {
    throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to scroll element into view');
  }

  return true;
}

/**
 * getText(targetId, selector)
 *
 * 获取元素文本。
 */
export async function getText(targetId, selector, options = {}) {
  ensureTargetId(targetId);
  ensureSelector(selector);

  await waitSelector(targetId, selector, options.wait || {});

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) return null;

      return {
        textContent: el.textContent ?? '',
        innerText: el.innerText ?? '',
      };
    })()
  `;

  const value = await runtimeEvalValue(targetId, expression);

  if (!value) {
    throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to get text');
  }

  return options.useTextContent ? value.textContent : value.innerText;
}

/**
 * getHtml(targetId, selector)
 *
 * 获取元素 html。
 */
export async function getHtml(targetId, selector, options = {}) {
  ensureTargetId(targetId);
  ensureSelector(selector);

  await waitSelector(targetId, selector, options.wait || {});

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) return null;

      return {
        outerHTML: el.outerHTML ?? '',
        innerHTML: el.innerHTML ?? '',
      };
    })()
  `;

  const value = await runtimeEvalValue(targetId, expression);

  if (!value) {
    throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to get html');
  }

  return options.inner ? value.innerHTML : value.outerHTML;
}

/**
 * press(targetId, key)
 *
 * 向当前聚焦元素发送按键。
 */
export async function press(targetId, key) {
  ensureTargetId(targetId);
  ensureKey(key);

  const { Input } = await getActionClient(targetId);
  const def = getKeyDefinition(key);

  await Input.dispatchKeyEvent({
    type: 'keyDown',
    key: def.key,
    code: def.code,
    text: def.text,
    windowsVirtualKeyCode: def.windowsVirtualKeyCode,
    nativeVirtualKeyCode: def.windowsVirtualKeyCode,
  });

  await Input.dispatchKeyEvent({
    type: 'keyUp',
    key: def.key,
    code: def.code,
    text: def.text,
    windowsVirtualKeyCode: def.windowsVirtualKeyCode,
    nativeVirtualKeyCode: def.windowsVirtualKeyCode,
  });

  return true;
}

/**
 * click(targetId, selector)
 *
 * 点击元素。
 *
 * 默认流程：
 * - 等元素可点击
 * - 滚动到视口
 * - 用鼠标点击元素中心点
 */
export async function click(targetId, selector, options = {}) {
  ensureTargetId(targetId);
  ensureSelector(selector);

  const waitOptions = options.wait || {};
  await waitClickable(targetId, selector, waitOptions);
  await scrollIntoView(targetId, selector, options.scroll);

  const box = await getElementBox(targetId, selector);

  if (!box || box.width <= 0 || box.height <= 0) {
    throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to resolve clickable box');
  }

  const { Input } = await getActionClient(targetId);

  await Input.dispatchMouseEvent({
    type: 'mouseMoved',
    x: box.centerX,
    y: box.centerY,
    button: 'none',
  });

  await Input.dispatchMouseEvent({
    type: 'mousePressed',
    x: box.centerX,
    y: box.centerY,
    button: 'left',
    clickCount: 1,
  });

  await Input.dispatchMouseEvent({
    type: 'mouseReleased',
    x: box.centerX,
    y: box.centerY,
    button: 'left',
    clickCount: 1,
  });

  return true;
}

/**
 * type(targetId, selector, text)
 *
 * 向 input / textarea / contenteditable 输入文本。
 *
 * 默认流程：
 * - 等元素可见
 * - 滚动到视口
 * - focus
 * - 可选清空
 * - insertText
 */
export async function type(targetId, selector, text, options = {}) {
  ensureTargetId(targetId);
  ensureSelector(selector);
  ensureText(text);

  const waitOptions = options.wait || {};
  await waitVisible(targetId, selector, waitOptions);
  await scrollIntoView(targetId, selector, options.scroll);

  const focused = await focusElement(targetId, selector);

  if (!focused) {
    throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to focus element');
  }

  if (options.clear) {
    const cleared = await clearElementValue(targetId, selector);
    if (!cleared) {
      throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to clear element value');
    }
  }

  const { Input } = await getActionClient(targetId);

  await Input.insertText({
    text: String(text),
  });

  return true;
}