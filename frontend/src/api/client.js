// client.js
// Owner: Reach
// The only place the frontend talks to the backend. Shapes follow docs/api-contract.md.
//
// Uses the mock (src/api/mock.js) until the backend is ready.
// To use the real backend:   REACT_APP_USE_MOCK=false npm start
// Backend URL (optional):    REACT_APP_API_URL=http://localhost:8000

import * as mock from './mock';

const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';
const API_URL  = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} failed: ${res.status}`);
  return res.json();
}

// POST /game → { game_id, level, size, box, board }
export function createGame(level) {
  if (USE_MOCK) return mock.createGame(level);
  return request('/game', { method: 'POST', body: JSON.stringify({ level }) });
}

// POST /game/{id}/solve → { classical: SolverResult, quantum: SolverResult }
export function solveGame(gameId) {
  if (USE_MOCK) return mock.solveGame(gameId);
  return request(`/game/${gameId}/solve`, { method: 'POST' });
}

// POST /game/{id}/submit → { correct, time_ms }
export function submitHuman(gameId, board, timeMs) {
  if (USE_MOCK) return mock.submitHuman(gameId, board, timeMs);
  return request(`/game/${gameId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ board, time_ms: timeMs }),
  });
}

// GET /game/{id}/results → { game_id, level, human, classical, quantum }
export function getResults(gameId) {
  if (USE_MOCK) return mock.getResults(gameId);
  return request(`/game/${gameId}/results`);
}
