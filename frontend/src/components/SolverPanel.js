// SolverPanel.js
// Owner: Reach
// Reusable panel for the Classical and Quantum automated solvers.
// Receives live status updates via WebSocket and shows progress, stats, and COMPLETE badge.

import React, { useEffect, useState } from 'react';
import GroverChart from './GroverChart';
import QAOAChart from './QAOAChart';

function SolverPanel({ playerType, level, puzzle }) {
  const [status, setStatus] = useState('waiting');   // waiting | running | done | did_not_finish
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats]   = useState(null);        // populated by WebSocket (Taingchay)
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  // WebSocket — connect to backend for live updates
  useEffect(() => {
    if (!puzzle) return;
    setStatus('running');

    // TODO (Taingchay): replace with real WebSocket URL once backend is ready
    // const ws = new WebSocket(`ws://localhost:8000/ws/${playerType}`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.status === 'done') { setStatus('done'); setStats(data); }
    //   if (data.status === 'did_not_finish') setStatus('did_not_finish');
    // };
    // return () => ws.close();
  }, [puzzle, playerType]);

  return (
    <div className={`solver-panel solver-panel--${playerType}`}>

      {/* Status badge */}
      {status === 'done'            && <div className="complete-badge">✅ COMPLETE</div>}
      {status === 'did_not_finish'  && <div className="dnf-badge">⏱ Did Not Finish</div>}
      {status === 'running'         && <div className="running-badge">⚡ Running… {elapsed}s</div>}

      {/* Stats */}
      {stats && (
        <div className="stats">
          <p>Time: {stats.time}s</p>
          <p>Correct: {stats.correct ? '✅' : '❌'}</p>

          {playerType === 'classical' && (
            <p>Checks used: {stats.checks_used}</p>
          )}

          {playerType === 'quantum' && level === 'easy' && (
            <>
              <p>Oracle calls: {stats.oracle_calls}</p>
              <p>Qubits: {stats.qubits}</p>
              <p>Circuit depth: {stats.circuit_depth}</p>
            </>
          )}

          {playerType === 'quantum' && level === 'hard' && (
            <>
              <p>Circuit evaluations: {stats.circuit_evaluations}</p>
              <p>Qubits: {stats.qubits}</p>
              <p>Approx. ratio: {stats.approximation_ratio}</p>
            </>
          )}
        </div>
      )}

      {/* Quantum visualizations */}
      {playerType === 'quantum' && status === 'done' && stats && (
        <>
          {level === 'easy' && <GroverChart counts={stats.measurement_counts} />}
          {level === 'hard' && <QAOAChart costHistory={stats.cost_history} />}
        </>
      )}
    </div>
  );
}

export default SolverPanel;
