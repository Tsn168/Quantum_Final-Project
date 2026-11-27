// SharedBoard.js
// Owner: Reach
// The one board everyone plays on. Each filled cell is tinted by whoever placed it,
// and the two computers move named cursors that glide from cell to cell.
// Keyboard: arrows move, 1–9 places a number, Backspace/Delete/0 clears your own cell.

import React, { useRef } from 'react';
import { canPlace } from '../sudoku';

function Cursor({ who, label, cursor, size }) {
  if (!cursor) return null;
  const style = {
    left: `${((cursor.c + 0.5) / size) * 100}%`,
    top:  `${((cursor.r + 0.5) / size) * 100}%`,
  };
  return (
    // Near the right edge the name tag sits to the left of the arrow so it stays on the board.
    <div
      className={`cursor cursor--${who} cursor--${cursor.mode}${cursor.c >= size - 2 ? ' cursor--flip' : ''}`}
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

function SharedBoard({ board, owner, box, selected, cursors, labels, onSelect, onInput, disabled }) {
  const size = board.length;
  const [boxRows, boxCols] = box;
  const gridRef = useRef(null);

  function focusCell(r, c) {
    onSelect([r, c]);
    gridRef.current?.querySelector(`[data-cell="${r}-${c}"]`)?.focus();
  }

  function handleKeyDown(e) {
    if (!selected || disabled) return;
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

  // A bot's target cell gets a soft ring in its colour while its cursor is there.
  const aimedBy = (r, c) =>
    Object.entries(cursors).find(([, cur]) => cur && cur.mode === 'aim' && cur.r === r && cur.c === c)?.[0];

  return (
    <div className={`board-wrap board-wrap--${size}`}>
      <div
        ref={gridRef}
        className="board"
        role="grid"
        aria-label="Shared Sudoku board"
        style={{ '--size': size }}
        onKeyDown={handleKeyDown}
      >
        {board.map((row, r) => (
          <div role="row" key={r} className="board-row">
            {row.map((value, c) => {
              const who = owner[r][c];
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const conflict = value !== 0 && who === 'you' && !canPlace(board, r, c, value, box);
              const aim = aimedBy(r, c);
              const classes = [
                'cell',
                who ? `cell--${who}` : 'cell--empty',
                (c + 1) % boxCols === 0 && c < size - 1 ? 'box-right' : '',
                (r + 1) % boxRows === 0 && r < size - 1 ? 'box-bottom' : '',
                isSelected ? 'is-selected' : '',
                conflict ? 'is-conflict' : '',
                aim ? `is-aimed is-aimed--${aim}` : '',
              ].join(' ');
              const filledBy = who && who !== 'given' ? `, placed by ${labels[who]}` : '';
              return (
                <button
                  key={c}
                  type="button"
                  role="gridcell"
                  data-cell={`${r}-${c}`}
                  className={classes}
                  tabIndex={isSelected || (!selected && r === 0 && c === 0) ? 0 : -1}
                  aria-label={`Row ${r + 1}, column ${c + 1}: ${value || 'empty'}${filledBy}`}
                  aria-selected={!!isSelected}
                  disabled={disabled}
                  onClick={() => onSelect([r, c])}
                  onFocus={() => onSelect([r, c])}
                >
                  {value !== 0 ? value : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="cursor-layer">
        {Object.entries(cursors).map(([who, cursor]) => (
          <Cursor key={who} who={who} label={labels[who]} cursor={cursor} size={size} />
        ))}
      </div>
    </div>
  );
}

export default SharedBoard;
