import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { run, VERSION } from '../src/cli.js';

const tempDir = mkdtempSync(join(tmpdir(), 'devpilot-test-'));
const projectDir = join(tempDir, 'project');
const filePath = join(tempDir, 'notes.txt');
const binPath = fileURLToPath(new URL('../bin/devpilot.js', import.meta.url));
const packagePath = fileURLToPath(new URL('../package.json', import.meta.url));

mkdirSync(projectDir);
writeFileSync(filePath, 'hello\n');

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

test('--help prints usage and exits 0', () => {
  const result = run(['--help']);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /analyze <path>/);
  assert.match(result.stdout, /--version/);
  assert.equal(result.stderr, '');
});

test('--version prints the package version', () => {
  const result = run(['--version']);
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

  assert.equal(result.code, 0);
  assert.equal(result.stdout, `${packageJson.version}\n`);
  assert.equal(VERSION, packageJson.version);
});

test('help analyze prints command-specific help', () => {
  const result = run(['help', 'analyze']);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /devpilot analyze <path>/);
  assert.equal(result.stderr, '');
});

test('analyze prints an absolute path for a directory', () => {
  const result = run(['analyze', projectDir]);

  assert.equal(result.code, 0);
  assert.equal(result.stdout, `${projectDir}\n`);
  assert.equal(result.stderr, '');
});

test('analyze resolves a relative path against the working directory', () => {
  const result = run(['analyze', './project'], { cwd: tempDir });

  assert.equal(result.code, 0);
  assert.equal(result.stdout, `${projectDir}\n`);
});

test('analyze accepts a file', () => {
  const result = run(['analyze', filePath]);

  assert.equal(result.code, 0);
  assert.equal(result.stdout, `${filePath}\n`);
});

test('analyze supports paths beginning with a dash after --', () => {
  const dashPath = join(tempDir, '--help');
  writeFileSync(dashPath, 'not an option\n');

  const result = run(['analyze', '--', '--help'], { cwd: tempDir });

  assert.equal(result.code, 0);
  assert.equal(result.stdout, `${dashPath}\n`);
});

test('analyze rejects a missing path with exit code 2', () => {
  const result = run(['analyze']);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /missing required argument: <path>/);
  assert.equal(result.stdout, '');
});

test('analyze rejects a nonexistent path with exit code 1', () => {
  const missingPath = join(tempDir, 'does-not-exist');
  const result = run(['analyze', missingPath]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /path does not exist/);
  assert.equal(result.stdout, '');
});

test('analyze rejects extra arguments with exit code 2', () => {
  const result = run(['analyze', projectDir, 'extra']);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /too many arguments/);
});

test('analyze rejects unknown options with exit code 2', () => {
  const result = run(['analyze', '--json']);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /unknown option: '--json'/);
});

test('an unknown command exits with code 2', () => {
  const result = run(['inspect']);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /unknown command: 'inspect'/);
  assert.match(result.stderr, /devpilot --help/);
});

test('no arguments exits with code 2', () => {
  const result = run([]);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /missing command/);
});

test('the executable wrapper forwards output and exit codes', () => {
  const result = spawnSync(process.execPath, [binPath, '--version'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout, `${VERSION}\n`);
  assert.equal(result.stderr, '');
});

test('the executable wrapper reports usage errors without a stack trace', () => {
  const result = spawnSync(process.execPath, [binPath, 'analyze'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /missing required argument/);
  assert.doesNotMatch(result.stderr, /at .*\.js:\d+/);
});
