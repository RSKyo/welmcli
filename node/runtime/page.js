import { evaluate, unwrapEval, respondOk } from './core.js';

export async function evalPage(tabId, expression) {
  if (!tabId) throw new Error('missing tabId');
  if (!expression) throw new Error('missing expression');

  const raw = await evaluate(tabId, expression);
  const value = unwrapEval(raw);

  respondOk(value);
}

export async function text(tabId, selector) {
  if (!tabId) throw new Error('missing tabId');
  if (!selector) throw new Error('missing selector');

  const expression = `
    (function () {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return el.innerText.trim();
    })()
  `;

  const raw = await evaluate(tabId, expression);
  const value = unwrapEval(raw);

  if (value === null) 
    throw new Error('element not found');

  respondOk(value);
}