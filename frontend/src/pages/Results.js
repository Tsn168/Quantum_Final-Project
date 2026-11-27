// Results.js
// Owner: Reach
// Results screen. Input: GET /game/{id}/results (see docs/api-contract.md) plus the
// cell tally from the shared board. Winner = most correct cells placed.
// Below it, how many searches each computer needed and its real time, honestly.

import React from 'react';
import RaceChart from '../components/RaceChart';
import GroverChart from '../components/GroverChart';
import QAOAChart from '../components/QAOAChart';
import { PLAYERS } from '../players';
import { formatMs, algorithmName, metricLabel } from '../format';

function headline(score) {
  if (!score || score.you.correct == null) return 'Board complete';
  const best = Math.max(...PLAYERS.map(p => score[p.id].correct));
  const winners = PLAYERS.filter(p => score[p.id].correct === best);
  if (winners.length > 1) return `A tie at ${best} correct ${best === 1 ? 'cell' : 'cells'}`;
  const w = winners[0];
  return w.id === 'you'
    ? `You won with ${best} correct ${best === 1 ? 'cell' : 'cells'}`
    : `The ${w.name.toLowerCase()} won with ${best} correct ${best === 1 ? 'cell' : 'cells'}`;
}

function Results({ results, score, onPlayAgain }) {
  if (!results) return null;
  const { level, human, classical, quantum } = results;
  const solvers = { classical, quantum };
  const q = quantum?.quantum;

  const row = p => {
    const s = score?.[p.id];
    const solver = solvers[p.id];
    return (
      <tr key={p.id} className={`row--${p.id}`}>
        <th scope="row"><span className="who"><span className="player-swatch" aria-hidden="true" />{p.name}</span></th>
        <td className="num">{s?.claimed ?? '—'}</td>
        <td className="num">{s?.correct ?? '—'}</td>
        <td>{p.id === 'you' ? 'By hand' : algorithmName(solver?.algorithm)}</td>
        <td className="num">
          {p.id === 'you' ? '—' : solver ? `${solver.search_cost.value} ${metricLabel(solver.search_cost.metric).toLowerCase()}` : '—'}
        </td>
        <td className="num">{formatMs(p.id === 'you' ? human?.time_ms : solver?.time_ms)}</td>
      </tr>
    );
  };

  return (
    <section className="results">
      <h1>{headline(score)}</h1>
      <p className="results-sub">
        {human?.correct
          ? 'The finished board is correct.'
          : 'The finished board has a mistake in it. Cells that were wrong do not count.'}
      </p>

      <div className="table-scroll">
        <table className="score">
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th scope="col" className="num">Cells placed</th>
              <th scope="col" className="num">Correct</th>
              <th scope="col">Method</th>
              <th scope="col" className="num">Searches needed</th>
              <th scope="col" className="num">Real time</th>
            </tr>
          </thead>
          <tbody>{PLAYERS.map(row)}</tbody>
        </table>
      </div>

      <h2>How hard each computer had to search</h2>
      <RaceChart classical={classical} quantum={quantum} />

      {q && (
        <div className="results-charts">
          <GroverChart counts={q.measurement_counts} mode={q.mode} />
          <QAOAChart costHistory={q.cost_history} mode={q.mode} />
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
