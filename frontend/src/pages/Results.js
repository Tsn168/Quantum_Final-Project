// Results.js
// Owner: Reach
// Results screen shown after all three players finish.
// Displays timer bars, correctness badges, and the search/optimization cost chart.

import React from 'react';
import RaceChart from '../components/RaceChart';

function Results({ results, level }) {
  if (!results) return null;

  const { human, classical, quantum } = results;

  return (
    <div className="results">
      <h2>Race Results</h2>

      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Time</th>
            <th>Correct</th>
            <th>Search Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Human</td>
            <td>{human?.time ?? '—'}s</td>
            <td>{human?.correct ? '✅' : '❌'}</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Classical</td>
            <td>{classical?.time ?? '—'}s</td>
            <td>{classical?.correct ? '✅' : '❌'}</td>
            <td>{classical?.checks_used ?? '—'} checks</td>
          </tr>
          <tr>
            <td>Quantum</td>
            <td>{quantum?.time ?? '—'}s</td>
            <td>{quantum?.correct ? '✅' : '❌'}</td>
            <td>
              {level === 'easy'
                ? `${quantum?.oracle_calls ?? '—'} oracle calls`
                : `${quantum?.circuit_evaluations ?? '—'} circuit evals`}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Search/optimization cost comparison chart */}
      <RaceChart results={results} level={level} />

      <p className="quantum-label">
        {level === 'easy'
          ? 'Grover\'s Search — quadratic speedup in oracle calls (√N vs N)'
          : 'QAOA — quantum optimization on the sub-problem'}
      </p>
    </div>
  );
}

export default Results;
