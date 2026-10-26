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
