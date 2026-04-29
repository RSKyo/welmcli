import { ERROR_CODE, ClientError } from '../infra/protocol.js';
import { evaluate } from '../cdp/runtime.js'

export async function inputText(pageId, text, selector = '') {
  if (!pageId) {
    throw new ClientError(ERROR_CODE.MISSING_PAGE_ID, 'missing pageId');
  }

  if (text == null) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing text');
  }

  const expression = buildInputExpression(text, selector);
  return await evaluate(pageId, expression);
}

function buildInputExpression(text, selector = '') {
  const textBase64 = Buffer.from(String(text), 'utf8').toString('base64');
  const selectorLiteral = JSON.stringify(selector);

  return `
    (() => {
      const decodeBase64Utf8 = (value) => {
        const binary = atob(value);
        const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
      };

      const findInputElement = (selector) => {
        if (selector) {
          const node = document.querySelector(selector);
          if (node) return node;
        }

        return (
          document.querySelector('[contenteditable="true"]') ||
          document.querySelector('textarea') ||
          document.querySelector('input')
        );
      };

      const setFormValue = (element, value) => {
        const proto =
          element instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;

        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');

        if (descriptor && typeof descriptor.set === 'function') {
          descriptor.set.call(element, value);
          return;
        }

        element.value = value;
      };

      const text = decodeBase64Utf8('${textBase64}');
      const element = findInputElement(${selectorLiteral});

      if (!element) {
        throw new Error('input element not found');
      }

      element.focus();

      if (element.isContentEditable) {
        element.textContent = text;
      } else {
        setFormValue(element, text);
      }

      element.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }));

      element.dispatchEvent(new Event('change', {
        bubbles: true,
      }));

      return true;
    })();
  `;
}