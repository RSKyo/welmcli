import { normalizeError } from './error.js';

function writeJson(payload) {
  const seen = new WeakSet();

  const json = JSON.stringify(payload, (_, v) => {
    if (typeof v === 'bigint') return String(v);

    if (v instanceof Error) {
      return normalizeError(v);
    }

    if (typeof v === 'object' && v !== null) {
      if (seen.has(v)) return '[Circular]';
      seen.add(v);
    }

    return v;
  });

  process.stdout.write(`${json}\n`);
}

export function respondOk(data = null) {
  writeJson({
    ok: true,
    data,
  });
}

export function respondError(err) {
  writeJson({
    ok: false,
    error: normalizeError(err),
  });
}

export async function run(main) {
  try {
    const data = await main();
    respondOk(data);
    process.exitCode = 0;
  } catch (err) {
    respondError(err);
    process.exitCode = 1;
  }
}
