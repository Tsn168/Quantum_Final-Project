// RaceView.js
// Owner: Reach
// Race screen: the human board on the left, the classical and quantum solvers on the right.
// Starts both solvers once (POST /game/{id}/solve) and hands each panel its SolverResult.

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

  const title = game.level === 'easy' ? 'Easy 4×4' : 'Hard 9×9';

  return (
    <section>
      <div className="race-head">
        <h2>{title}</h2>
        <p>Fill every empty cell. Numbers that break a rule turn red.</p>
      </div>

      <div className="race">
        <div className="panel">
          <div className="panel-head">
            <h3>You</h3>
          </div>
          <HumanGrid puzzle={game.board} box={game.box} onComplete={handleHumanComplete} />
        </div>

        <div className="solvers">
          <SolverPanel playerType="classical" result={solve?.classical} failed={failed} />
          <SolverPanel playerType="quantum" result={solve?.quantum} failed={failed} />
        </div>
      </div>
    </section>
  );
}

export default RaceView;
