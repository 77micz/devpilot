// 帮助文本单独放在这里，修改命令说明时不必翻找参数解析逻辑。
// 这里返回纯字符串，由 cli.js 决定写到 stdout 还是 stderr。

/**
 * 生成总帮助文本。
 *
 * @param {string} version 当前版本号。
 * @returns {string}
 */
export function mainHelp(version) {
  return `devpilot ${version} - project analysis from the command line

Usage:
  devpilot <command> [options]
  devpilot analyze <path>

Commands:
  analyze <path>   Validate a path and print its absolute path
  help [command]   Show help for a command

Options:
  -h, --help       Show help
  -v, --version    Show version

Examples:
  devpilot analyze .
  devpilot analyze ./src
`;
}

/**
 * 生成 analyze 子命令的帮助文本。
 *
 * @returns {string}
 */
export function analyzeHelp() {
  return `Validate that a path exists, then print its absolute path.

Usage:
  devpilot analyze <path>

Arguments:
  path   File or directory to analyze

Options:
  -h, --help   Show help for this command

Examples:
  devpilot analyze .
  devpilot analyze ./src
`;
}
