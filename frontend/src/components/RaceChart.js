// RaceChart.js
// Owner: Reach
// Search/optimization cost comparison chart shown on the Results screen.
// Compares each player's search_cost (rule checks vs oracle calls / circuit evaluations).

import React from 'react';
import { metricLabel } from '../format';

function CostBar({ label, player, max, className }) {
  const value = player?.search_cost?.value ?? 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className={`bar ${className}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="bar-value">
        {value} {player ? metricLabel(player.search_cost.metric).toLowerCase() : ''}
      </span>
    </div>
  );
}

function RaceChart({ classical, quantum }) {
  if (!classical && !quantum) return null;

  const max = Math.max(classical?.search_cost?.value ?? 0, quantum?.search_cost?.value ?? 0, 1);

  return (
    <div className="race-chart">
      <h3>Search / Optimization Cost</h3>
      <CostBar label="Classical" player={classical} max={max} className="bar--classical" />
      <CostBar label="Quantum"   player={quantum}   max={max} className="bar--quantum" />
    </div>
  );
}

export default RaceChart;
