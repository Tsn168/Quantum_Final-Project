// GroverChart.js
// Owner: Reach
// Grover measurement results: how often each answer (bitstring) was measured.
// The most frequent bitstring is the answer Grover found.

import React from 'react';
import { modeName } from '../format';

function GroverChart({ counts, mode }) {
  if (!counts || Object.keys(counts).length === 0) return null;

  const total  = Object.values(counts).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max    = sorted[0][1];

  return (
    <div className="chart">
      <h4>Measured answers, top {sorted.length} ({modeName(mode)})</h4>
      {sorted.map(([bitstring, count], i) => (
        <div className="bar-row" key={bitstring}>
          <span className="bar-label">{bitstring}</span>
          <div className="bar-track">
            <div className={`bar${i === 0 ? ' is-top' : ''}`} style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="bar-value">{((count / total) * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

export default GroverChart;
