import { readFileSync } from 'node:fs';

import { analyzeCommand } from './commands/analyze.js';
import { analyzeHelp, mainHelp } from './help.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

export const VERSION = packageJson.version;

const GENERAL_USAGE = "Usage: devpilot <command> [options]";
const ANALYZE_USAGE = 'Usage: devpilot analyze <path>';

export function run(argv, { cwd = process.cwd() } = {}) {
  if (!Array.isArray(argv)) {
    throw new TypeError('argv must be an array');
  }

  if (argv.length === 0) {
    return usageError('missing command');
  }

  const [command, ...rest] = argv;

  if (command === '--help' || command === '-h') {
    return ok(mainHelp(VERSION));
  }

  if (command === '--version' || command === '-v') {
    return ok(`${VERSION}\n`);
  }

  if (command === 'help') {
    return helpCommand(rest);
  }

  if (command === 'analyze') {
    return analyzeCli(rest, cwd);
  }

  if (command.startsWith('-')) {
    return usageError(`unknown option: '${command}'`);
  }

  return usageError(`unknown command: '${command}'`);
}

function helpCommand(args) {
  if (args.length === 0) {
    return ok(mainHelp(VERSION));
  }

  if (args.length > 1) {
    return usageError(`too many arguments for 'help': '${args[1]}'`);
  }

  if (args[0] === 'analyze') {
    return ok(analyzeHelp());
  }

  return usageError(`unknown help topic: '${args[0]}'`);
}

function analyzeCli(args, cwd) {
  const parsed = parseAnalyzeArgs(args);

  if (parsed.help) {
    return ok(analyzeHelp());
  }

  if (parsed.error) {
    return usageError(parsed.error, ANALYZE_USAGE, "Run 'devpilot analyze --help' for more information.");
  }

  return analyzeCommand(parsed.path, cwd);
}

function parseAnalyzeArgs(args) {
  const positionals = [];
  let endOfOptions = false;

  for (const arg of args) {
    if (!endOfOptions && arg === '--') {
      endOfOptions = true;
      continue;
    }

    if (!endOfOptions && (arg === '--help' || arg === '-h')) {
      return { help: true };
    }

    if (!endOfOptions && arg.startsWith('-')) {
      return { error: `unknown option: '${arg}'` };
    }

    positionals.push(arg);
  }

  if (positionals.length === 0) {
    return { error: 'missing required argument: <path>' };
  }

  if (positionals.length > 1) {
    return { error: `too many arguments: '${positionals[1]}'` };
  }

  if (positionals[0].length === 0) {
    return { error: 'path must not be empty' };
  }

  return { path: positionals[0] };
}

function ok(stdout) {
  return { code: 0, stdout, stderr: '' };
}

function usageError(message, usage = GENERAL_USAGE, hint = "Run 'devpilot --help' for more information.") {
  return {
    code: 2,
    stdout: '',
    stderr: `devpilot: ${message}\n\n${usage}\n${hint}\n`,
  };
}
