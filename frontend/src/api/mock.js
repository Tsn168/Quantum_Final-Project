// mock.js
// Owner: Reach
// Fake backend that returns exactly the shapes in docs/api-contract.md.
// Lets the frontend run before the real backend exists. Numbers here are placeholders,
// not measurements. Each game gets a fresh puzzle from src/sudoku.js with exactly one solution.

import { generatePuzzle } from '../sudoku';

const sessions = {};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const copy  = board => board.map(row => [...row]);
const same  = (a, b) => a.every((row, r) => row.every((cell, c) => cell === b[r][c]));

function classicalResult(level, solution) {
  return {
    player: 'classical',
    algorithm: level === 'easy' ? 'brute_force' : 'backtracking',
    status: 'done',
    reason: null,
    solution: copy(solution),
    correct: true,
    time_ms: level === 'easy' ? 0.1 : 1.1,
    // easy: brute force averages N/2 = 256/2 checks for 4 blanks
    search_cost: { metric: 'checks', value: level === 'easy' ? 128 : 2318 },
    quantum: null,
  };
}

function quantumResult(level, solution) {
  if (level === 'easy') {
    return {
      player: 'quantum',
      algorithm: 'grover',
      status: 'done',
      reason: null,
      solution: copy(solution),
      correct: true,
      time_ms: 850,
      search_cost: { metric: 'oracle_calls', value: 12 },
      quantum: {
        mode: 'ideal',
        qubits: 8,
        circuit_depth: 340,
        shots: 1024,
        // 4 blanks × 2 qubits; digits 1..4 → 00..11. Solution bitstring dominates.
        measurement_counts: {
          '00001110': 961, '01001110': 9, '00011110': 8, '00001010': 7,
          '10001110': 7,   '00001111': 6, '00101110': 6, '11001110': 5,
          '00001100': 5,   '00000110': 5, '01011010': 5,
        },
        cost_history: null,
        approximation_ratio: null,
      },
    };
  }
  return {
    player: 'quantum',
    algorithm: 'qaoa',
    status: 'done',
    reason: null,
    solution: copy(solution),
    correct: true,
    time_ms: 4200,
    search_cost: { metric: 'circuit_evaluations', value: 60 },
    quantum: {
      mode: 'ideal',
      qubits: 24,
      circuit_depth: 210,
      shots: 1024,
      measurement_counts: null,
      cost_history: [9.8, 8.1, 7.4, 6.0, 5.2, 4.1, 3.5, 2.6, 1.9, 1.2, 0.8, 0.5, 0.3, 0.2, 0.1],
      approximation_ratio: 0.94,
    },
  };
}

export async function createGame(level) {
  await delay(400);
  const puzzle = generatePuzzle(level);
  const gameId = Math.random().toString(36).slice(2, 8);
  sessions[gameId] = { level, solution: puzzle.solution, human: null, solve: null };
  return { game_id: gameId, level, size: puzzle.size, box: puzzle.box, board: copy(puzzle.board) };
}

export async function solveGame(gameId) {
  const session = sessions[gameId];
  if (!session) throw new Error(`Unknown game: ${gameId}`);
  await delay(session.level === 'easy' ? 1500 : 3000);
  session.solve = {
    classical: classicalResult(session.level, session.solution),
    quantum:   quantumResult(session.level, session.solution),
  };
  return session.solve;
}

export async function submitHuman(gameId, board, timeMs) {
  const session = sessions[gameId];
  if (!session) throw new Error(`Unknown game: ${gameId}`);
  await delay(100);
  session.human = { correct: same(board, session.solution), time_ms: timeMs };
  return session.human;
}

export async function getResults(gameId) {
  const session = sessions[gameId];
  if (!session) throw new Error(`Unknown game: ${gameId}`);
  await delay(100);
  return {
    game_id: gameId,
    level: session.level,
    human: session.human,
    classical: session.solve?.classical ?? null,
    quantum: session.solve?.quantum ?? null,
  };
}
