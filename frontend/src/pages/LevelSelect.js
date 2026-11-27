// LevelSelect.js
// Owner: Reach
// First screen — choose Easy (4×4) or Hard (9×9) to start a race session.

import React from 'react';

// A small picture of the board shape, so each level shows what you will play.
function MiniGrid({ size, box, filled }) {
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const classes = [
        filled.includes(r * size + c) ? 'filled' : '',
        (c + 1) % box === 0 && c < size - 1 ? 'box-right' : '',
        (r + 1) % box === 0 && r < size - 1 ? 'box-bottom' : '',
      ].join(' ');
      cells.push(<span key={`${r}-${c}`} className={classes} />);
    }
  }
  return (
    <div
      className="mini-grid"
      aria-hidden="true"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {cells}
    </div>
  );
}

const LEVELS = [
  {
    id: 'easy',
    name: 'Easy',
    board: '4×4 board',
    algo: 'Quantum player uses Grover’s search',
    grid: { size: 4, box: 2, filled: [0, 1, 3, 6, 7, 8, 9, 11, 12, 13, 14, 15] },
  },
  {
    id: 'hard',
    name: 'Hard',
    board: '9×9 board',
    algo: 'Quantum player uses QAOA',
    grid: { size: 9, box: 3, filled: [0, 1, 6, 8, 9, 10, 11, 12, 13, 14, 18, 20, 23, 27, 28, 31, 34, 35, 39, 40, 43, 46, 47, 48, 49, 50, 51, 52, 53, 55, 56, 58, 60, 61, 62, 64, 65, 69, 72, 75, 79] },
  },
];

function LevelSelect({ onSelectLevel }) {
  return (
    <section>
      <div className="intro">
        <h1>Solve a Sudoku before the computers do</h1>
        <p>
          You race a classical solver and a quantum algorithm on the same puzzle.
          At the end you see how many searches each one needed.
        </p>
      </div>

      <div className="levels">
        {LEVELS.map(level => (
          <button key={level.id} className="level" onClick={() => onSelectLevel(level.id)}>
            <MiniGrid {...level.grid} />
            <span>
              <h2>{level.name}</h2>
              <p>{level.board}</p>
              <p className="level-algo">{level.algo}</p>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default LevelSelect;
