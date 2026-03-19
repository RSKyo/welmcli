import CDP from 'chrome-remote-interface';
import { respondOk } from '../runtime/core.js';

async function listTabs() {
  return await CDP.List({ host: HOST, port: PORT });
}

export async function findTab(keyword, idOnly) {
  if (!keyword) throw new Error('missing keyword');

  const tabs = await listTabs();

  const tab = tabs.find(t =>
    (t.url && t.url.includes(keyword)) ||
    (t.title && t.title.includes(keyword))
  );

  if (!tab) {
    throw new Error('tab not found');
  }

  if (idOnly) {
    respondOk(tab.id);
  } else {
    respondOk({
      id: tab.id,
      type: tab.type ?? '',
      title: tab.title ?? '',
      url: tab.url ?? '',
    });
  }
}

