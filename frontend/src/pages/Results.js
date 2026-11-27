// Results.js
// Owner: Reach
// Results screen. Input: GET /game/{id}/results (see docs/api-contract.md).
// Who finished their own board correctly first, then searches needed per solver;
// the solvers' real compute time is shown in the table, honestly.

import React from 'react';
import RaceChart from '../components/RaceChart';
import GroverChart from '../components/GroverChart';
import QAOAChart from '../components/QAOAChart';
import { formatMs, algorithmName } from '../format';

function AnswerBadge({ player }) {
  if (!player) return <span className="badge badge-outline">No answer</span>;
  return player.correct
    ? <span className="badge badge-primary">Correct</span>
    : <span className="badge badge-destructive">Wrong</span>;
}

const NAMES = { you: 'You', classical: 'The classical computer', quantum: 'The quantum algorithm' };

// race = { you, classical, quantum }: ms from the start until that board was full (null = not yet).
// Only boards finished correctly can win.
function winner(race, results) {
  if (!race) return null;
  const correct = { you: results.human?.correct, classical: results.classical?.correct, quantum: results.quantum?.correct };
  const finishers = Object.keys(NAMES)
    .filter(id => race[id] != null && correct[id])
    .sort((a, b) => race[a] - race[b]);
  if (finishers.length === 0) return 'Nobody finished a correct board.';
  const first = finishers[0];
  return first === 'you'
    ? `You finished first, in ${formatMs(race.you)}.`
    : `${NAMES[first]} finished first, in ${formatMs(race[first])}.`;
}

function verdict(classical, quantum) {
  const c = classical?.search_cost?.value;
  const q = quantum?.search_cost?.value;
  if (!c || !q) return null;
  if (q < c) return `The quantum algorithm needed ${(c / q).toFixed(1)}× fewer searches than the classical one.`;
  if (q > c) return `The classical solver needed ${(q / c).toFixed(1)}× fewer searches this time.`;
  return 'Both solvers needed the same number of searches.';
}

function Results({ results, race, onPlayAgain }) {
  if (!results) return null;

  const { level, human, classical, quantum } = results;
  const raceTime = id => (race?.[id] != null ? formatMs(race[id]) : 'Still solving');

  return (
    <section className="results">
      {winner(race, results) && <p className="winner">{winner(race, results)}</p>}
      <h2>Searches needed to solve this puzzle</h2>

      <RaceChart classical={classical} quantum={quantum} />
      <p className="verdict">{verdict(classical, quantum)}</p>

      <table className="score">
        <thead>
          <tr>
            <th>Player</th>
            <th className="method">Method</th>
            <th className="num">Race time</th>
            <th>Answer</th>
            <th className="num">Compute time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>You</td>
            <td className="method">By hand</td>
            <td className="num">{raceTime('you')}</td>
            <td><AnswerBadge player={human} /></td>
            <td className="num">—</td>
          </tr>
          <tr>
            <td>Classical computer</td>
            <td className="method">{algorithmName(classical?.algorithm)}</td>
            <td className="num">{raceTime('classical')}</td>
            <td><AnswerBadge player={classical} /></td>
            <td className="num">{formatMs(classical?.time_ms)}</td>
          </tr>
          <tr>
            <td>Quantum algorithm</td>
            <td className="method">{algorithmName(quantum?.algorithm)}</td>
            <td className="num">{raceTime('quantum')}</td>
            <td><AnswerBadge player={quantum} /></td>
            <td className="num">{formatMs(quantum?.time_ms)}</td>
          </tr>
        </tbody>
      </table>

      {quantum?.quantum && (
        <div className="results-chart">
          <GroverChart counts={quantum.quantum.measurement_counts} mode={quantum.quantum.mode} />
          <QAOAChart costHistory={quantum.quantum.cost_history} mode={quantum.quantum.mode} />
        </div>
      )}

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
