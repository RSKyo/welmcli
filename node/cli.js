import { run } from './infra/protocol.js';
import { ACTION_COMMANDS } from './cmd/action.js';
import { DOM_COMMANDS } from './cmd/dom.js';
import { EMU_COMMANDS } from './cmd/emu.js';
import { INPUT_COMMANDS } from './cmd/input.js';
import { PAGE_COMMANDS } from './cmd/page.js';
import { TARGET_COMMANDS } from './cmd/target.js';
import { WAIT_COMMANDS } from './cmd/wait.js';

// 一级命令分组
const GROUP_COMMANDS = {
  action: ACTION_COMMANDS,
  dom: DOM_COMMANDS,
  emu: EMU_COMMANDS,
  input: INPUT_COMMANDS,
  page: PAGE_COMMANDS,
  target: TARGET_COMMANDS,
  wait: WAIT_COMMANDS,
};

run(async () => {
  const { handler, args, options, group, cmd } = resolveCommand(process.argv, GROUP_COMMANDS);
  return await handler({ group, cmd, args, options });
});

function resolveCommand(argv, groupCommands) {
  const [, , group, cmd, ...rest] = argv;

  const groupNames = Object.keys(groupCommands).join(', ');

  if (!group) {
    throw new ClientError(
      ERROR_CODE.MISSING_CMD,
      `missing command group, expected one of: ${groupNames}`
    );
  }

  if (!Object.hasOwn(groupCommands, group)) {
    throw new ClientError(
      ERROR_CODE.INVALID_CMD,
      `unknown command group: ${group}, expected one of: ${groupNames}`
    );
  }

  const commands = groupCommands[group];
  const cmdNames = Object.keys(commands).join(', ');

  if (!cmd) {
    throw new ClientError(
      ERROR_CODE.MISSING_CMD,
      `missing command, expected one of: ${cmdNames}`
    );
  }

  if (!Object.hasOwn(commands, cmd)) {
    throw new ClientError(
      ERROR_CODE.INVALID_CMD,
      `unknown command: ${cmd}, expected one of: ${cmdNames}`
    );
  }

  const { args, options } = splitArgsAndOptions(rest);

  return {
    group,
    cmd,
    args,
    options,
    commands,
    handler: commands[cmd],
  };
}

function splitArgsAndOptions(argv = []) {
  const args = [];
  const options = {};

  for (const part of argv) {
    if (part.startsWith('--')) {
      const body = part.slice(2);
      const eqIndex = body.indexOf('=');

      if (eqIndex === -1) {
        options[body] = true;
        continue;
      }

      const key = body.slice(0, eqIndex);
      const value = body.slice(eqIndex + 1);

      options[key] = value;
      continue;
    }

    args.push(part);
  }

  return { args, options };
}