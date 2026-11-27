import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Full Easy game against the mock backend (src/api/mock.js):
// pick Easy → solvers finish → fill the 4 empty cells → results screen.
test('plays an easy game end to end with the mock backend', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /Easy/ }));
  expect(await screen.findByText('Easy 4×4')).toBeInTheDocument();

  // Classical + quantum panels both finish.
  expect(await screen.findAllByText('Finished', {}, { timeout: 3000 })).toHaveLength(2);
  expect(screen.getByText(/Measured answers.*ideal simulator/)).toBeInTheDocument();

  // Mock easy puzzle blanks: (1,3)=1, (2,1)=1, (2,2)=4, (3,3)=3 (1-based).
  fireEvent.change(screen.getByLabelText('cell 1-3'), { target: { value: '1' } });
  // One entry must not end the game (empty cells are 0, not '').
  expect(screen.queryByText('Searches needed to solve this puzzle')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('cell 2-1'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('cell 2-2'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('cell 3-3'), { target: { value: '3' } });

  expect(await screen.findByText('Searches needed to solve this puzzle')).toBeInTheDocument();
  expect(screen.getByText('128')).toBeInTheDocument();
  expect(screen.getByText('12')).toBeInTheDocument();
  expect(screen.getByText(/10\.7× fewer searches/)).toBeInTheDocument();
  expect(screen.getAllByText('Correct')).toHaveLength(3);
});
