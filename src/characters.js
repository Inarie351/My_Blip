const { makeGrid, rect, oval, triangleUp } = require('./pixelart');

const ROWS = 16;
const COLS = 14;
const BODY = { cx: 7, cy: 9, rx: 5, ry: 4.5 };

const EYE_WHITE = '#ffffff';
const PUPIL = '#141414';
const EYELID = '#141414';
const BLUSH = '#ff9fb2';
const MOUTH = '#141414';

function baseGrid(bodyColor, shadeColor) {
  const grid = makeGrid(ROWS, COLS, null);
  oval(grid, BODY.cx, BODY.cy, BODY.rx, BODY.ry, bodyColor);
  // subtle shading on the lower-right of the body for a bit of depth
  oval(grid, BODY.cx + 1.5, BODY.cy + 1.5, BODY.rx - 1.5, BODY.ry - 1.5, shadeColor);
  oval(grid, BODY.cx - 0.5, BODY.cy - 0.5, BODY.rx - 1, BODY.ry - 1, bodyColor);
  return grid;
}

function addFace(grid, { blink = false, happy = false } = {}) {
  if (blink) {
    rect(grid, 9, 9, 4, 5, EYELID);
    rect(grid, 9, 9, 9, 10, EYELID);
  } else {
    rect(grid, 8, 9, 4, 5, EYE_WHITE);
    rect(grid, 8, 9, 9, 10, EYE_WHITE);
    rect(grid, 9, 9, 5, 5, PUPIL);
    rect(grid, 9, 9, 10, 10, PUPIL);
  }

  rect(grid, 10, 10, 2, 2, BLUSH);
  rect(grid, 10, 10, 11, 11, BLUSH);

  if (happy) {
    rect(grid, 11, 12, 6, 7, MOUTH);
  } else {
    rect(grid, 11, 11, 6, 7, MOUTH);
  }

  return grid;
}

function buildFrames(bodyColor, shadeColor, decorate) {
  const idle = baseGrid(bodyColor, shadeColor);
  decorate(idle, bodyColor, shadeColor);
  addFace(idle, { blink: false });

  const blink = baseGrid(bodyColor, shadeColor);
  decorate(blink, bodyColor, shadeColor);
  addFace(blink, { blink: true });

  const happy = baseGrid(bodyColor, shadeColor);
  decorate(happy, bodyColor, shadeColor);
  addFace(happy, { blink: false, happy: true });

  return { frames: [idle, blink, idle], reaction: happy };
}

const CHARACTERS = {
  chien: {
    label: 'Chien',
    ...buildFrames('#c98a4b', '#a56a2f', (grid, body, shade) => {
      rect(grid, 3, 8, 0, 2, shade);
      rect(grid, 3, 8, 11, 13, shade);
    }),
  },
  chat: {
    label: 'Chat',
    ...buildFrames('#8f8f9c', '#6f6f7c', (grid, body, shade) => {
      triangleUp(grid, 0, 4, 3, 2, shade);
      triangleUp(grid, 0, 4, 10, 2, shade);
      rect(grid, 9, 9, 0, 1, '#e8e8ec');
      rect(grid, 9, 9, 12, 13, '#e8e8ec');
    }),
  },
  lapin: {
    label: 'Lapin',
    ...buildFrames('#eef0f2', '#c9ccd1', (grid, body, shade) => {
      rect(grid, 0, 5, 4, 5, body);
      rect(grid, 0, 5, 9, 10, body);
      rect(grid, 1, 4, 4, 4, shade);
      rect(grid, 1, 4, 10, 10, shade);
    }),
  },
  fille: {
    label: 'Fille',
    ...buildFrames('#ffd9b3', '#e8b98a', (grid, body, shade) => {
      const hair = '#7a4a2b';
      oval(grid, BODY.cx, BODY.cy - 3, BODY.rx + 0.5, BODY.ry - 0.5, hair);
      oval(grid, BODY.cx, BODY.cy + 1, BODY.rx, BODY.ry - 1, body);
      rect(grid, 7, 9, 0, 1, hair);
      rect(grid, 7, 9, 12, 13, hair);
    }),
  },
  garcon: {
    label: 'Garçon',
    ...buildFrames('#ffd9b3', '#e8b98a', (grid, body, shade) => {
      const hair = '#3b2a1a';
      rect(grid, 2, 4, 3, 10, hair);
      rect(grid, 5, 5, 2, 3, hair);
      rect(grid, 5, 5, 10, 11, hair);
    }),
  },
};

const CHARACTER_KEYS = Object.keys(CHARACTERS);

function getCharacter(characterName) {
  return CHARACTERS[characterName] || CHARACTERS.chien;
}

module.exports = { CHARACTERS, CHARACTER_KEYS, getCharacter };
