import { ClientError } from '../core/error.js';
import { ERROR_CODE } from '../core/error-code.js';
import { getClient } from './client.js';

/**
 * 设置设备指标（核心视口能力）
 */
export async function setDeviceMetrics(targetId, options = {}) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const {
    width,
    height,
    deviceScaleFactor = 1,
    mobile = false,
    scale,
    screenWidth,
    screenHeight,
    positionX,
    positionY,
    dontSetVisibleSize,
    screenOrientation,
    viewport,
  } = options;

  if (!width || !height) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing width or height');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  const params = {
    width,
    height,
    deviceScaleFactor,
    mobile: !!mobile,
  };

  if (scale != null) {
    params.scale = scale;
  }

  if (screenWidth != null) {
    params.screenWidth = screenWidth;
  }

  if (screenHeight != null) {
    params.screenHeight = screenHeight;
  }

  if (positionX != null) {
    params.positionX = positionX;
  }

  if (positionY != null) {
    params.positionY = positionY;
  }

  if (dontSetVisibleSize != null) {
    params.dontSetVisibleSize = !!dontSetVisibleSize;
  }

  if (screenOrientation) {
    params.screenOrientation = screenOrientation;
  }

  if (viewport) {
    params.viewport = viewport;
  }

  await Emulation.setDeviceMetricsOverride(params);
}

/**
 * 清除设备指标模拟
 */
export async function clearDeviceMetrics(targetId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  await Emulation.clearDeviceMetricsOverride();
}

/**
 * 设置通用视口
 * 这是你最常直接调用的方法
 */
export async function setViewport(targetId, width, height, options = {}) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!width || !height) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing width or height');
  }

  return setDeviceMetrics(targetId, {
    width,
    height,
    ...options,
  });
}

/**
 * 设置桌面视口
 */
export async function setDesktopViewport(targetId, width = 1440, height = 900, options = {}) {
  return setDeviceMetrics(targetId, {
    width,
    height,
    mobile: false,
    deviceScaleFactor: options.deviceScaleFactor ?? 1,
    ...options,
  });
}

/**
 * 设置移动端视口
 */
export async function setMobileViewport(targetId, width = 390, height = 844, options = {}) {
  return setDeviceMetrics(targetId, {
    width,
    height,
    mobile: true,
    deviceScaleFactor: options.deviceScaleFactor ?? 3,
    screenWidth: options.screenWidth ?? width,
    screenHeight: options.screenHeight ?? height,
    screenOrientation: options.screenOrientation ?? {
      type: height >= width ? 'portraitPrimary' : 'landscapePrimary',
      angle: height >= width ? 0 : 90,
    },
    ...options,
  });
}

/**
 * 设置 User-Agent
 */
export async function setUserAgent(targetId, userAgent, options = {}) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!userAgent) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing userAgent');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  const {
    acceptLanguage,
    platform,
    userAgentMetadata,
  } = options;

  const params = {
    userAgent,
  };

  if (acceptLanguage != null) {
    params.acceptLanguage = acceptLanguage;
  }

  if (platform != null) {
    params.platform = platform;
  }

  if (userAgentMetadata != null) {
    params.userAgentMetadata = userAgentMetadata;
  }

  await Emulation.setUserAgentOverride(params);
}

/**
 * 设置桌面 UA
 */
export async function setDesktopUserAgent(targetId, userAgent) {
  return setUserAgent(targetId, userAgent, {
    platform: 'MacIntel',
  });
}

/**
 * 设置移动端 UA
 */
export async function setMobileUserAgent(targetId, userAgent) {
  return setUserAgent(targetId, userAgent, {
    platform: 'iPhone',
  });
}

/**
 * 启用触摸模拟
 */
export async function setTouchEmulation(targetId, enabled = true, maxTouchPoints = 1) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  await Emulation.setTouchEmulationEnabled({
    enabled: !!enabled,
    maxTouchPoints,
  });
}

/**
 * 清除触摸模拟
 */
export async function clearTouchEmulation(targetId) {
  return setTouchEmulation(targetId, false, 1);
}

/**
 * 设置时区
 */
export async function setTimezone(targetId, timezoneId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!timezoneId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing timezoneId');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  await Emulation.setTimezoneOverride({ timezoneId });
}

/**
 * 清除时区模拟
 * 有些实现接受空字符串来恢复默认
 */
export async function clearTimezone(targetId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  await Emulation.setTimezoneOverride({ timezoneId: '' });
}

/**
 * 设置地理位置
 */
export async function setGeolocation(targetId, latitude, longitude, accuracy = 100) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (latitude == null || longitude == null) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing latitude or longitude');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  await Emulation.setGeolocationOverride({
    latitude,
    longitude,
    accuracy,
  });
}

/**
 * 清除地理位置模拟
 * 某些场景下可用“不传经纬度”恢复
 */
export async function clearGeolocation(targetId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  await Emulation.setGeolocationOverride({});
}

/**
 * 设置 prefers-color-scheme / reduced-motion 等媒体特性
 *
 * features 示例：
 * [
 *   { name: 'prefers-color-scheme', value: 'dark' },
 *   { name: 'prefers-reduced-motion', value: 'reduce' },
 * ]
 */
export async function setMediaFeatures(targetId, features = []) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Emulation } = client;

  await Emulation.setEmulatedMedia({
    features,
  });
}

/**
 * 清除媒体特性模拟
 */
export async function clearMediaFeatures(targetId) {
  return setMediaFeatures(targetId, []);
}

/**
 * 一键切到“移动端环境”
 * 通常会一起设置 viewport + touch
 */
export async function emulateMobile(targetId, options = {}) {
  const {
    width = 390,
    height = 844,
    deviceScaleFactor = 3,
    maxTouchPoints = 5,
    userAgent,
  } = options;

  await setMobileViewport(targetId, width, height, {
    deviceScaleFactor,
  });

  await setTouchEmulation(targetId, true, maxTouchPoints);

  if (userAgent) {
    await setMobileUserAgent(targetId, userAgent);
  }
}

/**
 * 一键切到“桌面端环境”
 */
export async function emulateDesktop(targetId, options = {}) {
  const {
    width = 1440,
    height = 900,
    deviceScaleFactor = 1,
    userAgent,
  } = options;

  await setDesktopViewport(targetId, width, height, {
    deviceScaleFactor,
  });

  await clearTouchEmulation(targetId);

  if (userAgent) {
    await setDesktopUserAgent(targetId, userAgent);
  }
}

/**
 * 清除本文件里最常用的模拟项
 */
export async function clearEmulation(targetId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  await clearDeviceMetrics(targetId);
  await clearTouchEmulation(targetId);
  await clearMediaFeatures(targetId);

  try {
    await clearTimezone(targetId);
  } catch {}

  try {
    await clearGeolocation(targetId);
  } catch {}
}