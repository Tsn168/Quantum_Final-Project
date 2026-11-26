// Results.js
// Owner: Reach
// Results screen shown after the human finishes.
// Input: GET /game/{id}/results (see docs/api-contract.md).
// Headline = search cost (how many searches each solver needed); real time is shown too.

import React from 'react';
import RaceChart from '../components/RaceChart';
import { formatMs, metricLabel } from '../format';

function Results({ results }) {
  if (!results) return null;

  const { level, human, classical, quantum } = results;
  const correct = player => (player?.correct ? '✅' : '❌');
  const cost = player =>
    player ? `${player.search_cost.value} ${metricLabel(player.search_cost.metric).toLowerCase()}` : '—';

  return (
    <div className="results">
      <h2>Race Results</h2>

      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Search Cost</th>
            <th>Correct</th>
            <th>Real Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Human</td>
            <td>—</td>
            <td>{correct(human)}</td>
            <td>{formatMs(human?.time_ms)}</td>
          </tr>
          <tr>
            <td>Classical ({classical?.algorithm ?? '—'})</td>
            <td>{cost(classical)}</td>
            <td>{correct(classical)}</td>
            <td>{formatMs(classical?.time_ms)}</td>
          </tr>
          <tr>
            <td>Quantum ({quantum?.algorithm ?? '—'})</td>
            <td>{cost(quantum)}</td>
            <td>{correct(quantum)}</td>
            <td>{formatMs(quantum?.time_ms)}</td>
          </tr>
        </tbody>
      </table>

      <RaceChart classical={classical} quantum={quantum} />

      <p className="quantum-label">
        {level === 'easy'
          ? 'Grover\'s Search — quadratic speedup in oracle calls (√N vs N)'
          : 'QAOA — quantum optimization on the sub-problem'}
      </p>
      <p className="chart-note">
        Real time for the quantum player is slower because its qubits are simulated on a
        normal computer. The advantage is in the number of searches.
      </p>
    </div>
  );
}

export default Results;
