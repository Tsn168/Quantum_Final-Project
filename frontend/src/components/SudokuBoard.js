// SudokuBoard.js
// Owner: Reach
// One player's Sudoku board. Every player (you, classical, quantum) gets their own copy of
// the same puzzle. Your board takes input; a computer's board is read-only and shows its
// live cursor gliding from cell to cell as it fills the board.
// Keyboard on your board: arrows move, 1–9 places a number, Backspace/Delete/0 clears.

import React, { useRef } from 'react';
import { canPlace } from '../sudoku';

function Cursor({ player, label, cursor, size }) {
  if (!cursor) return null;
  const style = {
    left: `${((cursor.c + 0.5) / size) * 100}%`,
    top:  `${((cursor.r + 0.5) / size) * 100}%`,
  };
  return (
    // Near the right edge the name tag sits to the left of the arrow so it stays on the board.
    <div
      className={`cursor cursor--${player} cursor--${cursor.mode}${cursor.c >= size - 2 ? ' cursor--flip' : ''}`}
      style={style}
      aria-hidden="true"
    >
      <svg className="cursor-arrow" viewBox="0 0 16 20" width="16" height="20">
        <path d="M1 1 L1 16 L5 12 L8 19 L11 17.6 L8 11 L14 11 Z" />
      </svg>
      <span className="cursor-tag">{label}</span>
    </div>
  );
}

function SudokuBoard({
  player, label, puzzle, board, box,
  interactive = false, selected = null, onSelect, onInput, disabled = false,
  cursor = null, cursorLabel,
}) {
  const size = board.length;
  const [boxRows, boxCols] = box;
  const gridRef = useRef(null);

  function focusCell(r, c) {
    onSelect([r, c]);
    gridRef.current?.querySelector(`[data-cell="${r}-${c}"]`)?.focus();
  }

  function handleKeyDown(e) {
    if (!interactive || !selected || disabled) return;
    const [r, c] = selected;
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dr, dc] = moves[e.key];
      focusCell(Math.min(size - 1, Math.max(0, r + dr)), Math.min(size - 1, Math.max(0, c + dc)));
      return;
    }
    if (['Backspace', 'Delete', '0'].includes(e.key)) {
      e.preventDefault();
      onInput(r, c, 0);
      return;
    }
    const digit = parseInt(e.key, 10);
    if (digit >= 1 && digit <= size) {
      e.preventDefault();
      onInput(r, c, digit);
    }
  }

  return (
    <div className={`board-wrap board-wrap--${size}`}>
      <div
        ref={gridRef}
        className="board"
        role="grid"
        aria-label={label}
        style={{ '--size': size }}
        onKeyDown={handleKeyDown}
      >
        {board.map((row, r) => (
          <div role="row" key={r} className="board-row">
            {row.map((value, c) => {
              const given = puzzle[r][c] !== 0;
              const isSelected = interactive && selected && selected[0] === r && selected[1] === c;
              const conflict = value !== 0 && !given && !canPlace(board, r, c, value, box);
              const aimed = cursor && cursor.mode === 'aim' && cursor.r === r && cursor.c === c;
              const classes = [
                'cell',
                given ? 'cell--given' : value ? `cell--${player}` : 'cell--empty',
                (c + 1) % boxCols === 0 && c < size - 1 ? 'box-right' : '',
                (r + 1) % boxRows === 0 && r < size - 1 ? 'box-bottom' : '',
                isSelected ? 'is-selected' : '',
                conflict ? 'is-conflict' : '',
                aimed ? `is-aimed is-aimed--${player}` : '',
              ].join(' ');
              const name = `Row ${r + 1}, column ${c + 1}: ${value || 'empty'}`;
              const text = value !== 0 ? value : '';

              if (!interactive) {
                return <div key={c} role="gridcell" className={classes} aria-label={name}>{text}</div>;
              }
              return (
                <button
                  key={c}
                  type="button"
                  role="gridcell"
                  data-cell={`${r}-${c}`}
                  className={classes}
                  tabIndex={isSelected || (!selected && r === 0 && c === 0) ? 0 : -1}
                  aria-label={name}
                  aria-selected={!!isSelected}
                  disabled={disabled}
                  onClick={() => onSelect([r, c])}
                  onFocus={() => onSelect([r, c])}
                >
                  {text}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {cursor && (
        <div className="cursor-layer">
          <Cursor player={player} label={cursorLabel} cursor={cursor} size={size} />
        </div>
      )}
    </div>
  );
}

export default SudokuBoard;
