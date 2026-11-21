// HumanGrid.js
// Owner: Reach
// Interactive Sudoku grid for the Human panel.
// Handles number entry, conflict highlighting, and fires onComplete when the board is filled.

import React, { useState } from 'react';

function HumanGrid({ puzzle, onComplete }) {
  const size = puzzle?.length || 4;
  const [board, setBoard] = useState(
    puzzle ? puzzle.map(row => [...row]) : Array(size).fill(null).map(() => Array(size).fill(''))
  );
  const [done, setDone] = useState(false);

  function handleChange(row, col, value) {
    if (done) return;
    const max = size === 4 ? 4 : 9;
    const digit = parseInt(value);
    if (value !== '' && (isNaN(digit) || digit < 1 || digit > max)) return;

    const updated = board.map(r => [...r]);
    updated[row][col] = value === '' ? '' : digit;
    setBoard(updated);

    // Check if fully filled
    const filled = updated.every(r => r.every(cell => cell !== ''));
    if (filled) {
      setDone(true);
      if (onComplete) onComplete(updated);
    }
  }

  function isConflict(board, row, col) {
    const val = board[row][col];
    if (!val) return false;
    const boxSize = size === 4 ? 2 : 3;

    for (let i = 0; i < size; i++) {
      if (i !== col && board[row][i] === val) return true;
      if (i !== row && board[i][col] === val) return true;
    }

    const boxRow = Math.floor(row / boxSize) * boxSize;
    const boxCol = Math.floor(col / boxSize) * boxSize;
    for (let r = boxRow; r < boxRow + boxSize; r++) {
      for (let c = boxCol; c < boxCol + boxSize; c++) {
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
                const isGiven = puzzle && puzzle[r][c] !== 0 && puzzle[r][c] !== '';
                const conflict = isConflict(board, r, c);
                return (
                  <td key={c} className={conflict ? 'conflict' : ''}>
                    <input
                      type="text"
                      maxLength={1}
                      value={cell === 0 ? '' : cell}
                      disabled={isGiven}
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
