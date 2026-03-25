import { getClient } from './client.js';
import { ERROR_CODE, CliError } from '../infra/protocol.js';

function unwrapResult(res) {
  const { result, exceptionDetails } = res;

  if (exceptionDetails) {
    const msg =
      exceptionDetails.text ||
      exceptionDetails.exception?.description ||
      'evaluation failed';

    throw new CliError(ERROR_CODE.EVALUATE_ERROR, msg);
  }

  if (!result) {
    throw new CliError(
      ERROR_CODE.EVALUATE_ERROR,
      'missing evaluation result',
    );
  }

  return 'value' in result
  ? result.value
  : result.description;
}

export function buildStructuredExpression(source) {
  return `
    (() => {
      try {
        const value = (${source})();
        return {
          ok: true,
          value,
        };
      } catch (error) {
        return {
          ok: false,
          error: String(error?.message ?? error),
        };
      }
    })()
  `;
}

export async function evaluate(targetId, expression) {
  const client = await getClient(targetId);
  const { Runtime } = client;

  const res = await Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  return unwrapResult(res);
}
