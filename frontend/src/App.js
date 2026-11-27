// App.js
// Root component — manages which screen is shown and game session state.
// Flow: LevelSelect → (loading puzzle) → RaceView → Results

import React, { useState } from 'react';
import LevelSelect from './pages/LevelSelect';
import RaceView    from './pages/RaceView';
import Results     from './pages/Results';
import './App.css';

const SCREENS = {
  SELECT:  'select',
  LOADING: 'loading',
  RACE:    'race',
  RESULTS: 'results',
};

function App() {
  const [screen,  setScreen]  = useState(SCREENS.SELECT);
  const [level,   setLevel]   = useState(null);
  const [puzzle,  setPuzzle]  = useState(null);
  const [results, setResults] = useState(null);

  async function handleSelectLevel(selectedLevel) {
    setLevel(selectedLevel);
    setScreen(SCREENS.LOADING);

    try {
      const response = await fetch('http://localhost:8000/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selectedLevel }),
      });
      if (!response.ok) {
        throw new Error(`Puzzle request failed with status ${response.status}`);
      }
      const data = await response.json();
      setPuzzle(data.board);
      setScreen(SCREENS.RACE);
    } catch (err) {
      console.error('Failed to load puzzle:', err);
      setScreen(SCREENS.SELECT);
    }
  }

  function handleHumanComplete(solvedBoard) {
    // TODO (Taingchay): POST to /game/{id}/submit and then GET /game/{id}/results
    // For now, move straight to results with placeholder data
    setResults({
      human:     { time: null, correct: true },
      classical: { time: null, correct: true, checks_used: null },
      quantum:   { time: null, correct: true, oracle_calls: null, circuit_evaluations: null },
    });
    setScreen(SCREENS.RESULTS);
  }

  function handlePlayAgain() {
    setScreen(SCREENS.SELECT);
    setLevel(null);
    setPuzzle(null);
    setResults(null);
  }

  return (
    <div className="app">
      {screen === SCREENS.SELECT && (
        <LevelSelect onSelectLevel={handleSelectLevel} />
      )}

      {screen === SCREENS.LOADING && (
        <div className="loading">
          <p>Generating puzzle…</p>
        </div>
      )}

      {screen === SCREENS.RACE && (
        <RaceView
          puzzle={puzzle}
          level={level}
          onHumanComplete={handleHumanComplete}
        />
      )}

      {screen === SCREENS.RESULTS && (
        <>
          <Results results={results} level={level} />
          <button className="play-again" onClick={handlePlayAgain}>
            Play Again
          </button>
        </>
      )}
    </div>
  );
}

export default App;
