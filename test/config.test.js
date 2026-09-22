const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CONFIG_MODULE = require.resolve('../src/config');

// config.js resolves ~/.blip from os.homedir() at require time, so each test
// points HOME at a fresh temp dir and re-requires the module to pick it up.
function freshConfig() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'blip-test-'));
  process.env.HOME = home;
  delete require.cache[CONFIG_MODULE];
  return { config: require('../src/config'), home };
}

test('hasConfig is false until ensureConfig has run', () => {
  const { config } = freshConfig();
  assert.equal(config.hasConfig(), false);
  config.ensureConfig({ name: 'Rex' });
  assert.equal(config.hasConfig(), true);
});

test('ensureConfig applies defaults and persists overrides across calls', () => {
  const { config } = freshConfig();
  const first = config.ensureConfig({ name: 'Rex', character: 'chat', size: 2 });
  assert.deepEqual(first, { name: 'Rex', character: 'chat', size: 2, sound: false });

  const second = config.ensureConfig({});
  assert.deepEqual(second, first, 'previously saved values should be reloaded, not reset to defaults');
});

test('ensureConfig falls back to chien for an unknown character', () => {
  const { config } = freshConfig();
  const cfg = config.ensureConfig({ character: 'bogus' });
  assert.equal(cfg.character, 'chien');
});

test('ensureConfig falls back to size 1 for invalid sizes', () => {
  const { config } = freshConfig();
  assert.equal(config.ensureConfig({ size: -5 }).size, 1);
  assert.equal(config.ensureConfig({ size: 0 }).size, 1);
});

test('PID file lifecycle: write, detect alive, remove', () => {
  const { config } = freshConfig();
  assert.equal(config.readPidFile(), null);

  config.writePidFile();
  const pid = config.readPidFile();
  assert.equal(pid, process.pid);
  assert.equal(config.isProcessAlive(pid), true);

  config.removePidFile();
  assert.equal(config.readPidFile(), null);
});

test('isProcessAlive returns false for a pid that does not exist', () => {
  const { config } = freshConfig();
  assert.equal(config.isProcessAlive(999999999), false);
});
