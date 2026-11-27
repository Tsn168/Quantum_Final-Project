// App.js
// Root component — manages which screen is shown and game session state.
// Flow: LevelSelect → (loading puzzle) → RaceView (shared board) → Results
// All backend calls go through src/api/client.js (see docs/api-contract.md).

import React, { useState } from 'react';
import LevelSelect from './pages/LevelSelect';
import RaceView    from './pages/RaceView';
import Results     from './pages/Results';
import { createGame, submitHuman, getResults } from './api/client';
import './App.css';

const SCREENS = {
  SELECT:  'select',
  LOADING: 'loading',
  RACE:    'race',
  RESULTS: 'results',
};

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span /><span /><span /><span />
    </span>
  );
}

function App() {
  const [screen,  setScreen]  = useState(SCREENS.SELECT);
  const [game,    setGame]    = useState(null);   // POST /game response
  const [results, setResults] = useState(null);   // GET /game/{id}/results response
  const [score,   setScore]   = useState(null);   // cells each player placed, from RaceView
  const [error,   setError]   = useState(null);

  async function handleSelectLevel(level) {
    setError(null);
    setScreen(SCREENS.LOADING);
    try {
      setGame(await createGame(level));
      setScreen(SCREENS.RACE);
    } catch (err) {
      console.error('Failed to load puzzle:', err);
      setError('The game server did not respond. Start the backend, then choose a level again.');
      setScreen(SCREENS.SELECT);
    }
  }

  async function handleHumanComplete(board, timeMs, tally) {
    setScore(tally);
    try {
      await submitHuman(game.game_id, board, timeMs);
      setResults(await getResults(game.game_id));
      setScreen(SCREENS.RESULTS);
    } catch (err) {
      console.error('Failed to submit board:', err);
      setError('The finished board was not sent. Check the backend is running, then choose Change level.');
    }
  }

  function handlePlayAgain() {
    setScreen(SCREENS.SELECT);
    setGame(null);
    setResults(null);
    setScore(null);
    setError(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="brand"><BrandMark /> QuSud Race</span>
        {screen !== SCREENS.SELECT && (
          <button className="btn btn-ghost" onClick={handlePlayAgain}>Change level</button>
        )}
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      {screen === SCREENS.SELECT && (
        <LevelSelect onSelectLevel={handleSelectLevel} />
      )}

      {screen === SCREENS.LOADING && (
        <p className="loading" role="status">Generating a new puzzle…</p>
      )}

      {screen === SCREENS.RACE && (
        <RaceView game={game} onHumanComplete={handleHumanComplete} />
      )}

      {screen === SCREENS.RESULTS && (
        <Results results={results} score={score} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}

export default App;
