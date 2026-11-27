// QAOAChart.js
// Owner: Reach
// QAOA cost per optimizer round. Lower cost = fewer broken Sudoku rules.

import React from 'react';
import { modeName } from '../format';

function QAOAChart({ costHistory, mode }) {
  if (!costHistory || costHistory.length < 2) return null;

  const width = 320;
  const height = 120;
  const pad = { left: 28, right: 8, top: 8, bottom: 18 };

  const min = Math.min(...costHistory);
  const max = Math.max(...costHistory);
  const range = max - min || 1;

  const points = costHistory.map((cost, i) => {
    const x = pad.left + (i / (costHistory.length - 1)) * (width - pad.left - pad.right);
    const y = pad.top + ((max - cost) / range) * (height - pad.top - pad.bottom);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <div className="chart">
      <h4>Rule violations per optimizer round ({modeName(mode)})</h4>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img"
        aria-label={`Cost fell from ${max.toFixed(1)} to ${min.toFixed(1)} over ${costHistory.length} rounds`}>
        <line className="axis" x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} />
        <line className="axis" x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} />
        <polyline className="line" points={points.join(' ')} />
        <text x={pad.left - 4} y={pad.top + 8} textAnchor="end">{max.toFixed(1)}</text>
        <text x={pad.left - 4} y={height - pad.bottom} textAnchor="end">{min.toFixed(1)}</text>
        <text x={width - pad.right} y={height - 4} textAnchor="end">round {costHistory.length}</text>
      </svg>
    </div>
  );
}

export default QAOAChart;
