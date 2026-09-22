const test = require('node:test');
const assert = require('node:assert/strict');
const { CHARACTERS, CHARACTER_KEYS, getCharacter } = require('../src/characters');

test('CHARACTER_KEYS lists every character defined in CHARACTERS', () => {
  assert.deepEqual(CHARACTER_KEYS.sort(), Object.keys(CHARACTERS).sort());
  assert.ok(CHARACTER_KEYS.length > 0);
});

test('every character has 3 frames plus a reaction grid, all the same shape', () => {
  for (const key of CHARACTER_KEYS) {
    const character = CHARACTERS[key];
    assert.equal(character.frames.length, 3, `${key} should have 3 frames`);

    const rows = character.frames[0].length;
    const cols = character.frames[0][0].length;

    for (const grid of [...character.frames, character.reaction]) {
      assert.equal(grid.length, rows, `${key} grid row count should be consistent`);
      for (const row of grid) {
        assert.equal(row.length, cols, `${key} grid column count should be consistent`);
      }
    }
  }
});

test('getCharacter returns the requested character', () => {
  assert.equal(getCharacter('chat'), CHARACTERS.chat);
});

test('getCharacter falls back to chien for an unknown name', () => {
  assert.equal(getCharacter('does-not-exist'), CHARACTERS.chien);
  assert.equal(getCharacter(undefined), CHARACTERS.chien);
});
