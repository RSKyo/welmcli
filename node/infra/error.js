export const ERROR_CODE = {
  // ========================
  // 参数错误（CLI 输入层）
  // ========================
  ARG_MISSING: 'ARG_MISSING', // 缺少必要参数（undefined / null / 未传）
  ARG_EMPTY: 'ARG_EMPTY', // 参数为空（'' / 空字符串 / 全空格）
  ARG_INVALID: 'ARG_INVALID', // 参数格式或类型不合法

  // ========================
  // 命令错误（CLI 命令层）
  // ========================
  CMD_MISSING: 'CMD_MISSING', // 未提供命令
  CMD_INVALID: 'CMD_INVALID', // 命令不存在或不支持

  // ========================
  // 目标错误（浏览器对象层）
  // ========================
  TARGET_MISSING: 'TARGET_MISSING', // 缺少 targetId
  TARGET_NOT_FOUND: 'TARGET_NOT_FOUND', // 未找到对应的 target（页面 / tab）

  // ========================
  // 运行时错误（CDP / evaluate）
  // ========================
  RUNTIME_EVAL_ERROR: 'RUNTIME_EVAL_ERROR', // 执行表达式时报错（抛异常）
  RUNTIME_EVAL_FAILED: 'RUNTIME_EVAL_FAILED', // 执行成功但结果不符合预期（false / ''）

  // ========================
  // 系统错误（兜底）
  // ========================
  INTERNAL_ERROR: 'INTERNAL_ERROR', // 未分类的内部错误
};

export class ClientError extends Error {
  constructor(code, message, details = null) {
    super(message);
    // 在 JS 里，继承普通类通常没事，但继承一些内建对象时，尤其是 Error，有时实例的原型链不会完全按你预期工作。
    // err instanceof ClientError 可能判断不稳定
    // 把当前实例 this 的原型，设成 ClientError 的 prototype
    // new.target 被哪个构造函数 new 出来的，new ClientError(...) 就是 ClientError
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ClientError';
    this.code = code || ERROR_CODE.INTERNAL_ERROR;
    this.details = details;
  }
}

export function normalizeError(err, options = {}) {
  const { includeStack = false } = options;

  // 1️⃣ 已经是我们自己的错误
  if (err instanceof Error) {
    return {
      code: err.code || ERROR_CODE.INTERNAL_ERROR,
      message: err.message || 'unknown error',
      details: err.details ?? null,
      ...(includeStack && { stack: err.stack }),
    };
  }

  // 2️⃣ 普通对象（尽量保留信息）
  if (err && typeof err === 'object') {
    return {
      code: err.code || ERROR_CODE.INTERNAL_ERROR,
      message: err.message || 'unknown error',
      details: err.details ?? err,
    };
  }

  // 3️⃣ 字符串 / 其他
  return {
    code: ERROR_CODE.INTERNAL_ERROR,
    message: String(err ?? 'unknown error'),
    details: null,
  };
}