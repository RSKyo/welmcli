import { getClient } from './client.js';
import { requireArg } from './assert.js';

export function okResult(value = null, extra = {}) {
  return {
    ...extra,
    ok: true,
    value,
  };
}

export function failResult(error = null, extra = {}) {
  return {
    ...extra,
    ok: false,
    error,
  };
}

export async function evaluate(targetId, expression) {
  requireArg(targetId, 'missing targetId');
  requireArg(expression, 'missing expression');

  const client = await getClient(targetId);
  const { Runtime } = client;

  const { result, exceptionDetails } = await Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    const error =
      exceptionDetails.text ||
      exceptionDetails.exception?.description ||
      'expression threw an exception';

    return failResult(error);
  }

  if (!result) {
    return failResult('missing evaluation result');
  }

  // 通常只有可以直接序列化的值，才会出现在 result.value 里
  // 函数、DOM 节点、某些复杂对象不能直接按 JSON 值返回，而是将远程对象描述信息放到 result.description 里
  if ('value' in result) {
    return okResult(result.value, {
      type: result.type,
      subtype: result.subtype,
      byValue: true,
    });
  }

  return okResult(result.description, {
    type: result.type,
    subtype: result.subtype,
    byValue: false,
  });
}
