// RaceView.js
// Owner: Reach
// Three-way race: you, the classical computer and the quantum algorithm each get their own
// copy of the same puzzle and fill it at the same time. Whoever finishes their board
// correctly first wins.
//
// The computers play from their real SolverResult (POST /game/{id}/solve). They fill their
// boards one cell at a time, at human speed, with a live cursor, so the race is watchable;
// their real search counts and times are on the results screen.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import SudokuBoard from '../components/SudokuBoard';
import NumberPad from '../components/NumberPad';
import SolverPanel from '../components/SolverPanel';
import { solveGame } from '../api/client';
import { BOTS } from '../players';

// Milliseconds per cell for the computer that needed fewer searches; the other takes 30% longer.
const PACE = { easy: 3200, hard: 4200 };
const LABELS = { classical: 'Classical', quantum: 'Quantum' };

const copy = board => board.map(row => [...row]);
const emptyCells = board =>
  board.flatMap((row, r) => row.map((v, c) => (v === 0 ? [r, c] : null))).filter(Boolean);

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function Clock({ startedAt, running }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  return (
    <span className="clock" aria-label={`${s} seconds played`}>
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
    </span>
  );
}

function RaceView({ game, onHumanComplete }) {
  const size = game.board.length;
  const total = emptyCells(game.board).length;

  const [board, setBoard] = useState(() => copy(game.board));          // your board
  const [selected, setSelected] = useState(null);
  const [botBoards, setBotBoards] = useState(() => ({ classical: copy(game.board), quantum: copy(game.board) }));
  const [cursors, setCursors] = useState({
    // Parked above the board until their solver answers.
    classical: { r: -0.5, c: 0, mode: 'wait' },
    quantum:   { r: -0.5, c: 0, mode: 'wait' },
  });
  const [botDone, setBotDone] = useState({ classical: null, quantum: null });   // race ms when finished
  const [yourTime, setYourTime] = useState(null);
  const [solve, setSolve] = useState(null);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    solveGame(game.game_id)
      .then(result => { if (!cancelled) setSolve(result); })
      .catch(err => {
        console.error('Solve failed:', err);
        if (!cancelled) { setFailed(true); setCursors({}); }
      });
    return () => { cancelled = true; };
  }, [game.game_id]);

  // Each computer fills its own board once its result arrives.
  useEffect(() => {
    if (!solve) return;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const moveCursor = (who, cursor) => setCursors(prev => ({ ...prev, [who]: cursor }));

    const costs = BOTS.map(who => solve[who]?.search_cost?.value ?? Infinity);
    const fasterIndex = costs[0] <= costs[1] ? 0 : 1;

    BOTS.forEach((who, i) => {
      const result = solve[who];
      if (!result || result.status !== 'done' || !result.solution) {
        moveCursor(who, null);
        return;
      }
      const interval = PACE[game.level] * (i === fasterIndex ? 1 : 1.3);

      // Classical works through the board in reading order, like backtracking.
      // Quantum fills cells in a random order and glances at other cells first.
      const blanks = emptyCells(game.board);
      const order = who === 'classical' ? blanks : shuffle(blanks);

      const step = k => {
        if (k >= order.length) {
          moveCursor(who, null);
          setBotDone(prev => ({ ...prev, [who]: Date.now() - startedAt.current }));
          return;
        }
        const target = order[k];
        const rest = order.slice(k + 1);
        const probes = who === 'quantum' && rest.length > 1 ? shuffle(rest).slice(0, 2) : [];

        const hop = (interval * (0.85 + Math.random() * 0.3)) / (probes.length + 2);
        probes.forEach(([r, c], n) => later(() => moveCursor(who, { r, c, mode: 'move' }), hop * n));
        later(() => moveCursor(who, { r: target[0], c: target[1], mode: 'aim' }), hop * probes.length);
        later(() => {
          const [r, c] = target;
          setBotBoards(prev => {
            const next = copy(prev[who]);
            next[r][c] = result.solution[r][c];
            return { ...prev, [who]: next };
          });
          moveCursor(who, { r, c, mode: 'move' });
          step(k + 1);
        }, hop * (probes.length + 1));
      };

      later(() => step(0), 300 + i * 400);
    });

    return () => timers.forEach(clearTimeout);
  }, [solve, game.level, game.board]);

  // Your race time is taken the moment your board is full.
  useEffect(() => {
    if (yourTime == null && emptyCells(board).length === 0) setYourTime(Date.now() - startedAt.current);
  }, [board, yourTime]);

  // The race ends when your board is full and the solvers have answered.
  useEffect(() => {
    if (finished || yourTime == null || (!solve && !failed)) return;
    setFinished(true);
    setCursors({});
    onHumanComplete(board, yourTime, { you: yourTime, ...botDone });
  }, [finished, yourTime, solve, failed, board, botDone, onHumanComplete]);

  const handleInput = useCallback((r, c, digit) => {
    if (finished || game.board[r][c] !== 0) return;
    setBoard(prev => {
      const next = copy(prev);
      next[r][c] = digit;
      return next;
    });
  }, [finished, game.board]);

  const title = game.level === 'easy' ? 'Easy 4×4' : 'Hard 9×9';
  const yourFilled = total - emptyCells(board).length;
  const selectedIsGiven = selected && game.board[selected[0]][selected[1]] !== 0;

  return (
    <section>
      <div className="race-head">
        <h2>{title}</h2>
        <p>
          Same puzzle, three boards. First to finish correctly wins. The computers fill
          their boards at human speed; their real speed is on the results screen.
        </p>
      </div>

      <div className="race race--three">
        <div className="panel panel--you">
          <div className="panel-head">
            <h3>You</h3>
            <span className="race-meta">
              <Clock startedAt={startedAt.current} running={!finished} />
              <span className="badge badge-outline">{yourFilled} of {total} cells</span>
            </span>
          </div>
          <SudokuBoard
            player="you"
            label="Your Sudoku board"
            puzzle={game.board}
            board={board}
            box={game.box}
            interactive
            selected={selected}
            onSelect={setSelected}
            onInput={handleInput}
            disabled={finished}
          />
          <NumberPad
            size={size}
            disabled={!selected || finished || selectedIsGiven}
            onDigit={d => selected && handleInput(selected[0], selected[1], d)}
          />
          <p className="hint">
            Pick a cell, then type a number or use the pad. Numbers that break a rule turn red.
          </p>
        </div>

        {BOTS.map(who => (
          <SolverPanel
            key={who}
            playerType={who}
            result={solve?.[who]}
            failed={failed}
            progress={{ filled: total - emptyCells(botBoards[who]).length, total }}
            raceMs={botDone[who]}
          >
            <SudokuBoard
              player={who}
              label={`${LABELS[who]} computer's board`}
              puzzle={game.board}
              board={botBoards[who]}
              box={game.box}
              cursor={cursors[who]}
              cursorLabel={LABELS[who]}
            />
          </SolverPanel>
        ))}
      </div>

    </section>
  );
}

export default RaceView;
