// Results.js
// Owner: Reach
// Results screen. Input: GET /game/{id}/results (see docs/api-contract.md).
// Headline = searches needed per solver; real time is shown underneath, honestly.

import React from 'react';
import RaceChart from '../components/RaceChart';
import { formatMs, algorithmName } from '../format';

function AnswerBadge({ player }) {
  if (!player) return <span className="badge badge-outline">No answer</span>;
  return player.correct
    ? <span className="badge badge-primary">Correct</span>
    : <span className="badge badge-destructive">Wrong</span>;
}

function verdict(classical, quantum) {
  const c = classical?.search_cost?.value;
  const q = quantum?.search_cost?.value;
  if (!c || !q) return null;
  if (q < c) return `The quantum algorithm needed ${(c / q).toFixed(1)}× fewer searches than the classical one.`;
  if (q > c) return `The classical solver needed ${(q / c).toFixed(1)}× fewer searches this time.`;
  return 'Both solvers needed the same number of searches.';
}

function Results({ results, onPlayAgain }) {
  if (!results) return null;

  const { level, human, classical, quantum } = results;

  return (
    <section className="results">
      <h2>Searches needed to solve this puzzle</h2>

      <RaceChart classical={classical} quantum={quantum} />
      <p className="verdict">{verdict(classical, quantum)}</p>

      <table className="score">
        <thead>
          <tr>
            <th>Player</th>
            <th className="method">Method</th>
            <th>Answer</th>
            <th className="num">Real time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>You</td>
            <td className="method">By hand</td>
            <td><AnswerBadge player={human} /></td>
            <td className="num">{formatMs(human?.time_ms)}</td>
          </tr>
          <tr>
            <td>Classical computer</td>
            <td className="method">{algorithmName(classical?.algorithm)}</td>
            <td><AnswerBadge player={classical} /></td>
            <td className="num">{formatMs(classical?.time_ms)}</td>
          </tr>
          <tr>
            <td>Quantum algorithm</td>
            <td className="method">{algorithmName(quantum?.algorithm)}</td>
            <td><AnswerBadge player={quantum} /></td>
            <td className="num">{formatMs(quantum?.time_ms)}</td>
          </tr>
        </tbody>
      </table>

      <p className="footnote">
        {level === 'easy'
          ? 'Grover’s search needs about √N checks where brute-force search needs about N. '
          : 'QAOA treats the puzzle as an optimization problem; it has no proven speed-up. '}
        The quantum algorithm is slower in real time because its qubits are simulated on an
        ordinary computer.
      </p>

      <button className="btn btn-primary" onClick={onPlayAgain}>Play again</button>
    </section>
  );
}

export default Results;
