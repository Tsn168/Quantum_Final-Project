// sudoku.js
// Owner: Reach
// Small Sudoku helpers for the frontend: rule checks, a solution counter and a puzzle
// generator that mirrors backend/puzzle_generator (used by the mock backend).
// Boards are lists of rows; 0 means an empty cell.

export const LEVELS = {
  // [size, [boxRows, boxCols], [min clues, max clues]]
  // Easy stays at 7–10 clues: the Grover circuit is sized for that many blanks.
  easy: { size: 4, box: [2, 2], clues: [7, 10] },
  // Hard: 24–28 clues (was 36–42). Fewer numbers to start from, still one solution.
  hard: { size: 9, box: [3, 3], clues: [24, 28] },
};

const copy = board => board.map(row => [...row]);

// Can `digit` go at (row, col) without breaking a row, column or box rule?
export function canPlace(board, row, col, digit, box) {
  const size = board.length;
  const [boxRows, boxCols] = box;
  for (let i = 0; i < size; i++) {
    if (i !== col && board[row][i] === digit) return false;
    if (i !== row && board[i][col] === digit) return false;
  }
  const top  = Math.floor(row / boxRows) * boxRows;
  const left = Math.floor(col / boxCols) * boxCols;
  for (let r = top; r < top + boxRows; r++) {
    for (let c = left; c < left + boxCols; c++) {
      if ((r !== row || c !== col) && board[r][c] === digit) return false;
    }
  }
  return true;
}

// Count solutions, stopping at `limit`. Picks the cell with the fewest candidates first.
export function countSolutions(board, box, limit = 2) {
  const work = copy(board);
  const size = work.length;
  let found = 0;

  function search() {
    let best = null;
    let bestCandidates = null;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (work[r][c] !== 0) continue;
        const candidates = [];
        for (let d = 1; d <= size; d++) if (canPlace(work, r, c, d, box)) candidates.push(d);
        if (candidates.length === 0) return;
        if (!best || candidates.length < bestCandidates.length) {
          best = [r, c];
          bestCandidates = candidates;
        }
      }
    }
    if (!best) { found++; return; }
    const [r, c] = best;
    for (const d of bestCandidates) {
      work[r][c] = d;
      search();
      work[r][c] = 0;
      if (found >= limit) return;
    }
  }

  search();
  return found;
}

// Solve a board (first solution found), or null if it has none.
export function solve(board, box) {
  const work = copy(board);
  const size = work.length;

  function search() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (work[r][c] !== 0) continue;
        for (let d = 1; d <= size; d++) {
          if (!canPlace(work, r, c, d, box)) continue;
          work[r][c] = d;
          if (search()) return true;
          work[r][c] = 0;
        }
        return false;
      }
    }
    return true;
  }

  return search() ? work : null;
}

function shuffle(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A full valid grid: pattern solution, then shuffled digits, bands, rows, stacks and columns.
function makeSolution(size, box, random) {
  const [boxRows, boxCols] = box;
  const digits = shuffle(Array.from({ length: size }, (_, i) => i + 1), random);
  const rows = shuffle([...Array(size / boxRows).keys()], random)
    .flatMap(band => shuffle([...Array(boxRows).keys()], random).map(r => band * boxRows + r));
  const cols = shuffle([...Array(size / boxCols).keys()], random)
    .flatMap(stack => shuffle([...Array(boxCols).keys()], random).map(c => stack * boxCols + c));
  const pattern = (r, c) => (boxCols * (r % boxRows) + Math.floor(r / boxRows) + c) % size;
  return rows.map(r => cols.map(c => digits[pattern(r, c)]));
}

// Fresh puzzle with exactly one solution. Removes clues one by one, keeping a removal
// only while the puzzle stays uniquely solvable, until it reaches the target clue count.
export function generatePuzzle(level, random = Math.random) {
  const spec = LEVELS[level];
  if (!spec) throw new Error(`Unknown level: ${level}`);
  const { size, box, clues: [minClues, maxClues] } = spec;

  const solution = makeSolution(size, box, random);
  const board = copy(solution);
  const target = minClues + Math.floor(random() * (maxClues - minClues + 1));
  let clues = size * size;

  for (const index of shuffle([...Array(size * size).keys()], random)) {
    if (clues <= target) break;
    const r = Math.floor(index / size);
    const c = index % size;
    const kept = board[r][c];
    board[r][c] = 0;
    if (countSolutions(board, box, 2) === 1) clues--;
    else board[r][c] = kept;
  }

  return { size, box, board, solution };
}
