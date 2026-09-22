const { spawnSync, spawn } = require('child_process');

function isInsideTmux() {
  return Boolean(process.env.TMUX);
}

function isTmuxAvailable() {
  const result = spawnSync('tmux', ['-V']);
  return !result.error && result.status === 0;
}

/**
 * Split the current tmux window and run `command` in the new pane, without
 * stealing focus from the pane the user is already working in.
 */
function splitPaneHere(command, args) {
  const result = spawnSync('tmux', [
    'split-window',
    '-h',
    '-d',
    '-c',
    process.cwd(),
    command,
    ...args,
  ]);

  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString() : '';
    throw new Error(`tmux split-window a échoué : ${stderr || result.error}`);
  }
}

/**
 * Not currently inside tmux: create a new tmux session with the user's own
 * shell in one pane and the character in the other, then attach to it so the
 * current terminal becomes that session (the user keeps working in the shell
 * pane exactly as before).
 */
function launchSessionWithShell(command, args) {
  const sessionName = `blip-${process.pid}`;
  const shell = process.env.SHELL || '/bin/sh';

  let result = spawnSync('tmux', ['new-session', '-d', '-s', sessionName, '-c', process.cwd(), shell]);
  if (result.status !== 0) {
    throw new Error('Impossible de créer une session tmux.');
  }

  result = spawnSync('tmux', [
    'split-window',
    '-h',
    '-t',
    `${sessionName}:0`,
    '-c',
    process.cwd(),
    command,
    ...args,
  ]);
  if (result.status !== 0) {
    spawnSync('tmux', ['kill-session', '-t', sessionName]);
    throw new Error('Impossible de créer le pane du personnage.');
  }

  spawnSync('tmux', ['select-pane', '-t', `${sessionName}:0.0`]);

  const attach = spawn('tmux', ['attach-session', '-t', sessionName], { stdio: 'inherit' });
  return new Promise((resolve) => {
    attach.on('exit', () => resolve());
  });
}

module.exports = { isInsideTmux, isTmuxAvailable, splitPaneHere, launchSessionWithShell };
