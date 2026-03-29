import { ERROR_CODE, CliError } from '../infra/protocol.js';

export function requireArg(value, message) {
  // undefined | null | ''
  if (value == null || value === '') {
    throw new CliError(ERROR_CODE.MISSING_ARGS, message);
  }

  return value;
}

export function requireValue(value, message) {
  // undefined | null | '' | '   '
  if (value == null || value === '' || value.trim?.() === '') {
    throw new CliError(ERROR_CODE.EMPTY_VALUE, message);
  }

  return value;
}

export function requireEmitter(emitter, message = 'invalid emitter') {
  if (
    !emitter ||
    typeof emitter.on !== 'function' ||
    typeof emitter.off !== 'function'
  ) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, message);
  }

  return emitter;
}