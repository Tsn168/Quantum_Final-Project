// RaceChart.js
// Owner: Reach
// The headline of the results screen: how many searches each solver needed.

import React from 'react';
import { metricLabel, algorithmName } from '../format';

function VersusRow({ who, player, max, kind }) {
  const value = player?.search_cost?.value ?? 0;
  return (
    <div className={`versus-row versus-row--${kind}`}>
      <div className="versus-num">{value}</div>
      <div>
        <div className="versus-who">
          <strong>{who}</strong>
          <span>
            {player ? `${metricLabel(player.search_cost.metric).toLowerCase()}, ${algorithmName(player.algorithm)}` : 'no result'}
          </span>
        </div>
        <div className="versus-track">
          <div className="versus-bar" style={{ width: `${(value / max) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function RaceChart({ classical, quantum }) {
  if (!classical && !quantum) return null;

  const max = Math.max(classical?.search_cost?.value ?? 0, quantum?.search_cost?.value ?? 0, 1);

  return (
    <div className="versus">
      <VersusRow who="Classical" player={classical} max={max} kind="classical" />
      <VersusRow who="Quantum" player={quantum} max={max} kind="quantum" />
    </div>
  );
}

export default RaceChart;
