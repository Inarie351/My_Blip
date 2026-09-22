const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGrid, rect, oval, triangleUp, scaleGrid, renderHalfBlocks } = require('../src/pixelart');

test('makeGrid creates rows x cols filled with the given value', () => {
  const grid = makeGrid(3, 4, null);
  assert.equal(grid.length, 3);
  for (const row of grid) {
    assert.equal(row.length, 4);
    assert.ok(row.every((cell) => cell === null));
  }
});

test('rect fills the requested region and clips out-of-bounds columns', () => {
  const grid = makeGrid(4, 4, null);
  rect(grid, 1, 2, -1, 5, '#fff');
  assert.deepEqual(grid[0], [null, null, null, null]);
  assert.deepEqual(grid[1], ['#fff', '#fff', '#fff', '#fff']);
  assert.deepEqual(grid[2], ['#fff', '#fff', '#fff', '#fff']);
  assert.deepEqual(grid[3], [null, null, null, null]);
});

test('oval fills a region roughly centered on (cx, cy)', () => {
  const grid = makeGrid(5, 5, null);
  oval(grid, 2, 2, 2, 2, '#f00');
  assert.equal(grid[2][2], '#f00');
  assert.equal(grid[0][0], null, 'corner should be outside the ellipse');
});

test('triangleUp widens from apex to base', () => {
  const grid = makeGrid(4, 7, null);
  triangleUp(grid, 0, 3, 3, 3, '#0f0');
  const widthAt = (r) => grid[r].filter((c) => c === '#0f0').length;
  assert.ok(widthAt(0) <= widthAt(3), 'base row should be at least as wide as the apex row');
});

test('scaleGrid returns the same grid for scale <= 1', () => {
  const grid = makeGrid(2, 2, 'x');
  assert.equal(scaleGrid(grid, 1), grid);
});

test('scaleGrid multiplies both dimensions by the integer factor', () => {
  const grid = [
    ['a', 'b'],
    ['c', 'd'],
  ];
  const scaled = scaleGrid(grid, 2);
  assert.equal(scaled.length, 4);
  assert.ok(scaled.every((row) => row.length === 4));
  assert.deepEqual(scaled[0], ['a', 'a', 'b', 'b']);
  assert.deepEqual(scaled[2], ['c', 'c', 'd', 'd']);
});

test('renderHalfBlocks pairs two grid rows per output line', () => {
  const grid = makeGrid(4, 2, null);
  const output = renderHalfBlocks(grid, 1);
  assert.equal(output.split('\n').length, 2, 'ceil(rows / 2) lines expected');
});

test('renderHalfBlocks emits a plain space for a fully transparent cell', () => {
  const grid = makeGrid(2, 1, null);
  assert.equal(renderHalfBlocks(grid, 1), ' ');
});

test('renderHalfBlocks emits fg+bg tags when both top and bottom pixels are set', () => {
  const grid = [['#111'], ['#222']];
  assert.equal(renderHalfBlocks(grid, 1), '{#111-fg}{#222-bg}▀{/}');
});
