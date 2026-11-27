import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from './App';
import { solve } from './sudoku';

// Read a board back from its cells' labels ("Row 1, column 3: 4" or ": empty").
function readBoard(grid) {
  const cells = within(grid).getAllByRole('gridcell');
  const size = Math.sqrt(cells.length);
  const board = Array.from({ length: size }, () => Array(size).fill(0));
  cells.forEach(cell => {
    const [, r, c, v] = cell.getAttribute('aria-label').match(/Row (\d+), column (\d+): (\w+)/);
    board[r - 1][c - 1] = v === 'empty' ? 0 : Number(v);
  });
  return board;
}

function fillYourBoard(grid) {
  const board = readBoard(grid);
  const answer = solve(board, [2, 2]);
  board.forEach((row, r) => row.forEach((v, c) => {
    if (v !== 0) return;
    const cell = within(grid).getByRole('gridcell', { name: new RegExp(`^Row ${r + 1}, column ${c + 1}:`) });
    fireEvent.click(cell);
    fireEvent.keyDown(cell, { key: String(answer[r][c]) });
  }));
}

afterEach(() => jest.useRealTimers());

test('each player gets their own board with the same puzzle', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Easy/ }));

  const yours     = await screen.findByRole('grid', { name: 'Your Sudoku board' });
  const classical = screen.getByRole('grid', { name: "Classical computer's board" });
  const quantum   = screen.getByRole('grid', { name: "Quantum computer's board" });

  expect(readBoard(classical)).toEqual(readBoard(yours));
  expect(readBoard(quantum)).toEqual(readBoard(yours));

  // Typing on your board does not touch the computers' boards.
  const empty = within(yours).getAllByRole('gridcell', { name: /empty/ })[0];
  fireEvent.click(empty);
  fireEvent.keyDown(empty, { key: '1' });
  expect(readBoard(yours)).not.toEqual(readBoard(classical));
});

test('you win when you finish your board before the computers', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Easy/ }));
  fillYourBoard(await screen.findByRole('grid', { name: 'Your Sudoku board' }));

  expect(await screen.findByText(/^You finished first, in/, {}, { timeout: 4000 })).toBeInTheDocument();
  expect(screen.getByText('Searches needed to solve this puzzle')).toBeInTheDocument();
  expect(screen.getAllByText('Still solving')).toHaveLength(2);
});

test('the computers fill their own boards with live cursors and can beat you', async () => {
  jest.useFakeTimers();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Easy/ }));
  await act(async () => { jest.advanceTimersByTime(500); });

  // Both cursors wait above their boards while the solvers work.
  expect(document.querySelectorAll('.cursor--wait')).toHaveLength(2);

  const classical = screen.getByRole('grid', { name: "Classical computer's board" });
  const quantum   = screen.getByRole('grid', { name: "Quantum computer's board" });
  let sawMovingCursors = false;
  for (let i = 0; i < 120 && screen.queryAllByText('Finished').length < 2; i++) {
    await act(async () => { jest.advanceTimersByTime(1000); });
    if (document.querySelectorAll('.cursor--move, .cursor--aim').length === 2) sawMovingCursors = true;
  }

  expect(sawMovingCursors).toBe(true);
  expect(readBoard(classical).flat()).not.toContain(0);
  expect(readBoard(quantum).flat()).not.toContain(0);
  expect(document.querySelectorAll('.cursor')).toHaveLength(0);

  // You finish last; a computer wins.
  fillYourBoard(screen.getByRole('grid', { name: 'Your Sudoku board' }));
  // Submitting and loading results are two chained requests, so advance time twice.
  for (let i = 0; i < 3; i++) await act(async () => { jest.advanceTimersByTime(500); });
  expect(screen.getByText(/^The (classical computer|quantum algorithm) finished first, in/)).toBeInTheDocument();
});
