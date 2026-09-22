function makeGrid(rows, cols, fill = null) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function rect(grid, r0, r1, c0, c1, value) {
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) {
      if (grid[r] && c >= 0 && c < grid[r].length) {
        grid[r][c] = value;
      }
    }
  }
  return grid;
}

function oval(grid, cx, cy, rx, ry, value) {
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      const nx = (c - cx) / rx;
      const ny = (r - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        grid[r][c] = value;
      }
    }
  }
  return grid;
}

function triangleUp(grid, apexRow, baseRow, cx, halfWidth, value) {
  const span = Math.max(1, baseRow - apexRow);
  for (let r = apexRow; r <= baseRow; r += 1) {
    const ratio = (r - apexRow) / span;
    const width = Math.max(0, Math.round(halfWidth * ratio));
    rect(grid, r, r, cx - width, cx + width, value);
  }
  return grid;
}

/**
 * Scale a pixel grid by an integer factor (nearest-neighbour).
 */
function scaleGrid(grid, scale) {
  if (scale <= 1) return grid;
  const out = [];
  for (const row of grid) {
    const scaledRow = [];
    for (const cell of row) {
      for (let i = 0; i < scale; i += 1) scaledRow.push(cell);
    }
    for (let i = 0; i < scale; i += 1) out.push(scaledRow.slice());
  }
  return out;
}

/**
 * Render a grid of hex colors (or null for transparent) as terminal "pixels"
 * using the unicode upper-half-block character, pairing two grid rows into
 * one terminal line (foreground = top pixel, background = bottom pixel) to
 * get close-to-square pixels. Colors are emitted as blessed tags.
 */
function renderHalfBlocks(grid, scale = 1) {
  const scaled = scaleGrid(grid, scale);
  const lines = [];

  for (let r = 0; r < scaled.length; r += 2) {
    const top = scaled[r];
    const bottom = scaled[r + 1] || top.map(() => null);
    let line = '';

    for (let c = 0; c < top.length; c += 1) {
      const t = top[c];
      const b = bottom[c];

      if (!t && !b) {
        line += ' ';
      } else if (t && b) {
        line += `{${t}-fg}{${b}-bg}▀{/}`;
      } else if (t) {
        line += `{${t}-fg}▀{/}`;
      } else {
        line += `{${b}-fg}▄{/}`;
      }
    }

    lines.push(line);
  }

  return lines.join('\n');
}

module.exports = { makeGrid, rect, oval, triangleUp, scaleGrid, renderHalfBlocks };
