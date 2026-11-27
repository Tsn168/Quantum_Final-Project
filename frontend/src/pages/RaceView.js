// RaceView.js
// Owner: Reach
// Multiplayer race on one shared board: you, the classical computer and the quantum algorithm
// all claim empty cells. The board fills up; whoever placed the most correct numbers wins.
//
// The computers play from their real SolverResult (POST /game/{id}/solve). Their moves are
// paced to human speed so the race is playable; the real search counts and times are shown
// on the results screen.

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import SharedBoard from '../components/SharedBoard';
import NumberPad from '../components/NumberPad';
import SolverPanel from '../components/SolverPanel';
import { solveGame } from '../api/client';
import { BOTS } from '../players';

// Milliseconds per cell for the faster computer; the slower one takes 30% longer.
const PACE = { easy: 3200, hard: 4200 };
const LABELS = { you: 'You', classical: 'Classical', quantum: 'Quantum' };

function initCells(puzzle) {
  return {
    board: puzzle.map(row => [...row]),
    owner: puzzle.map(row => row.map(v => (v === 0 ? null : 'given'))),
  };
}

// Only empty cells can be claimed; you may also change or clear your own cells.
function cellsReducer(state, { r, c, digit, who }) {
  const current = state.owner[r][c];
  const allowed = who === 'you' ? current === null || current === 'you' : state.board[r][c] === 0;
  if (!allowed) return state;
  const board = state.board.map(row => [...row]);
  const owner = state.owner.map(row => [...row]);
  board[r][c] = digit;
  owner[r][c] = digit === 0 ? null : who;
  return { board, owner };
}

const emptyCells = board =>
  board.flatMap((row, r) => row.map((v, c) => (v === 0 ? [r, c] : null))).filter(Boolean);

// The answer key comes from whichever computer solved the puzzle correctly.
function answerKey(solve) {
  if (solve?.classical?.correct && solve.classical.solution) return solve.classical.solution;
  if (solve?.quantum?.correct && solve.quantum.solution) return solve.quantum.solution;
  return null;
}

export function tally(cells, solution) {
  const result = {};
  for (const id of ['you', ...BOTS]) result[id] = { claimed: 0, correct: solution ? 0 : null };
  cells.owner.forEach((row, r) => row.forEach((who, c) => {
    if (!result[who]) return;
    result[who].claimed++;
    if (solution && cells.board[r][c] === solution[r][c]) result[who].correct++;
  }));
  return result;
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
  const [cells, dispatch] = useReducer(cellsReducer, game.board, initCells);
  const [selected, setSelected] = useState(null);
  const [solve, setSolve] = useState(null);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [cursors, setCursors] = useState({
    // Parked on the top corners until their solver answers.
    classical: { r: -0.5, c: 0, mode: 'wait' },
    quantum:   { r: -0.5, c: size - 1, mode: 'wait' },
  });
  const startedAt = useRef(Date.now());

  // Timers read the latest state through refs.
  const cellsRef = useRef(cells);
  const selectedRef = useRef(selected);
  const targetsRef = useRef({});
  cellsRef.current = cells;
  selectedRef.current = selected;

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

  // Each computer plays once its result arrives.
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

      const step = () => {
        const { board } = cellsRef.current;
        const sel = selectedRef.current;
        const other = targetsRef.current[BOTS[1 - i]];
        const open = emptyCells(board).filter(([r, c]) =>
          !(sel && sel[0] === r && sel[1] === c) && !(other && other[0] === r && other[1] === c));

        if (open.length === 0) {
          if (emptyCells(board).length === 0) { moveCursor(who, null); return; }
          later(step, 400);   // only contested cells left; wait for them to free up
          return;
        }

        // Classical works through the board in order, like backtracking.
        // Quantum looks at a couple of cells at random before it settles on one.
        const pick = () => open[Math.floor(Math.random() * open.length)];
        const target = who === 'classical' ? open[0] : pick();
        const probes = who === 'quantum' && open.length > 2 ? [pick(), pick()] : [];
        targetsRef.current[who] = target;

        const jitter = 0.85 + Math.random() * 0.3;
        const hop = (interval * jitter) / (probes.length + 2);
        probes.forEach(([r, c], k) => later(() => moveCursor(who, { r, c, mode: 'move' }), hop * k));
        later(() => moveCursor(who, { r: target[0], c: target[1], mode: 'aim' }), hop * probes.length);
        later(() => {
          const [r, c] = target;
          dispatch({ r, c, digit: result.solution[r][c], who });
          targetsRef.current[who] = null;
          moveCursor(who, { r, c, mode: 'move' });
          later(step, 80);   // let the board re-render before choosing the next cell
        }, hop * (probes.length + 1));
      };

      later(step, 300 + i * 500);
    });

    return () => timers.forEach(clearTimeout);
  }, [solve, game.level]);

  // The race ends when every cell is filled and the solvers have answered
  // (their answer is what your cells are checked against).
  useEffect(() => {
    if (finished || emptyCells(cells.board).length > 0 || (!solve && !failed)) return;
    setFinished(true);
    setCursors({});
    onHumanComplete(cells.board, Date.now() - startedAt.current, tally(cells, answerKey(solve)));
  }, [cells, finished, solve, failed, onHumanComplete]);

  const handleInput = useCallback((r, c, digit) => {
    if (!finished) dispatch({ r, c, digit, who: 'you' });
  }, [finished]);

  const score = tally(cells, answerKey(solve));
  const title = game.level === 'easy' ? 'Easy 4×4' : 'Hard 9×9';
  const left = emptyCells(cells.board).length;
  const selectedOwner = selected && cells.owner[selected[0]][selected[1]];

  return (
    <section>
      <div className="race-head">
        <h2>{title}</h2>
        <p>Pick a cell and type a number. The computers fill cells too; most correct numbers wins.</p>
      </div>

      <div className="race">
        <div className="panel">
          <div className="panel-head">
            <h3>You</h3>
            <span className="race-meta">
              <Clock startedAt={startedAt.current} running={!finished} />
              <span className="badge badge-outline">{score.you.claimed} placed, {left} left</span>
            </span>
          </div>
          <SharedBoard
            board={cells.board}
            owner={cells.owner}
            box={game.box}
            selected={selected}
            cursors={cursors}
            labels={LABELS}
            onSelect={setSelected}
            onInput={handleInput}
            disabled={finished}
          />
          <NumberPad
            size={size}
            disabled={!selected || finished || !['you', null].includes(selectedOwner)}
            onDigit={d => selected && handleInput(selected[0], selected[1], d)}
          />
          <p className="hint">
            The computers already know the answer once they finish solving, but they place
            one number at a time so you can keep up. Their real speed is on the results screen.
          </p>
        </div>

        <div className="solvers">
          <SolverPanel playerType="classical" result={solve?.classical} failed={failed} cells={score.classical.claimed} />
          <SolverPanel playerType="quantum" result={solve?.quantum} failed={failed} cells={score.quantum.claimed} />
        </div>
      </div>
    </section>
  );
}

export default RaceView;
