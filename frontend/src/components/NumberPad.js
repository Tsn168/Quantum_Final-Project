// NumberPad.js
// Owner: Reach
// On-screen digits for the selected cell (handy on touch screens; the keyboard works too).

import React from 'react';

function NumberPad({ size, disabled, onDigit }) {
  return (
    <div className={`pad pad--${size}`} role="group" aria-label="Number pad">
      {Array.from({ length: size }, (_, i) => i + 1).map(d => (
        <button key={d} type="button" className="pad-key" disabled={disabled} onClick={() => onDigit(d)}>
          {d}
        </button>
      ))}
      <button type="button" className="pad-key pad-clear" disabled={disabled} onClick={() => onDigit(0)}>
        Clear
      </button>
    </div>
  );
}

export default NumberPad;
