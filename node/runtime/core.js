import CDP from 'chrome-remote-interface';

export const HOST = '127.0.0.1';
export const PORT = 9222;

async function newClient(tabId) {
  return CDP({ target: tabId, host: HOST, port: PORT });
}

async function ensureTab(tabId) {
  const tabs = await CDP.List({ host: HOST, port: PORT });

  if (!tabs.some(t => t.id === tabId)) {
    throw new Error(`tab not found: ${tabId}`);
  }
}

export async function withClient(tabId, fn) {
  await ensureTab(tabId);
  const client = await newClient(tabId);

  try {
    const { Runtime, Page } = client;

    await Runtime.enable();
    await Page.enable();

    return await fn({ client, Runtime, Page });

  } finally {
    await client.close();
  }
}

export async function evaluate(tabId, expression) {
  await ensureTab(tabId);
  const client = await newClient(tabId);

  const { Runtime, Page } = client;

  try {
    await Runtime.enable();
    await Page.enable();

    const evalRaw = await Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
      // 允许触发某些受限 API（clipboard / focus）
      userGesture: true,
    });

    return evalRaw;

  } finally {
    await client.close();
  }
}

export function unwrapEval(raw) {
  const { result, exceptionDetails } = raw

  if (exceptionDetails) {
    const msg =
      exceptionDetails.text ||
      exceptionDetails.exception?.description ||
      'evaluation failed';
    throw new Error(msg);
  }

  if (!result) return undefined;

  return 'value' in result
    ? result.value
    : result.description;
}


function __safeSerialize(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({
      ok: false,
      error: 'failed to serialize result',
    });
  }
}

export function respondOk(value) {
  console.log(__safeSerialize({
    ok: true,
    value: value ?? null,
  }));
}

export function respondError(err) {
  console.log(__safeSerialize({
    ok: false,
    error: err?.message || String(err) || 'unknown error',
  }));
}

export async function runCmd(fn) {
  try {
    await fn();
  } catch (err) {
    respondError(err)
    process.exit(1);
  }
}
