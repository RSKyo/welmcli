// ========================
// CDP Client (session manager)
// ========================

import CDP from 'chrome-remote-interface'
import { HOST, PORT } from '../infra/env.js'
import { ERROR_CODE, ClientError } from '../infra/protocol.js';

/**
 * targetId -> client
 */
const CLIENT_POOL = new Map();

/**
 * 获取 client（自动复用）
 */
export async function getClient(targetId) {
  if (!targetId) {
    throw new ClientError(ERROR_CODE.MISSING_TARGET_ID, 'missing targetId');
  }

  if (CLIENT_POOL.has(targetId)) {
    return CLIENT_POOL.get(targetId);
  }

  const client = await CDP({
    target: targetId,
    host: HOST,
    port: PORT,
  });

  CLIENT_POOL.set(targetId, client);

  return client;
}

/**
 * 关闭 client
 */
export async function closeClient(targetId) {
  const client = CLIENT_POOL.get(targetId);

  if (!client) return;

  try {
    await client.close();
  } catch (_) {
    // ignore
  }

  CLIENT_POOL.delete(targetId);
}

/**
 * 清理所有 client
 */
export async function closeAllClients() {
  const tasks = [];

  for (const [id, client] of CLIENT_POOL) {
    tasks.push(
      client.close().catch(() => {})
    );
  }

  await Promise.all(tasks);

  CLIENT_POOL.clear();
}