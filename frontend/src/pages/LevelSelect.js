// LevelSelect.js
// Owner: Reach
// First screen the user sees — choose Easy (4×4) or Hard (9×9) to start a race session.

import React from 'react';

function LevelSelect({ onSelectLevel }) {
  return (
    <div className="level-select">
      <h1>QuSud Race</h1>
      <p>Human vs Classical vs Quantum — who solves it fastest?</p>

      <div className="level-buttons">
        <button onClick={() => onSelectLevel('easy')}>
          <h2>Easy</h2>
          <p>4 × 4 grid</p>
          <p>Quantum: Grover's Search</p>
        </button>

        <button onClick={() => onSelectLevel('hard')}>
          <h2>Hard</h2>
          <p>9 × 9 grid</p>
          <p>Quantum: QAOA</p>
        </button>
      </div>
    </div>
  );
}

export default LevelSelect;
