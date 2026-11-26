// HumanGrid.js
// Owner: Reach
// Interactive Sudoku grid for the Human panel.
// Handles number entry, conflict highlighting, and fires onComplete when every cell is filled.
// Empty cells are 0 (docs/api-contract.md). The box shape comes from the game ([rows, cols]).

import React, { useState } from 'react';

const isEmpty = cell => cell === 0 || cell === '';

function HumanGrid({ puzzle, box, onComplete }) {
  const size = puzzle.length;
  const [boxRows, boxCols] = box || [Math.sqrt(size), Math.sqrt(size)];
  const [board, setBoard] = useState(() => puzzle.map(row => [...row]));
  const [done, setDone] = useState(false);

  function handleChange(row, col, value) {
    if (done) return;
    const digit = parseInt(value, 10);
    if (value !== '' && (isNaN(digit) || digit < 1 || digit > size)) return;

    const updated = board.map(r => [...r]);
    updated[row][col] = value === '' ? 0 : digit;
    setBoard(updated);

    if (updated.every(r => r.every(cell => !isEmpty(cell)))) {
      setDone(true);
      if (onComplete) onComplete(updated);
    }
  }

  function isConflict(row, col) {
    const val = board[row][col];
    if (isEmpty(val)) return false;

    for (let i = 0; i < size; i++) {
      if (i !== col && board[row][i] === val) return true;
      if (i !== row && board[i][col] === val) return true;
    }

    const top  = Math.floor(row / boxRows) * boxRows;
    const left = Math.floor(col / boxCols) * boxCols;
    for (let r = top; r < top + boxRows; r++) {
      for (let c = left; c < left + boxCols; c++) {
        if ((r !== row || c !== col) && board[r][c] === val) return true;
      }
    }
    return false;
  }

  return (
    <div className="human-grid">
      {done && <div className="complete-badge">✅ COMPLETE</div>}
      <table>
        <tbody>
          {board.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => {
                const isGiven = !isEmpty(puzzle[r][c]);
                return (
                  <td key={c} className={isConflict(r, c) ? 'conflict' : ''}>
                    <input
                      type="text"
                      maxLength={1}
                      aria-label={`cell ${r + 1}-${c + 1}`}
                      value={isEmpty(cell) ? '' : cell}
                      disabled={isGiven || done}
                      onChange={e => handleChange(r, c, e.target.value)}
                      className={isGiven ? 'given' : ''}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HumanGrid;
