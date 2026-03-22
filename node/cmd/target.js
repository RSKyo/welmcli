// ========================
// CLI target commands
// ========================
import { normalizeUrl } from '../infra/url.js';

import {
  listTargets,
  hasTarget,
  newTarget,
  activateTarget,
  closeTarget,
  findTarget,
  currentTarget,
} from '../cdp/target.js';

// target 命令注册表
export const TARGET_COMMANDS = {
  list: cmd_list,
  has: cmd_has,
  new: cmd_new,
  open: cmd_open,
  activate: cmd_activate,
  close: cmd_close,
  find: cmd_find,
  current: cmd_current,
};

async function cmd_list() {
  return await listTargets();
}

async function cmd_has(args) {
  const [targetId] = args;
  return await hasTarget(targetId);
}

async function cmd_new(args) {
  const [url] = args;
  return await newTarget(url);
}

async function cmd_open(args) {
  const [url] = args;

  const inputUrl = normalizeUrl(url);

  const targets = await listTargets();
  const target = targets.find(t => normalizeUrl(t.url) === inputUrl);

  if (target) {
    await activateTarget(target.id);
    return target.id;
  }

  return await newTarget(url);
}

async function cmd_activate(args) {
  const [targetId] = args;
  await activateTarget(targetId);
}

async function cmd_close(args) {
  const [targetId] = args;
  await closeTarget(targetId);
}

async function cmd_find(args) {
  const [keyword] = args;
  return await findTarget(keyword);
}

async function cmd_current() {
  return await currentTarget();
}