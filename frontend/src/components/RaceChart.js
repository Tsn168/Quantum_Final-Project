// RaceChart.js
// Owner: Reach
// Search/optimization cost comparison chart shown on the Results screen.
// Compares oracle calls (Grover) or circuit evaluations (QAOA) vs classical checks used.

import React from 'react';

function RaceChart({ results, level }) {
  if (!results) return null;

  const { classical, quantum } = results;

  const classicalCost = classical?.checks_used ?? 0;
  const quantumCost   = level === 'easy'
    ? (quantum?.oracle_calls ?? 0)
    : (quantum?.circuit_evaluations ?? 0);

  const max = Math.max(classicalCost, quantumCost, 1);

  const classicalPct = (classicalCost / max) * 100;
  const quantumPct   = (quantumCost   / max) * 100;

  return (
    <div className="race-chart">
      <h3>Search / Optimization Cost</h3>

      <div className="bar-row">
        <span className="bar-label">Classical</span>
        <div className="bar-track">
          <div className="bar bar--classical" style={{ width: `${classicalPct}%` }} />
        </div>
        <span className="bar-value">{classicalCost} checks</span>
      </div>

      <div className="bar-row">
        <span className="bar-label">Quantum</span>
        <div className="bar-track">
          <div className="bar bar--quantum" style={{ width: `${quantumPct}%` }} />
        </div>
        <span className="bar-value">
          {quantumCost} {level === 'easy' ? 'oracle calls' : 'circuit evals'}
        </span>
      </div>
    </div>
  );
}

export default RaceChart;
