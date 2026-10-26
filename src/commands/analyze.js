import { statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Validate a path and print its absolute form.
 *
 * This is intentionally the only behavior for now. Later versions can build
 * the actual project analysis on top of this command.
 */
export function analyzeCommand(pathArg, cwd) {
  const target = resolve(cwd, pathArg);

  try {
    statSync(target);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return failure(`path does not exist: '${target}'`);
    }

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return failure(`permission denied: '${target}'`);
    }

    return failure(`cannot access path '${target}': ${error.message}`);
  }

  return {
    code: 0,
    stdout: `${target}\n`,
    stderr: '',
  };
}

function failure(message) {
  return {
    code: 1,
    stdout: '',
    stderr: `devpilot: ${message}\n`,
  };
}
