const fs = require('fs');
const path = require('path');
const os = require('os');

const BLIP_DIR = path.join(os.homedir(), '.blip');
const CONFIG_PATH = path.join(BLIP_DIR, 'config.json');
const PID_PATH = path.join(BLIP_DIR, 'blip.pid');

function ensureBlipDir() {
  if (!fs.existsSync(BLIP_DIR)) {
    fs.mkdirSync(BLIP_DIR, { recursive: true });
  }
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function saveConfig(config) {
  ensureBlipDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function getDefaultConfig() {
  return {
    name: 'Blip',
    character: 'chien',
    size: 1,
    sound: false,
  };
}

function hasConfig() {
  return fs.existsSync(CONFIG_PATH);
}

function ensureConfig({ name, character, size, sound } = {}) {
  const existing = loadConfig() || getDefaultConfig();
  const next = {
    ...existing,
    ...(name ? { name } : {}),
    ...(character ? { character } : {}),
    ...(Number.isInteger(size) ? { size } : {}),
    ...(typeof sound === 'boolean' ? { sound } : {}),
  };

  if (!['chien', 'chat', 'lapin', 'fille', 'garcon'].includes(next.character)) {
    next.character = 'chien';
  }

  if (!Number.isInteger(next.size) || next.size < 1) {
    next.size = 1;
  }

  saveConfig(next);
  return next;
}

function isProcessAlive(pid) {
  if (!pid) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch (_error) {
    return false;
  }
}

function writePidFile() {
  ensureBlipDir();
  fs.writeFileSync(PID_PATH, String(process.pid), 'utf8');
}

function readPidFile() {
  if (!fs.existsSync(PID_PATH)) {
    return null;
  }

  try {
    const pid = Number(fs.readFileSync(PID_PATH, 'utf8').trim());
    return Number.isFinite(pid) ? pid : null;
  } catch (_error) {
    return null;
  }
}

function removePidFile() {
  if (fs.existsSync(PID_PATH)) {
    fs.unlinkSync(PID_PATH);
  }
}

module.exports = {
  CONFIG_PATH,
  PID_PATH,
  ensureConfig,
  hasConfig,
  loadConfig,
  saveConfig,
  removePidFile,
  readPidFile,
  writePidFile,
  isProcessAlive,
};
