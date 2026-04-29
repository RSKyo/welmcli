// ========================
// CDP DOM Domain
// ========================

import { getClient } from './client.js';
import { ERROR_CODE, ClientError } from '../infra/protocol.js';

/**
 * 获取文档根节点
 */
export async function getDocument(targetId, options = {}) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.getDocument({
    depth: options.depth ?? -1,
    pierce: options.pierce ?? false,
  });

  return res.root;
}

/**
 * 在指定节点下查找单个元素
 */
export async function querySelector(targetId, nodeId, selector) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!nodeId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing nodeId');
  }

  if (!selector) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.querySelector({
    nodeId,
    selector,
  });

  return res.nodeId || 0;
}

/**
 * 在指定节点下查找多个元素
 */
export async function querySelectorAll(targetId, nodeId, selector) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!nodeId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing nodeId');
  }

  if (!selector) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.querySelectorAll({
    nodeId,
    selector,
  });

  return res.nodeIds ?? [];
}

/**
 * 从文档根节点开始查找单个元素
 */
export async function queryDocumentSelector(targetId, selector) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!selector) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }

  const root = await getDocument(targetId);
  return await querySelector(targetId, root.nodeId, selector);
}

/**
 * 从文档根节点开始查找多个元素
 */
export async function queryDocumentSelectorAll(targetId, selector) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!selector) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }

  const root = await getDocument(targetId);
  return await querySelectorAll(targetId, root.nodeId, selector);
}

/**
 * 描述节点
 */
export async function describeNode(targetId, options = {}) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const payload = {};

  if (options.nodeId) payload.nodeId = options.nodeId;
  if (options.backendNodeId) payload.backendNodeId = options.backendNodeId;
  if (options.objectId) payload.objectId = options.objectId;
  if (options.depth != null) payload.depth = options.depth;
  if (options.pierce != null) payload.pierce = options.pierce;

  if (!payload.nodeId && !payload.backendNodeId && !payload.objectId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing node reference');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.describeNode(payload);
  return res.node;
}

/**
 * 获取节点 attributes
 * 返回扁平数组：[name1, value1, name2, value2, ...]
 */
export async function getAttributes(targetId, nodeId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!nodeId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing nodeId');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.getAttributes({ nodeId });
  return res.attributes ?? [];
}

/**
 * 将 attributes 扁平数组转为对象
 */
export function attributesToObject(attributes = []) {
  const out = {};

  for (let i = 0; i < attributes.length; i += 2) {
    const name = attributes[i];
    const value = attributes[i + 1] ?? '';
    out[name] = value;
  }

  return out;
}

/**
 * 获取 outerHTML
 */
export async function getOuterHTML(targetId, options = {}) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const payload = {};

  if (options.nodeId) payload.nodeId = options.nodeId;
  if (options.backendNodeId) payload.backendNodeId = options.backendNodeId;
  if (options.objectId) payload.objectId = options.objectId;

  if (!payload.nodeId && !payload.backendNodeId && !payload.objectId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing node reference');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.getOuterHTML(payload);
  return res.outerHTML ?? '';
}

/**
 * 获取 box model
 */
export async function getBoxModel(targetId, options = {}) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const payload = {};

  if (options.nodeId) payload.nodeId = options.nodeId;
  if (options.backendNodeId) payload.backendNodeId = options.backendNodeId;
  if (options.objectId) payload.objectId = options.objectId;

  if (!payload.nodeId && !payload.backendNodeId && !payload.objectId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing node reference');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.getBoxModel(payload);
  return res.model ?? null;
}

/**
 * 将 nodeId 解析为 objectId
 */
export async function resolveNode(targetId, nodeId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!nodeId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing nodeId');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.resolveNode({ nodeId });
  return res.object ?? null;
}

/**
 * 将 objectId 解析为 nodeId
 */
export async function requestNode(targetId, objectId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!objectId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing objectId');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  const res = await DOM.requestNode({ objectId });
  return res.nodeId || 0;
}

/**
 * 聚焦节点
 */
export async function focusNode(targetId, nodeId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!nodeId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing nodeId');
  }

  const client = await getClient(targetId);
  const { DOM } = client;

  await DOM.focus({ nodeId });
}

/**
 * 获取元素中心点
 * 返回：{ x, y }
 */
export async function getNodeCenter(targetId, nodeId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!nodeId) {
    throw new ClientError(ERROR_CODE.INVALID_ARGS, 'missing nodeId');
  }

  const model = await getBoxModel(targetId, { nodeId });

  if (!model || !Array.isArray(model.content) || model.content.length < 8) {
    throw new ClientError(ERROR_CODE.INTERNAL_ERROR, 'failed to get box model');
  }

  const quad = model.content;

  const x = (quad[0] + quad[2] + quad[4] + quad[6]) / 4;
  const y = (quad[1] + quad[3] + quad[5] + quad[7]) / 4;

  return { x, y };
}