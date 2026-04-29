// ========================
// CLI page commands
// ========================

import { toBool, toInt } from '../infra/core.js'

import {
  navigatePage,
  reloadPage,
  stopLoadingPage,
  bringPageToFront,
  getFrameTree,
  getResourceTree,
  getLayoutMetrics,
  getPageContent,
  waitPageLoad,
  waitDomContentLoaded,
  captureScreenshot,
  captureFullPageScreenshot,
} from '../cdp/page.js';

// page 命令注册表
// 负责“已有 target 的页面行为和页面状态”这一层：
// - 页面跳转
// - 页面刷新 / 停止
// - 页面前置
// - 页面加载等待
// - 页面结构读取
// - 页面尺寸读取
// - 页面截图
export const PAGE_COMMANDS = {
  goto: cmd_goto,
  reload: cmd_reload,
  stop: cmd_stop,
  front: cmd_front,
  frames: cmd_frames,
  resources: cmd_resources,
  metrics: cmd_metrics,
  html: cmd_html,
  'wait-load': cmd_wait_load,
  'wait-dom': cmd_wait_dom,
  screenshot: cmd_screenshot,
  fullshot: cmd_fullshot,
};



/**
 * 跳转到指定 url
 *
 * 用法：
 *   welm page goto <targetId> <url>
 *
 * 说明：
 * - 让已有 target 跳转到指定地址
 * - 只负责发起跳转，不代表页面已经加载完成
 * - 通常应再配合 wait-load 或 wait-dom 使用
 *
 * 示例：
 *   welm page goto ABC123 https://example.com
 */
export async function cmd_goto(args = []) {
  const [targetId, url] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!url) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing url');
  }

  return await navigatePage(targetId, url);
}

/**
 * 刷新页面
 *
 * 用法：
 *   welm page reload <targetId> [ignoreCache]
 *
 * 说明：
 * - ignoreCache 可选，true / false，默认 false
 * - 为 true 时，尽量忽略缓存重新请求资源
 *
 * 示例：
 *   welm page reload ABC123
 *   welm page reload ABC123 true
 */
export async function cmd_reload(args = []) {
  const [targetId, ignoreCache] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  await reloadPage(targetId, {
    ignoreCache: toBool(ignoreCache, false),
  });

  return true;
}

/**
 * 停止当前页面加载
 *
 * 用法：
 *   welm page stop <targetId>
 *
 * 示例：
 *   welm page stop ABC123
 */
export async function cmd_stop(args = []) {
  const [targetId] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  await stopLoadingPage(targetId);
  return true;
}

/**
 * 让页面切到前台
 *
 * 用法：
 *   welm page front <targetId>
 *
 * 说明：
 * - 让指定 target 对应的页面切到前台
 * - 这是浏览器页面级前置，不等于完整的操作系统窗口管理
 *
 * 示例：
 *   welm page front ABC123
 */
export async function cmd_front(args = []) {
  const [targetId] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  await bringPageToFront(targetId);
  return true;
}

/**
 * 获取页面 frame 树
 *
 * 用法：
 *   welm page frames <targetId>
 *
 * 说明：
 * - 常用于查看页面是否包含 iframe
 * - 分析主 frame 和子 frame 结构
 *
 * 示例：
 *   welm page frames ABC123
 */
export async function cmd_frames(args = []) {
  const [targetId] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await getFrameTree(targetId);
}

/**
 * 获取页面资源树
 *
 * 用法：
 *   welm page resources <targetId>
 *
 * 说明：
 * - 查看主页面及其资源结构
 * - 获取主 frame 及子 frame 资源信息
 *
 * 示例：
 *   welm page resources ABC123
 */
export async function cmd_resources(args = []) {
  const [targetId] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await getResourceTree(targetId);
}

/**
 * 获取页面布局指标
 *
 * 用法：
 *   welm page metrics <targetId>
 *
 * 常见返回内容包括：
 * - layoutViewport
 * - visualViewport
 * - contentSize
 * - cssContentSize
 *
 * 适用场景：
 * - 查看页面可视区尺寸
 * - 获取整页内容大小
 * - 截整页前调试页面尺寸
 *
 * 示例：
 *   welm page metrics ABC123
 */
export async function cmd_metrics(args = []) {
  const [targetId] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await getLayoutMetrics(targetId);
}

/**
 * 获取页面 html
 *
 * 用法：
 *   welm page html <targetId>
 *
 * 说明：
 * - 用于查看页面源码内容
 * - 页面刚跳转后，通常建议先 wait-load 再取
 * - 具体返回哪一种 html，取决于底层 cdp/page.js 的实现
 *
 * 示例：
 *   welm page html ABC123
 */
export async function cmd_html(args = []) {
  const [targetId] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await getPageContent(targetId);
}

/**
 * 等待页面 load 完成
 *
 * 用法：
 *   welm page wait-load <targetId> [timeout]
 *
 * 说明：
 * - timeout 可选，单位毫秒，默认 10000
 * - 适合在 goto / reload 之后等待页面完成加载
 * - load 完成不一定代表前端页面完全稳定，但通常已足够覆盖大多数普通场景
 *
 * 示例：
 *   welm page wait-load ABC123
 *   welm page wait-load ABC123 15000
 */
export async function cmd_wait_load(args = []) {
  const [targetId, timeout] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await waitPageLoad(
    targetId,
    timeout == null ? 10000 : toInt(timeout, 'timeout'),
  );
}

/**
 * 等待 DOMContentLoaded 完成
 *
 * 用法：
 *   welm page wait-dom <targetId> [timeout]
 *
 * 说明：
 * - timeout 可选，单位毫秒，默认 10000
 * - 适合只关心 DOM 初步可用的场景
 * - 某些页面会比 wait-load 更早达到可读取状态
 *
 * 示例：
 *   welm page wait-dom ABC123
 *   welm page wait-dom ABC123 8000
 */
export async function cmd_wait_dom(args = []) {
  const [targetId, timeout] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await waitDomContentLoaded(
    targetId,
    timeout == null ? 10000 : toInt(timeout, 'timeout'),
  );
}

/**
 * 截取当前可视区域
 *
 * 用法：
 *   welm page screenshot <targetId> [format] [quality]
 *
 * 参数：
 * - format  可选，默认 png，可传 jpeg / webp
 * - quality 可选，仅 jpeg / webp 有意义
 *
 * 返回：
 * - base64 图片数据
 *
 * 示例：
 *   welm page screenshot ABC123
 *   welm page screenshot ABC123 jpeg 80
 */
export async function cmd_screenshot(args = []) {
  const [targetId, format, quality] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await captureScreenshot(targetId, {
    format: format || 'png',
    quality: quality == null ? undefined : toInt(quality, 'quality'),
  });
}

/**
 * 截取整页
 *
 * 用法：
 *   welm page fullshot <targetId> [format] [quality]
 *
 * 参数：
 * - format  可选，默认 png，可传 jpeg / webp
 * - quality 可选，仅 jpeg / webp 有意义
 *
 * 返回：
 * - base64 图片数据
 *
 * 示例：
 *   welm page fullshot ABC123
 *   welm page fullshot ABC123 jpeg 80
 */
export async function cmd_fullshot(args = []) {
  const [targetId, format, quality] = args;

  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  return await captureFullPageScreenshot(targetId, {
    format: format || 'png',
    quality: quality == null ? undefined : toInt(quality, 'quality'),
  });
}