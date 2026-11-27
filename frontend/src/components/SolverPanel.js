// SolverPanel.js
// Owner: Reach
// Race panel for the Classical and Quantum solvers: this computer's own board (children),
// a progress bar until its SolverResult arrives (see docs/api-contract.md), then one compact
// row of stats. Kept short so all three boards fit on one screen; the quantum charts and
// full details are on the results screen.

import React from 'react';
import { formatMs, metricLabel, algorithmName } from '../format';

const TITLES = { classical: 'Classical computer', quantum: 'Quantum algorithm' };

function StatusBadge({ result, failed, progress }) {
  if (failed) return <span className="badge badge-destructive">No response</span>;
  if (!result) return <span className="badge badge-outline">Solving</span>;
  if (result.status === 'did_not_finish') {
    return <span className="badge badge-destructive">Did not finish</span>;
  }
  if (progress && progress.filled < progress.total) {
    return <span className="badge badge-outline">{progress.filled} of {progress.total} cells</span>;
  }
  return <span className="badge badge-primary">Finished</span>;
}

function SolverPanel({ playerType, result, failed, progress, raceMs, children }) {
  const running = !result && !failed;

  return (
    <div className={`panel panel--${playerType}`}>
      <div className="panel-head">
        <h3>{TITLES[playerType]}</h3>
        <StatusBadge result={result} failed={failed} progress={progress} />
      </div>

      {children}

      {running && (
        <div className="progress" role="progressbar" aria-label={`${TITLES[playerType]} is solving`} />
      )}

      {failed && (
        <p className="hint">The solver did not answer. Check that the backend is running.</p>
      )}

      {result && (
        <dl className="stats stats--compact">
          <div><dt>Method</dt><dd>{algorithmName(result.algorithm)}</dd></div>
          <div><dt>{metricLabel(result.search_cost.metric)}</dt><dd>{result.search_cost.value}</dd></div>
          <div><dt>Race time</dt><dd>{raceMs != null ? formatMs(raceMs) : '—'}</dd></div>
        </dl>
      )}
    </div>
  );
}

export default SolverPanel;
