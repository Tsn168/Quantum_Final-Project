// SolverPanel.js
// Owner: Reach
// Panel for the Classical and Quantum solvers. Shows progress until its SolverResult
// arrives (see docs/api-contract.md), then the stats and the quantum chart.
// Also shows how many cells this computer has placed on the shared board.

import React, { useEffect, useState } from 'react';
import GroverChart from './GroverChart';
import QAOAChart from './QAOAChart';
import { formatMs, metricLabel, algorithmName } from '../format';

const TITLES = { classical: 'Classical computer', quantum: 'Quantum algorithm' };

function StatusBadge({ result, failed }) {
  if (failed) return <span className="badge badge-destructive">No response</span>;
  if (!result) return <span className="badge badge-outline">Solving</span>;
  if (result.status === 'did_not_finish') {
    return <span className="badge badge-destructive">Did not finish</span>;
  }
  return <span className="badge badge-primary">Finished</span>;
}

function SolverPanel({ playerType, result, failed, cells }) {
  const [elapsed, setElapsed] = useState(0);
  const running = !result && !failed;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const q = result?.quantum;

  return (
    <div className={`panel panel--${playerType}`}>
      <div className="panel-head">
        <h3>{TITLES[playerType]}</h3>
        <StatusBadge result={result} failed={failed} />
      </div>

      {running && (
        <>
          <div className="progress" role="progressbar" aria-label={`${TITLES[playerType]} is solving`} />
          <p className="elapsed">{elapsed} s</p>
        </>
      )}

      {failed && (
        <p className="hint">The solver did not answer. Check that the backend is running.</p>
      )}

      {result && (
        <dl className="stats">
          <div><dt>Method</dt><dd>{algorithmName(result.algorithm)}</dd></div>
          <div><dt>{metricLabel(result.search_cost.metric)}</dt><dd>{result.search_cost.value}</dd></div>
          <div><dt>Time</dt><dd>{formatMs(result.time_ms)}</dd></div>
          <div><dt>Answer</dt><dd>{result.correct ? 'Correct' : 'Wrong'}</dd></div>
          <div><dt>Cells placed</dt><dd>{cells}</dd></div>
          {q && <div><dt>Qubits</dt><dd>{q.qubits}</dd></div>}
          {q && <div><dt>Circuit depth</dt><dd>{q.circuit_depth}</dd></div>}
          {q?.approximation_ratio != null && (
            <div><dt>Approximation ratio</dt><dd>{q.approximation_ratio}</dd></div>
          )}
        </dl>
      )}

      {q && result.status === 'done' && (
        <>
          <GroverChart counts={q.measurement_counts} mode={q.mode} />
          <QAOAChart costHistory={q.cost_history} mode={q.mode} />
        </>
      )}
    </div>
  );
}

export default SolverPanel;
