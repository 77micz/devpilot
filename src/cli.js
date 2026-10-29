// CLI 的“大脑”：解析参数、决定执行哪个命令，并统一组织输出结果。
// 这里不直接打印内容，而是返回 { code, stdout, stderr }，方便测试和复用。

import { readFileSync } from 'node:fs';

import { analyzeCommand } from './commands/analyze.js';
import { analyzeHelp, mainHelp } from './help.js';

/**
 * 一次 CLI 执行的结果。
 * code 是进程退出码，stdout/stderr 分别对应正常输出和错误输出。
 *
 * @typedef {{ code: number, stdout: string, stderr: string }} CliResult
 */

// package.json 是版本的唯一来源，避免代码里再手写一份导致版本不一致。
// import.meta.url 是当前文件地址；new URL('../package.json', ...) 指向项目根目录。
const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

export const VERSION = packageJson.version;

// 约定：0 = 成功，1 = 运行时错误，2 = 用法错误（参数写错了）。
const GENERAL_USAGE = 'Usage: devpilot <command> [options]';
const ANALYZE_USAGE = 'Usage: devpilot analyze <path>';

/**
 * 执行一次 CLI 调用。
 *
 * @param {string[]} argv 用户参数，不包含 node 和脚本路径，例如 ['analyze', '.']。
 * @param {{ cwd?: string }} [options] cwd 可以注入，测试时不必切换真实工作目录。
 * @returns {CliResult}
 */
export function run(argv, { cwd = process.cwd() } = {}) {
  // argv 不是数组属于程序调用错误，直接抛出，让开发者尽早发现。
  if (!Array.isArray(argv)) {
    throw new TypeError('argv must be an array');
  }

  // 用户什么都没输入时，提示缺少命令。
  if (argv.length === 0) {
    return usageError('missing command');
  }

  // 第一个参数是命令，剩下的是该命令的参数。
  // 例如 ['analyze', '.'] -> command = 'analyze'，rest = ['.']。
  const [command, ...rest] = argv;

  // 全局帮助和版本选项只认第一个位置，例如 devpilot --help。
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

  // 以 - 开头但不是已知选项，例如 --unknown。
  if (command.startsWith('-')) {
    return usageError(`unknown option: '${command}'`);
  }

  // 其余情况就是用户输入了不存在的命令。
  return usageError(`unknown command: '${command}'`);
}

/**
 * 处理 devpilot help 和 devpilot help analyze。
 *
 * @param {string[]} args help 后面的参数。
 * @returns {CliResult}
 */
function helpCommand(args) {
  // 只输入 help：显示总帮助。
  if (args.length === 0) {
    return ok(mainHelp(VERSION));
  }

  // help 最多接受一个主题，多了就属于用法错误。
  if (args.length > 1) {
    return usageError(`too many arguments for 'help': '${args[1]}'`);
  }

  if (args[0] === 'analyze') {
    return ok(analyzeHelp());
  }

  return usageError(`unknown help topic: '${args[0]}'`);
}

/**
 * 处理 devpilot analyze 的参数并执行命令。
 *
 * @param {string[]} args analyze 后面的参数。
 * @param {string} cwd 当前工作目录。
 * @returns {CliResult}
 */
function analyzeCli(args, cwd) {
  // parseAnalyzeArgs 只会返回三种结果之一：
  // { help: true }、{ error: '...' } 或 { path: '...' }。
  const parsed = parseAnalyzeArgs(args);

  // 用户在 analyze 后面写了 -h/--help，优先显示帮助。
  if (parsed.help) {
    return ok(analyzeHelp());
  }

  // 参数不合法属于“用法错误”，退出码用 2；路径不存在才是 1。
  if (parsed.error) {
    return usageError(
      parsed.error,
      ANALYZE_USAGE,
      "Run 'devpilot analyze --help' for more information.",
    );
  }

  return analyzeCommand(parsed.path, cwd);
}

/**
 * 解析 analyze 命令的参数。
 * 支持 `--` 结束选项解析，这样以 - 开头的文件名也能作为路径。
 *
 * @param {string[]} args analyze 后面的参数。
 * @returns {{ help: true } | { error: string } | { path: string }}
 */
function parseAnalyzeArgs(args) {
  // positionals 保存“不是选项”的参数，正常情况下最终只有一个路径。
  const positionals = [];
  // 遇到单独的 -- 后，后面的内容即使以 - 开头也当成普通路径。
  let endOfOptions = false;

  for (const arg of args) {
    // `devpilot analyze -- --help` 中的 --help 是文件名，不是帮助选项。
    if (!endOfOptions && arg === '--') {
      endOfOptions = true;
      continue;
    }

    // 选项只识别 -- 之前的内容。
    if (!endOfOptions && (arg === '--help' || arg === '-h')) {
      return { help: true };
    }

    // 其他以 - 开头的内容视为未知选项，例如 --json。
    if (!endOfOptions && arg.startsWith('-')) {
      return { error: `unknown option: '${arg}'` };
    }

    positionals.push(arg);
  }

  // 没有路径、路径多于一个、或者路径是空字符串，都属于用法错误。
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

/**
 * 成功结果：退出码 0，只写 stdout。
 *
 * @param {string} stdout 要输出给用户的正常内容。
 * @returns {CliResult}
 */
function ok(stdout) {
  return { code: 0, stdout, stderr: '' };
}

/**
 * 用法错误：退出码 2，只写 stderr。
 * stdout 保持为空，脚本就能通过输出内容判断是否成功。
 *
 * @param {string} message 具体错误。
 * @param {string} [usage] 用法提示。
 * @param {string} [hint] 进一步操作的提示。
 * @returns {CliResult}
 */
function usageError(
  message,
  usage = GENERAL_USAGE,
  hint = "Run 'devpilot --help' for more information.",
) {
  return {
    code: 2,
    stdout: '',
    stderr: `devpilot: ${message}\n\n${usage}\n${hint}\n`,
  };
}
