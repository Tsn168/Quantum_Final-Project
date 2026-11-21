// QAOAChart.js
// Owner: Reach
// Quantum visualization for Hard (QAOA) sessions.
// Renders a line chart of cost function value per optimizer iteration, showing convergence.

import React from 'react';

function QAOAChart({ costHistory }) {
  if (!costHistory || costHistory.length === 0) return null;

  const width  = 300;
  const height = 120;
  const padding = 20;

  const minCost = Math.min(...costHistory);
  const maxCost = Math.max(...costHistory);
  const range   = maxCost - minCost || 1;

  const points = costHistory.map((cost, i) => {
    const x = padding + (i / (costHistory.length - 1)) * (width - padding * 2);
    const y = height - padding - ((cost - minCost) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="qaoa-chart">
      <h4>QAOA Cost Convergence</h4>
      <svg width={width} height={height}>
        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />

        {/* Cost curve */}
        <polyline
          fill="none"
          stroke="#c084fc"
          strokeWidth={2}
          points={points.join(' ')}
        />

        {/* Labels */}
        <text x={padding} y={height - 4} fontSize={10} fill="#888">0</text>
        <text x={width - padding} y={height - 4} fontSize={10} fill="#888" textAnchor="end">
          iter {costHistory.length}
        </text>
        <text x={4} y={padding + 4} fontSize={10} fill="#888">{maxCost.toFixed(2)}</text>
        <text x={4} y={height - padding} fontSize={10} fill="#888">{minCost.toFixed(2)}</text>
      </svg>
      <p className="chart-note">Lower cost = fewer constraint violations</p>
    </div>
  );
}

export default QAOAChart;
