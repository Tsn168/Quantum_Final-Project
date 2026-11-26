// App.js
// Root component — manages which screen is shown and game session state.
// Flow: LevelSelect → (loading puzzle) → RaceView → Results
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

function App() {
  const [screen,  setScreen]  = useState(SCREENS.SELECT);
  const [game,    setGame]    = useState(null);   // POST /game response
  const [results, setResults] = useState(null);   // GET /game/{id}/results response
  const [error,   setError]   = useState(null);

  async function handleSelectLevel(level) {
    setError(null);
    setScreen(SCREENS.LOADING);
    try {
      setGame(await createGame(level));
      setScreen(SCREENS.RACE);
    } catch (err) {
      console.error('Failed to load puzzle:', err);
      setError('Could not start a game. Is the backend running?');
      setScreen(SCREENS.SELECT);
    }
  }

  async function handleHumanComplete(board, timeMs) {
    try {
      await submitHuman(game.game_id, board, timeMs);
      setResults(await getResults(game.game_id));
      setScreen(SCREENS.RESULTS);
    } catch (err) {
      console.error('Failed to submit board:', err);
      setError('Could not submit your board.');
    }
  }

  function handlePlayAgain() {
    setScreen(SCREENS.SELECT);
    setGame(null);
    setResults(null);
    setError(null);
  }

  return (
    <div className="app">
      {error && <p className="error">{error}</p>}

      {screen === SCREENS.SELECT && (
        <LevelSelect onSelectLevel={handleSelectLevel} />
      )}

      {screen === SCREENS.LOADING && (
        <div className="loading">
          <p>Generating puzzle…</p>
        </div>
      )}

      {screen === SCREENS.RACE && (
        <RaceView game={game} onHumanComplete={handleHumanComplete} />
      )}

      {screen === SCREENS.RESULTS && (
        <>
          <Results results={results} />
          <button className="play-again" onClick={handlePlayAgain}>
            Play Again
          </button>
        </>
      )}
    </div>
  );
}

export default App;
