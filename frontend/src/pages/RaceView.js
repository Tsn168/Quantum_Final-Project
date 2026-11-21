// RaceView.js
// Owner: Reach
// Three-panel race screen shown after the puzzle is generated.
// Hosts HumanGrid, SolverPanel (Classical), and SolverPanel (Quantum) side by side.

import React from 'react';
import HumanGrid from '../components/HumanGrid';
import SolverPanel from '../components/SolverPanel';

function RaceView({ puzzle, level, onHumanComplete }) {
  return (
    <div className="race-view">
      <h2>Race — {level === 'easy' ? 'Easy 4×4' : 'Hard 9×9'}</h2>

      <div className="panels">
        {/* Human panel */}
        <div className="panel">
          <h3>Human</h3>
          <HumanGrid puzzle={puzzle} onComplete={onHumanComplete} />
        </div>

        {/* Classical panel */}
        <div className="panel">
          <h3>Classical</h3>
          <SolverPanel playerType="classical" level={level} puzzle={puzzle} />
        </div>

        {/* Quantum panel */}
        <div className="panel">
          <h3>Quantum</h3>
          <SolverPanel playerType="quantum" level={level} puzzle={puzzle} />
        </div>
      </div>
    </div>
  );
}

export default RaceView;
