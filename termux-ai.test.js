'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { safeContextFile, readContext, stripFence, makeDiff, insideWorkspace, isAutoEditable, autoCommandSpec, maskToken } = require('./termux-ai.js');

test('secret paths are excluded from model context', () => {
  assert.equal(safeContextFile('/project/.env'), false);
  assert.equal(safeContextFile('/project/config/api.key'), false);
  assert.equal(safeContextFile('/project/secrets.json'), false);
  assert.equal(safeContextFile('/project/id_ed25519'), false);
});

test('regular JavaScript source can be included', () => {
  assert.equal(safeContextFile('/project/src/main.js'), true);
});

test('directory context skips environment secrets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'termux-ai-test-'));
  try {
    fs.writeFileSync(path.join(root, 'app.js'), "console.log('ok')\n");
    fs.writeFileSync(path.join(root, '.env'), 'TOKEN=do-not-send');
    const context = readContext([root]);
    assert.match(context, /app\.js/);
    assert.doesNotMatch(context, /do-not-send/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('markdown fences are removed from proposed source', () => {
  assert.equal(stripFence('```js\nconsole.log(1)\n```'), 'console.log(1)\n');
});

test('edit diff shows only changed lines with nearby context', () => {
  const diff = makeDiff('one\ntwo\nthree\n', 'one\nchanged\nthree\n', 'file.js');
  assert.match(diff, /-two/);
  assert.match(diff, /\+changed/);
  assert.match(diff, /--- file\.js/);
});

test('workspace path checks reject traversal and external symlinks', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'termux-ai-scope-'));
  const root = path.join(base, 'workspace');
  const outside = path.join(base, 'outside.txt');
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'app.js'), 'ok');
  fs.writeFileSync(outside, 'private');
  try {
    assert.equal(insideWorkspace(root, 'app.js'), path.join(root, 'app.js'));
    assert.throws(() => insideWorkspace(root, '../outside.txt'), /outside|folder proyek/i);
    fs.symlinkSync(outside, path.join(root, 'link.txt'));
    assert.throws(() => insideWorkspace(root, 'link.txt'), /Symlink\/path berada di luar/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('automatic edits exclude package configuration and include source files only', () => {
  assert.equal(isAutoEditable('/project/src/app.js'), true);
  assert.equal(isAutoEditable('/project/package.json'), false);
  assert.equal(isAutoEditable('/project/.env'), false);
});

test('automatic command allowlist rejects shell injection and npm scripts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'termux-ai-allow-'));
  try {
    fs.writeFileSync(path.join(root, 'app.js'), 'const x = 1;');
    assert.ok(autoCommandSpec('git status --short', root));
    assert.ok(autoCommandSpec('git diff --check', root));
    assert.ok(autoCommandSpec('node --check app.js', root));
    assert.equal(autoCommandSpec('npm test', root), null);
    assert.equal(autoCommandSpec('git status --short; touch /tmp/bad', root), null);
    assert.equal(autoCommandSpec('node --check ../outside.js', root), null);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('token status never reveals the full API token', () => {
  assert.equal(maskToken(''), 'belum diatur');
  assert.equal(maskToken('super-secret-token'), 'tersimpan (••••oken)');
  assert.doesNotMatch(maskToken('super-secret-token'), /super-secret-token/);
});
