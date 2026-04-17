import { toBool, toInt, toFloat } from '../infra/core.js'
import {
  setViewport,
  setDesktopViewport,
  setMobileViewport,
  setUserAgent,
  setTouchEmulation,
  setTimezone,
  setGeolocation,
  setMediaFeatures,
  clearEmulation,
} from '../cdp/emulation.js';

// emu 命令注册表
// 负责“页面运行环境模拟”这一层：
// - 设置通用视口
// - 切换桌面 / 移动端视口
// - 修改 User-Agent
// - 开启或关闭触摸模拟
// - 设置时区
// - 设置地理位置
// - 设置深色 / 浅色媒体偏好
// - 清除模拟环境
export const EMU_COMMANDS = {
  viewport: cmd_viewport,
  desktop: cmd_desktop,
  mobile: cmd_mobile,
  ua: cmd_ua,
  touch: cmd_touch,
  timezone: cmd_timezone,
  geo: cmd_geo,
  dark: cmd_dark,
  light: cmd_light,
  reset: cmd_reset,
};

/**
 * emu viewport <targetId> <width> <height> [mobile] [deviceScaleFactor]
 *
 * 设置一个通用视口。
 *
 * 参数：
 * - targetId            目标页面
 * - width               视口宽度
 * - height              视口高度
 * - mobile              可选，true/false，是否按移动端模式模拟，默认 false
 * - deviceScaleFactor   可选，设备像素比，默认 1
 *
 * 适用场景：
 * - 你不想用 desktop / mobile 预设，而是手动指定尺寸
 * - 做响应式测试时需要精确控制宽高
 *
 * 示例：
 *   welm emu viewport <targetId> 1200 800
 *   welm emu viewport <targetId> 390 844 true 3
 */
export async function cmd_viewport(args = []) {
  const [targetId, width, height, mobile, deviceScaleFactor] = args;

  await setViewport(
    targetId,
    toInt(width, 'width'),
    toInt(height, 'height'),
    {
      mobile: toBool(mobile, false),
      deviceScaleFactor:
        deviceScaleFactor == null ? 1 : toFloat(deviceScaleFactor, 'deviceScaleFactor'),
    },
  );

  return true;
}

/**
 * emu desktop <targetId> [width] [height] [deviceScaleFactor]
 *
 * 切换到桌面视口。
 *
 * 默认值：
 * - width  = 1440
 * - height = 900
 * - deviceScaleFactor = 1
 *
 * 适用场景：
 * - 让页面按桌面端布局渲染
 * - 桌面端截图
 * - 恢复为常见桌面页面宽度
 *
 * 示例：
 *   welm emu desktop <targetId>
 *   welm emu desktop <targetId> 1280 800
 *   welm emu desktop <targetId> 1440 900 1
 */
export async function cmd_desktop(args = []) {
  const [targetId, width, height, deviceScaleFactor] = args;

  await setDesktopViewport(
    targetId,
    width == null ? 1440 : toInt(width, 'width'),
    height == null ? 900 : toInt(height, 'height'),
    {
      deviceScaleFactor:
        deviceScaleFactor == null ? 1 : toFloat(deviceScaleFactor, 'deviceScaleFactor'),
    },
  );

  return true;
}

/**
 * emu mobile <targetId> [width] [height] [deviceScaleFactor]
 *
 * 切换到手机视口。
 *
 * 默认值：
 * - width  = 390
 * - height = 844
 * - deviceScaleFactor = 3
 *
 * 适用场景：
 * - 检查移动端布局
 * - 截移动端页面
 * - 测试响应式页面
 *
 * 注意：
 * - 这里只切移动端视口
 * - 如果网站还依赖 UA 判断端类型，可以再配合 emu ua 使用
 *
 * 示例：
 *   welm emu mobile <targetId>
 *   welm emu mobile <targetId> 375 812
 *   welm emu mobile <targetId> 390 844 3
 */
export async function cmd_mobile(args = []) {
  const [targetId, width, height, deviceScaleFactor] = args;

  await setMobileViewport(
    targetId,
    width == null ? 390 : toInt(width, 'width'),
    height == null ? 844 : toInt(height, 'height'),
    {
      deviceScaleFactor:
        deviceScaleFactor == null ? 3 : toFloat(deviceScaleFactor, 'deviceScaleFactor'),
    },
  );

  return true;
}

/**
 * emu ua <targetId> <userAgent>
 *
 * 修改当前页面使用的 User-Agent。
 *
 * 适用场景：
 * - 某些站点根据 UA 返回不同页面
 * - 配合 mobile / desktop 做更完整模拟
 *
 * 注意：
 * - 这里只改 UA
 * - 不会自动改视口，也不会自动开启 touch
 *
 * 示例：
 *   welm emu ua <targetId> "Mozilla/5.0 ..."
 */
export async function cmd_ua(args = []) {
  const [targetId, userAgent] = args;

  await setUserAgent(targetId, userAgent);
  return true;
}

/**
 * emu touch <targetId> [enabled] [maxTouchPoints]
 *
 * 开启或关闭触摸模拟。
 *
 * 参数：
 * - enabled         可选，默认 true
 * - maxTouchPoints  可选，默认 1
 *
 * 适用场景：
 * - 模拟移动设备的触摸能力
 * - 某些页面会根据 touch 能力调整交互
 *
 * 示例：
 *   welm emu touch <targetId>
 *   welm emu touch <targetId> true 5
 *   welm emu touch <targetId> false
 */
export async function cmd_touch(args = []) {
  const [targetId, enabled, maxTouchPoints] = args;

  await setTouchEmulation(
    targetId,
    toBool(enabled, true),
    maxTouchPoints == null ? 1 : toInt(maxTouchPoints, 'maxTouchPoints'),
  );

  return true;
}

/**
 * emu timezone <targetId> <timezoneId>
 *
 * 设置页面时区。
 *
 * 适用场景：
 * - 测试页面在不同时区下的时间显示
 * - 验证基于时区的逻辑
 *
 * 示例：
 *   welm emu timezone <targetId> Asia/Shanghai
 *   welm emu timezone <targetId> America/Los_Angeles
 */
export async function cmd_timezone(args = []) {
  const [targetId, timezoneId] = args;

  await setTimezone(targetId, timezoneId);
  return true;
}

/**
 * emu geo <targetId> <latitude> <longitude> [accuracy]
 *
 * 设置页面地理位置。
 *
 * 参数：
 * - latitude   纬度
 * - longitude  经度
 * - accuracy   可选，默认 100
 *
 * 适用场景：
 * - 测试定位相关页面
 * - 测试地图、本地服务、区域推荐等逻辑
 *
 * 示例：
 *   welm emu geo <targetId> 31.2304 121.4737
 *   welm emu geo <targetId> 34.0522 -118.2437 50
 */
export async function cmd_geo(args = []) {
  const [targetId, latitude, longitude, accuracy] = args;

  await setGeolocation(
    targetId,
    toFloat(latitude, 'latitude'),
    toFloat(longitude, 'longitude'),
    accuracy == null ? 100 : toFloat(accuracy, 'accuracy'),
  );

  return true;
}

/**
 * emu dark <targetId>
 *
 * 设置媒体偏好为深色模式。
 *
 * 适用场景：
 * - 测试 prefers-color-scheme: dark
 * - 截取深色主题页面
 *
 * 示例：
 *   welm emu dark <targetId>
 */
export async function cmd_dark(args = []) {
  const [targetId] = args;

  await setMediaFeatures(targetId, [
    { name: 'prefers-color-scheme', value: 'dark' },
  ]);

  return true;
}

/**
 * emu light <targetId>
 *
 * 设置媒体偏好为浅色模式。
 *
 * 适用场景：
 * - 测试 prefers-color-scheme: light
 * - 从 dark 切回 light
 *
 * 示例：
 *   welm emu light <targetId>
 */
export async function cmd_light(args = []) {
  const [targetId] = args;

  await setMediaFeatures(targetId, [
    { name: 'prefers-color-scheme', value: 'light' },
  ]);

  return true;
}

/**
 * emu reset <targetId>
 *
 * 清除常见模拟项，恢复到较接近默认的环境。
 *
 * 适用场景：
 * - 前面做过 viewport / mobile / ua / geo / timezone / dark 等设置后恢复环境
 * - 避免前一个命令影响后续操作
 *
 * 示例：
 *   welm emu reset <targetId>
 */
export async function cmd_reset(args = []) {
  const [targetId] = args;

  await clearEmulation(targetId);
  return true;
}
