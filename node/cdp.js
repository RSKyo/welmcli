import { runCmd, respondError } from './runtime/core.js';
import { findTab } from './chrome/tab.js';
import { evalPage, text } from './runtime/page.js';

async function main() {
  const [, , cmd, ...args] = process.argv;

  if (!cmd) {
    respondError(new Error('missing cmd'))
    process.exit(1);
  }

  switch (cmd) {
    case 'find-tab-id': {
      const keyword = args[0];
      await runCmd(() => findTab(keyword, true));
      break;
    }

    case 'find-tab': {
      const keyword = args[0];
      await runCmd(() => findTab(keyword, false));
      break;
    }

    case 'eval': {
      const [tabId, expression] = args;
      await runCmd(() => evalPage(tabId, expression));
      break;
    }

    case 'text': {
      const [tabId, selector] = args;
      await runCmd(() => text(tabId, selector));
      break;
    }

    default:
      respondError(new Error(`unknown command: ${cmd}`))
      process.exit(1);
  }
}

await main();