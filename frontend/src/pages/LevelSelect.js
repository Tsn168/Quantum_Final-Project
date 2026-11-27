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
    board: '9×9 board, 24–28 numbers given',
    algo: 'Quantum player uses QAOA',
    grid: { size: 9, box: 3, filled: [1, 2, 6, 11, 13, 19, 22, 26, 28, 30, 33, 36, 40, 44, 47, 50, 52, 54, 58, 61, 64, 67, 69, 74, 79] },
  },
];

function LevelSelect({ onSelectLevel }) {
  return (
    <section>
      <div className="intro">
        <h1>Solve a Sudoku before the computers do</h1>
        <p>
          You share one board with a classical solver and a quantum algorithm. Whoever
          places the most correct numbers wins, and at the end you see how many searches
          each computer needed.
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
