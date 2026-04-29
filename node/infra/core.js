import { ERROR_CODE, ClientError } from './protocol.js';

export function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch {
    return String(url || '').trim();
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function ensurePositiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

export function toPositiveNumber(value, fallback) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return ensurePositiveNumber(n, fallback);
}


export function toBool(value, defaultValue = true) {
  if (value == null || value === '') return defaultValue;
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
  
    throw new ClientError(ERROR_CODE.INVALID_ARGS, `invalid boolean: ${value}`);
}

export function toInt(value, name) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, `invalid ${name}`);
  }

  return n;
}

export function toFloat(value, name) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, `invalid ${name}`);
  }

  return n;
}
