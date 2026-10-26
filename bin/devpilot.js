#!/usr/bin/env node

import { run } from '../src/cli.js';

try {
  const result = run(process.argv.slice(2));

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  process.exitCode = result.code;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`devpilot: unexpected error: ${message}\n`);

  if (process.env.DEVPILOT_DEBUG === '1' && error instanceof Error && error.stack) {
    process.stderr.write(`${error.stack}\n`);
  }

  process.exitCode = 1;
}
