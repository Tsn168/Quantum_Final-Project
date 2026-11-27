// Scoreboard.js
// Owner: Reach
// Live standings beside the board: who has claimed how many cells, and what each player is doing.

import React from 'react';
import { PLAYERS } from '../players';
import { algorithmName } from '../format';

function Scoreboard({ score, status, totalCells, solve }) {
  // "QAOA, placing numbers" once the method is known; just the status before that.
  const note = id => {
    if (id === 'you') return 'By hand';
    const algorithm = solve?.[id]?.algorithm;
    return algorithm ? `${algorithmName(algorithm)}, ${status(id).toLowerCase()}` : status(id);
  };

  return (
    <aside className="scoreboard" aria-label="Players">
      <h2>Players</h2>
      <ol className="players">
        {PLAYERS.map(p => {
          const s = score[p.id];
          return (
            <li key={p.id} className={`player player--${p.id}`}>
              <span className="player-swatch" aria-hidden="true" />
              <div className="player-text">
                <span className="player-name">{p.name}</span>
                <span className="player-note">
                  {note(p.id)}
                </span>
              </div>
              <span className="player-count" aria-label={`${s.claimed} cells`}>{s.claimed}</span>
            </li>
          );
        })}
      </ol>

      <div className="claim-bar" aria-hidden="true">
        {PLAYERS.map(p => (
          <span
            key={p.id}
            className={`claim claim--${p.id}`}
            style={{ flexGrow: score[p.id].claimed, flexBasis: 0 }}
          />
        ))}
        <span className="claim claim--open" style={{ flexGrow: Math.max(0, totalCells - PLAYERS.reduce((n, p) => n + score[p.id].claimed, 0)), flexBasis: 0 }} />
      </div>

      <p className="scoreboard-note">
        The computers know the answer once they finish solving, but they place one number
        at a time so you can keep up. Their real speed is on the results screen.
      </p>
    </aside>
  );
}

export default Scoreboard;
