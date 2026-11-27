// Results.js
// Owner: Reach
// Results screen. Input: GET /game/{id}/results (see docs/api-contract.md).
// Who placed the most correct cells on the shared board, then searches needed per solver;
// real time is shown underneath, honestly.

import React from 'react';
import RaceChart from '../components/RaceChart';
import { formatMs, algorithmName } from '../format';

function AnswerBadge({ player }) {
  if (!player) return <span className="badge badge-outline">No answer</span>;
  return player.correct
    ? <span className="badge badge-primary">Correct</span>
    : <span className="badge badge-destructive">Wrong</span>;
}

const NAMES = { you: 'You', classical: 'The classical computer', quantum: 'The quantum algorithm' };

function winner(score) {
  if (!score || score.you.correct == null) return null;
  const best = Math.max(...Object.values(score).map(s => s.correct));
  const top = Object.keys(NAMES).filter(id => score[id].correct === best);
  const cells = `${best} correct ${best === 1 ? 'cell' : 'cells'}`;
  if (top.length > 1) return `A tie at ${cells}.`;
  return `${NAMES[top[0]]} won the board with ${cells}.`;
}

function verdict(classical, quantum) {
  const c = classical?.search_cost?.value;
  const q = quantum?.search_cost?.value;
  if (!c || !q) return null;
  if (q < c) return `The quantum algorithm needed ${(c / q).toFixed(1)}× fewer searches than the classical one.`;
  if (q > c) return `The classical solver needed ${(q / c).toFixed(1)}× fewer searches this time.`;
  return 'Both solvers needed the same number of searches.';
}

function Results({ results, score, onPlayAgain }) {
  if (!results) return null;

  const { level, human, classical, quantum } = results;
  const cells = id => score?.[id] ? `${score[id].correct ?? '—'} of ${score[id].claimed}` : '—';

  return (
    <section className="results">
      {winner(score) && <p className="winner">{winner(score)}</p>}
      <h2>Searches needed to solve this puzzle</h2>

      <RaceChart classical={classical} quantum={quantum} />
      <p className="verdict">{verdict(classical, quantum)}</p>

      <table className="score">
        <thead>
          <tr>
            <th>Player</th>
            <th className="method">Method</th>
            <th className="num">Correct cells</th>
            <th>Answer</th>
            <th className="num">Real time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>You</td>
            <td className="method">By hand</td>
            <td className="num">{cells('you')}</td>
            <td><AnswerBadge player={human} /></td>
            <td className="num">{formatMs(human?.time_ms)}</td>
          </tr>
          <tr>
            <td>Classical computer</td>
            <td className="method">{algorithmName(classical?.algorithm)}</td>
            <td className="num">{cells('classical')}</td>
            <td><AnswerBadge player={classical} /></td>
            <td className="num">{formatMs(classical?.time_ms)}</td>
          </tr>
          <tr>
            <td>Quantum algorithm</td>
            <td className="method">{algorithmName(quantum?.algorithm)}</td>
            <td className="num">{cells('quantum')}</td>
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
