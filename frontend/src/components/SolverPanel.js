// SolverPanel.js
// Owner: Reach
// Reusable panel for the Classical and Quantum automated solvers.
// Shows a running timer until its SolverResult arrives (see docs/api-contract.md),
// then the stats, the COMPLETE badge, and the quantum charts.
// Later: live progress can come from WS /ws/{game_id}.

import React, { useEffect, useState } from 'react';
import GroverChart from './GroverChart';
import QAOAChart from './QAOAChart';
import { formatMs, metricLabel } from '../format';

function SolverPanel({ playerType, result, failed }) {
  const [elapsed, setElapsed] = useState(0);
  const running = !result && !failed;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const q = result?.quantum;

  return (
    <div className={`solver-panel solver-panel--${playerType}`}>

      {running && <div className="running-badge">⚡ Running… {elapsed}s</div>}
      {failed  && <div className="dnf-badge">⚠ Could not reach the solver</div>}
      {result?.status === 'done'           && <div className="complete-badge">✅ COMPLETE</div>}
      {result?.status === 'did_not_finish' && (
        <div className="dnf-badge">⏱ Did Not Finish{result.reason ? ` (${result.reason})` : ''}</div>
      )}

      {result && (
        <div className="stats">
          <p>Algorithm: {result.algorithm}</p>
          <p>Time: {formatMs(result.time_ms)}</p>
          <p>Correct: {result.correct ? '✅' : '❌'}</p>
          <p>{metricLabel(result.search_cost.metric)}: {result.search_cost.value}</p>

          {q && (
            <>
              <p>Qubits: {q.qubits}</p>
              <p>Circuit depth: {q.circuit_depth}</p>
              {q.approximation_ratio != null && <p>Approx. ratio: {q.approximation_ratio}</p>}
            </>
          )}
        </div>
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
