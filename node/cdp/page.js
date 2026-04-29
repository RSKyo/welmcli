import { ClientError } from '../core/error.js';
import { ERROR_CODE } from '../core/error-code.js';
import { getClient } from './client.js';
import { requireArg } from './assert.js';

/**
 * Page 域常用能力。
 *
 * 这里只保留 Page 的基础操作：
 * - 页面启用与禁用
 * - 导航、刷新、停止加载、前置窗口
 * - frame / resource / layout 信息获取
 * - 截图与页面资源读取
 *
 * 与“等待”相关的能力已统一放到 wait.js。
 */

/**
 * 启用 Page 域。
 */
export async function enablePage(targetId) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  await Page.enable();
}

/**
 * 禁用 Page 域。
 */
export async function disablePage(targetId) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  await Page.disable();
}

/**
 * 跳转到指定 URL。
 */
export async function navigatePage(targetId, url) {
  requireArg(targetId, 'missing targetId');
  requireArg(url, 'missing url');

  const { Page } = await getClient(targetId);

  const res = await Page.navigate({ url });

  return {
    frameId: res.frameId ?? '',
    loaderId: res.loaderId ?? '',
    errorText: res.errorText ?? '',
    isDownload: !!res.isDownload,
  };
}

/**
 * 刷新页面。
 */
export async function reloadPage(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  const {
    ignoreCache = false,
    scriptToEvaluateOnLoad,
    loaderId,
  } = options;

  await Page.reload({
    ignoreCache: !!ignoreCache,
    scriptToEvaluateOnLoad,
    loaderId,
  });
}

/**
 * 停止加载。
 */
export async function stopLoadingPage(targetId) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  await Page.stopLoading();
}

/**
 * 让目标页切到前台。
 */
export async function bringPageToFront(targetId) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  await Page.bringToFront();
}

/**
 * 获取 frame 树。
 */
export async function getFrameTree(targetId) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  const res = await Page.getFrameTree();
  return res.frameTree ?? null;
}

/**
 * 获取资源树。
 */
export async function getResourceTree(targetId) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  const res = await Page.getResourceTree();
  return res.frameTree ?? null;
}

/**
 * 获取布局指标。
 */
export async function getLayoutMetrics(targetId) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  const res = await Page.getLayoutMetrics();

  return {
    layoutViewport: res.layoutViewport ?? null,
    visualViewport: res.visualViewport ?? null,
    contentSize: res.contentSize ?? null,
    cssLayoutViewport: res.cssLayoutViewport ?? null,
    cssVisualViewport: res.cssVisualViewport ?? null,
    cssContentSize: res.cssContentSize ?? null,
  };
}

/**
 * 截图，返回 base64。
 */
export async function captureScreenshot(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);

  const {
    format = 'png',
    quality,
    clip,
    fromSurface = true,
    captureBeyondViewport = false,
    optimizeForSpeed,
  } = options || {};

  const params = {
    format,
    fromSurface: !!fromSurface,
    captureBeyondViewport: !!captureBeyondViewport,
  };

  if (quality != null) {
    params.quality = quality;
  }

  if (clip) {
    params.clip = clip;
  }

  if (optimizeForSpeed != null) {
    params.optimizeForSpeed = !!optimizeForSpeed;
  }

  const res = await Page.captureScreenshot(params);
  return res.data ?? '';
}

/**
 * 截取整页，返回 base64。
 */
export async function captureFullPageScreenshot(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const metrics = await getLayoutMetrics(targetId);
  const size = metrics.cssContentSize || metrics.contentSize;

  if (!size) {
    throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to get page content size');
  }

  return captureScreenshot(targetId, {
    ...options,
    captureBeyondViewport: true,
    clip: {
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      scale: 1,
    },
  });
}

/**
 * 获取指定 frame 的资源内容。
 */
export async function getResourceContent(targetId, frameId, url) {
  requireArg(targetId, 'missing targetId');
  requireArg(frameId, 'missing frameId');
  requireArg(url, 'missing url');

  const { Page } = await getClient(targetId);

  const res = await Page.getResourceContent({ frameId, url });

  return {
    content: res.content ?? '',
    base64Encoded: !!res.base64Encoded,
  };
}

/**
 * 获取主文档源码。
 *
 * 注意：
 * - 这里拿到的是主资源内容
 * - 不是执行 JS 后的最新 DOM
 * - 如果要拿运行时 DOM，应使用 Runtime.evaluate
 */
export async function getPageContent(targetId) {
  requireArg(targetId, 'missing targetId');

  const frameTree = await getResourceTree(targetId);

  if (!frameTree?.frame?.id || !frameTree?.frame?.url) {
    throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to resolve main frame');
  }

  const res = await getResourceContent(
    targetId,
    frameTree.frame.id,
    frameTree.frame.url,
  );

  return res.content;
}