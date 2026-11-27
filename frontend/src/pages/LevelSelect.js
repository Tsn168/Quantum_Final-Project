// LevelSelect.js
// Owner: Reach
// First screen — meet the three players, then choose Easy (4×4) or Hard (9×9).

import React from 'react';
import { PLAYERS } from '../players';

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
    <div className="mini-grid" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {cells}
    </div>
  );
}

const LEVELS = [
  {
    id: 'easy',
    name: 'Easy',
    board: '4×4 board, about 8 empty cells',
    algo: 'The quantum player uses Grover’s search.',
    grid: { size: 4, box: 2, filled: [1, 3, 4, 6, 9, 11, 12, 14] },
  },
  {
    id: 'hard',
    name: 'Hard',
    board: '9×9 board, only 24–28 numbers given',
    algo: 'The quantum player uses QAOA.',
    grid: { size: 9, box: 3, filled: [1, 6, 11, 13, 19, 22, 26, 28, 33, 36, 40, 44, 47, 52, 54, 58, 61, 67, 69, 74, 79, 2, 64, 30, 50] },
  },
];

const ROLES = {
  you: 'Types numbers into empty cells.',
  classical: 'Searches cell by cell, the way a normal computer does.',
  quantum: 'Searches with simulated qubits.',
};

function LevelSelect({ onSelectLevel }) {
  return (
    <section className="home">
      <div className="intro">
        <h1>One Sudoku, three players</h1>
        <p>
          You share a board with a classical computer and a quantum algorithm. Each of you
          fills empty cells. When the board is full, whoever placed the most correct
          numbers wins.
        </p>
      </div>

      <ul className="cast">
        {PLAYERS.map(p => (
          <li key={p.id} className={`cast-member player--${p.id}`}>
            <span className="player-swatch" aria-hidden="true" />
            <span>
              <strong>{p.name}</strong>
              <span>{ROLES[p.id]}</span>
            </span>
          </li>
        ))}
      </ul>

      <h2 className="levels-title">Choose a board</h2>
      <div className="levels">
        {LEVELS.map(level => (
          <button key={level.id} className="level" onClick={() => onSelectLevel(level.id)}>
            <MiniGrid {...level.grid} />
            <span className="level-text">
              <span className="level-name">{level.name}</span>
              <span>{level.board}</span>
              <span className="level-algo">{level.algo}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default LevelSelect;
