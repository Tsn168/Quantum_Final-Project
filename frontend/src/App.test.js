import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

test('loads a generated puzzle from the backend when a level is selected', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      board: [
        [1, 0, 0, 4],
        [0, 4, 1, 0],
        [0, 1, 4, 0],
        [4, 0, 0, 1],
      ],
    }),
  });

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /easy/i }));

  expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'easy' }),
  });
  expect(await screen.findByText(/Race — Easy 4×4/)).toBeInTheDocument();
});
