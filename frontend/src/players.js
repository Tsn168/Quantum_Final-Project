// players.js
// Owner: Reach
// The three players who share one board. Colours live in App.css as --you, --classical, --quantum.

export const PLAYERS = [
  { id: 'you',       name: 'You',       short: 'You' },
  { id: 'classical', name: 'Classical computer', short: 'Classical' },
  { id: 'quantum',   name: 'Quantum algorithm',  short: 'Quantum' },
];

export const BOTS = ['classical', 'quantum'];

export function playerName(id) {
  return PLAYERS.find(p => p.id === id)?.name ?? id;
}
