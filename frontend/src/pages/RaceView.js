// RaceView.js
// Owner: Reach
// Three-panel race screen shown after the puzzle is generated.
// Starts the classical + quantum solvers once (POST /game/{id}/solve) and hands each
// panel its SolverResult. HumanGrid reports the finished board and the time taken.

import React, { useEffect, useRef, useState } from 'react';
import HumanGrid from '../components/HumanGrid';
import SolverPanel from '../components/SolverPanel';
import { solveGame } from '../api/client';

function RaceView({ game, onHumanComplete }) {
  const [solve, setSolve] = useState(null);   // { classical, quantum } or null while running
  const [failed, setFailed] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    startedAt.current = Date.now();
    solveGame(game.game_id)
      .then(result => { if (!cancelled) setSolve(result); })
      .catch(err => {
        console.error('Solve failed:', err);
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [game.game_id]);

  function handleHumanComplete(board) {
    onHumanComplete(board, Date.now() - startedAt.current);
  }

  return (
    <div className="race-view">
      <h2>Race — {game.level === 'easy' ? 'Easy 4×4' : 'Hard 9×9'}</h2>

      <div className="panels">
        <div className="panel">
          <h3>Human</h3>
          <HumanGrid puzzle={game.board} box={game.box} onComplete={handleHumanComplete} />
        </div>

        <div className="panel">
          <h3>Classical</h3>
          <SolverPanel playerType="classical" result={solve?.classical} failed={failed} />
        </div>

        <div className="panel">
          <h3>Quantum</h3>
          <SolverPanel playerType="quantum" result={solve?.quantum} failed={failed} />
        </div>
      </div>
    </div>
  );
}

export default RaceView;
