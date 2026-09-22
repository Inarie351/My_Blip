const blessed = require('blessed');
const { writePidFile, removePidFile } = require('./config');
const { getCharacter } = require('./characters');
const { renderHalfBlocks } = require('./pixelart');
const sound = require('./sound');

function createScreen() {
  const screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    title: 'My_Blip',
    fullUnicode: true,
    dockBorders: false,
    debug: false,
    warnings: false,
    mouse: true,
  });

  return screen;
}

function spriteSize(character, size) {
  const grid = character.frames[0];
  const cols = grid[0].length * size;
  const rows = Math.ceil(grid.length / 2) * size;
  return { width: cols, height: rows };
}

function drawCharacter(screen, config) {
  const character = getCharacter(config.character);
  const { width, height } = spriteSize(character, config.size || 1);

  const box = blessed.box({
    parent: screen,
    top: 1,
    left: 1,
    width: width + 2,
    height: height + 3,
    tags: true,
    border: 'line',
    style: { border: { fg: 'white' } },
  });

  const spriteBox = blessed.box({
    parent: box,
    top: 1,
    left: 'center',
    width: width,
    height: height,
    tags: true,
    content: renderHalfBlocks(character.frames[0], config.size || 1),
  });

  const label = blessed.box({
    parent: box,
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    content: ` ${config.name} `,
    align: 'center',
    style: { fg: 'yellow', bold: true },
  });

  return { box, spriteBox, label };
}

function setStatus(label, name, status) {
  label.setContent(status ? ` ${name} · ${status} ` : ` ${name} `);
}

function flashStatus(screen, label, name, status, duration = 700) {
  setStatus(label, name, status);
  screen.render();
  setTimeout(() => {
    setStatus(label, name);
    screen.render();
  }, duration);
}

function animate(screen, config, character, box, spriteBox) {
  let frameIndex = 0;
  let left = 1;
  let top = 1;
  let directionX = 1;
  let directionY = 1;

  const interval = setInterval(() => {
    const screenWidth = screen.width || 80;
    const screenHeight = screen.height || 24;
    const maxX = Math.max(2, screenWidth - box.width - 2);
    const maxY = Math.max(2, screenHeight - box.height - 2);

    left += directionX;
    top += directionY;

    if (left <= 1 || left >= maxX) directionX *= -1;
    if (top <= 1 || top >= maxY) directionY *= -1;

    box.left = left;
    box.top = top;

    // Cycle through idle/blink frames for a bit of life; frame 1 is the blink.
    frameIndex = (frameIndex + 1) % 20;
    const grid = frameIndex === 0 ? character.frames[1] : character.frames[0];
    spriteBox.setContent(renderHalfBlocks(grid, config.size || 1));

    screen.render();
  }, 250);

  screen.on('destroy', () => clearInterval(interval));

  return () => clearInterval(interval);
}

function reactHappy(screen, config, character, spriteBox) {
  spriteBox.setContent(renderHalfBlocks(character.reaction, config.size || 1));
  screen.render();
  setTimeout(() => {
    spriteBox.setContent(renderHalfBlocks(character.frames[0], config.size || 1));
    screen.render();
  }, 500);
}

function startSoundMode(screen, config, character, spriteBox, label, onFallbackToClick) {
  let controller;

  try {
    controller = sound.startListening({
      name: config.name,
      onSpeech: () => {
        flashStatus(screen, label, config.name, 'écoute…', 300);
      },
      onWakeWord: () => {
        reactHappy(screen, config, character, spriteBox);
        flashStatus(screen, label, config.name, 'Oui ?', 900);
      },
      onError: () => {
        flashStatus(screen, label, config.name, 'erreur micro', 1500);
      },
    });
  } catch (error) {
    flashStatus(screen, label, config.name, 'mode son indisponible', 3000);
    console.error(error.message);
    onFallbackToClick();
    return null;
  }

  setStatus(label, config.name, 'mode son');
  screen.render();
  return controller;
}

function startRuntime(config) {
  const screen = createScreen();
  const character = getCharacter(config.character);
  const { box, spriteBox, label } = drawCharacter(screen, config);

  writePidFile();

  let soundController = null;
  let soundActive = false;

  function stopSound() {
    if (soundController) {
      soundController.stop();
      soundController = null;
    }
    soundActive = false;
    setStatus(label, config.name);
    screen.render();
  }

  function cleanupAndExit() {
    stopSound();
    removePidFile();
    screen.destroy();
    process.exit(0);
  }

  box.on('click', () => {
    reactHappy(screen, config, character, spriteBox);
    flashStatus(screen, label, config.name, Math.random() > 0.5 ? 'Coucou !' : 'Hey !');
  });

  screen.key(['escape', 'q', 'C-c'], cleanupAndExit);
  process.on('SIGTERM', cleanupAndExit);
  process.on('SIGINT', cleanupAndExit);

  // Non-destructive mode switch: leave sound mode without exiting the program.
  screen.key(['s', 'S'], () => {
    if (soundActive) {
      stopSound();
    }
  });

  animate(screen, config, character, box, spriteBox);

  if (config.sound) {
    soundController = startSoundMode(screen, config, character, spriteBox, label, () => {
      soundActive = false;
    });
    soundActive = Boolean(soundController);
  }

  screen.render();
}

module.exports = { startRuntime };
