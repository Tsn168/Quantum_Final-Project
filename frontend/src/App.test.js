import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from './App';
import { solve } from './sudoku';

// Read the shared board back from the cells' labels ("Row 1, column 3: 4" or ": empty").
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

afterEach(() => jest.useRealTimers());

test('you win the easy board by filling every cell before the computers move', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Easy/ }));

  const grid = await screen.findByRole('grid', { name: 'Shared Sudoku board' });
  const board = readBoard(grid);
  const answer = solve(board, [2, 2]);
  const blanks = board.flatMap((row, r) => row.map((v, c) => (v === 0 ? [r, c] : null))).filter(Boolean);
  expect(blanks.length).toBeGreaterThanOrEqual(6);

  for (const [r, c] of blanks) {
    const cell = within(grid).getByRole('gridcell', { name: new RegExp(`^Row ${r + 1}, column ${c + 1}:`) });
    fireEvent.click(cell);
    fireEvent.keyDown(cell, { key: String(answer[r][c]) });
  }

  expect(await screen.findByText(`You won the board with ${blanks.length} correct cells.`, {}, { timeout: 4000 })).toBeInTheDocument();
  expect(screen.getByText('Searches needed to solve this puzzle')).toBeInTheDocument();
  expect(screen.getByText(`${blanks.length} of ${blanks.length}`)).toBeInTheDocument();
});

test('the computers move their cursors and fill the board when you do nothing', async () => {
  jest.useFakeTimers();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Easy/ }));
  await act(async () => { jest.advanceTimersByTime(500); });

  const grid = screen.getByRole('grid', { name: 'Shared Sudoku board' });
  const blanks = readBoard(grid).flat().filter(v => v === 0).length;

  // Both cursors are on the board while the solvers work.
  expect(document.querySelectorAll('.cursor--wait')).toHaveLength(2);

  let placedByComputer = false;
  for (let i = 0; i < 120 && !screen.queryByText(/won the board|A tie/); i++) {
    await act(async () => { jest.advanceTimersByTime(1000); });
    if (within(grid).queryAllByRole('gridcell', { name: /placed by (Classical|Quantum)/ }).length) {
      placedByComputer = true;
    }
  }

  expect(placedByComputer).toBe(true);
  expect(screen.getByText(/won the board|A tie/).textContent).not.toMatch(/^You won/);

  // Every blank went to one of the computers; you placed nothing.
  const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
  // "Correct cells" column reads "<correct> of <placed>".
  const placed = rows.map(row => Number(within(row).getAllByRole('cell')[2].textContent.split(' of ')[1]));
  expect(placed[0]).toBe(0);
  expect(placed[1] + placed[2]).toBe(blanks);
});
