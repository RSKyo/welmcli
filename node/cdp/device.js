// ========================
// CDP Input Domain
// ========================

import { getClient } from './client.js';

/**
 * 鼠标移动
 */
export async function mouseMove(targetId, x, y, options = {}) {
  const client = await getClient(targetId);
  const { Input } = client;

  await Input.dispatchMouseEvent({
    type: 'mouseMoved',
    x: Number(x),
    y: Number(y),
    modifiers: options.modifiers ?? 0,
    buttons: options.buttons ?? 0,
  });
}

/**
 * 鼠标按下
 */
export async function mouseDown(targetId, x, y, options = {}) {
  const client = await getClient(targetId);
  const { Input } = client;

  await Input.dispatchMouseEvent({
    type: 'mousePressed',
    x: Number(x),
    y: Number(y),
    button: options.button ?? 'left',
    clickCount: options.clickCount ?? 1,
    modifiers: options.modifiers ?? 0,
    buttons: options.buttons ?? 1,
  });
}

/**
 * 鼠标抬起
 */
export async function mouseUp(targetId, x, y, options = {}) {
  const client = await getClient(targetId);
  const { Input } = client;

  await Input.dispatchMouseEvent({
    type: 'mouseReleased',
    x: Number(x),
    y: Number(y),
    button: options.button ?? 'left',
    clickCount: options.clickCount ?? 1,
    modifiers: options.modifiers ?? 0,
    buttons: options.buttons ?? 0,
  });
}

/**
 * 单击
 */
export async function click(targetId, x, y, options = {}) {
  await mouseMove(targetId, x, y, options);
  await mouseDown(targetId, x, y, options);
  await mouseUp(targetId, x, y, options);
}

/**
 * 双击
 */
export async function doubleClick(targetId, x, y, options = {}) {
  const next = {
    ...options,
    clickCount: 2,
  };

  await mouseMove(targetId, x, y, next);
  await mouseDown(targetId, x, y, next);
  await mouseUp(targetId, x, y, next);
  await mouseDown(targetId, x, y, next);
  await mouseUp(targetId, x, y, next);
}

/**
 * 鼠标滚轮
 */
export async function mouseWheel(targetId, x, y, deltaX = 0, deltaY = 0, options = {}) {
  const client = await getClient(targetId);
  const { Input } = client;

  await Input.dispatchMouseEvent({
    type: 'mouseWheel',
    x: Number(x),
    y: Number(y),
    deltaX: Number(deltaX),
    deltaY: Number(deltaY),
    modifiers: options.modifiers ?? 0,
  });
}

/**
 * 键盘按下
 */
export async function keyDown(targetId, key, options = {}) {
  const client = await getClient(targetId);
  const { Input } = client;

  await Input.dispatchKeyEvent({
    type: 'keyDown',
    key,
    code: options.code ?? undefined,
    text: options.text ?? undefined,
    unmodifiedText: options.unmodifiedText ?? undefined,
    windowsVirtualKeyCode: options.windowsVirtualKeyCode ?? undefined,
    nativeVirtualKeyCode: options.nativeVirtualKeyCode ?? undefined,
    modifiers: options.modifiers ?? 0,
  });
}

/**
 * 键盘抬起
 */
export async function keyUp(targetId, key, options = {}) {
  const client = await getClient(targetId);
  const { Input } = client;

  await Input.dispatchKeyEvent({
    type: 'keyUp',
    key,
    code: options.code ?? undefined,
    modifiers: options.modifiers ?? 0,
  });
}

/**
 * 按一次键
 */
export async function pressKey(targetId, key, options = {}) {
  await keyDown(targetId, key, options);
  await keyUp(targetId, key, options);
}

/**
 * 输入文本
 */
export async function insertText(targetId, text) {
  const client = await getClient(targetId);
  const { Input } = client;

  await Input.insertText({
    text: String(text),
  });
}

/**
 * 回车
 */
export async function pressEnter(targetId) {
  await pressKey(targetId, 'Enter', {
    code: 'Enter',
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });
}

/**
 * Tab
 */
export async function pressTab(targetId) {
  await pressKey(targetId, 'Tab', {
    code: 'Tab',
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  });
}

/**
 * Escape
 */
export async function pressEscape(targetId) {
  await pressKey(targetId, 'Escape', {
    code: 'Escape',
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  });
}