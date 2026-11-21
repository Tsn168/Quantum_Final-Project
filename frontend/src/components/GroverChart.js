// GroverChart.js
// Owner: Reach
// Quantum visualization for Easy (Grover) sessions.
// Renders a bar chart of measurement bitstring → probability from Qiskit measurement counts.

import React from 'react';

function GroverChart({ counts }) {
  if (!counts || Object.keys(counts).length === 0) return null;

  const total  = Object.values(counts).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const max    = sorted[0][1];

  return (
    <div className="grover-chart">
      <h4>Grover Measurement Probabilities</h4>
      {sorted.map(([bitstring, count]) => (
        <div className="bar-row" key={bitstring}>
          <span className="bar-label bitstring">{bitstring}</span>
          <div className="bar-track">
            <div
              className="bar bar--grover"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="bar-value">{((count / total) * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

export default GroverChart;
