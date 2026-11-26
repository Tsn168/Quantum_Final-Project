import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Full Easy game against the mock backend (src/api/mock.js):
// pick Easy → solvers finish → fill the 4 empty cells → results screen.
test('plays an easy game end to end with the mock backend', async () => {
  render(<App />);

  fireEvent.click(screen.getByText('Easy'));
  expect(await screen.findByText(/Race — Easy 4×4/)).toBeInTheDocument();

  // Classical + quantum panels both finish.
  expect(await screen.findAllByText('✅ COMPLETE', {}, { timeout: 3000 })).toHaveLength(2);
  expect(screen.getByText(/Grover Measurement Probabilities \(ideal\)/)).toBeInTheDocument();

  // Mock easy puzzle blanks: (1,3)=1, (2,1)=1, (2,2)=4, (3,3)=3 (1-based).
  fireEvent.change(screen.getByLabelText('cell 1-3'), { target: { value: '1' } });
  // One entry must not end the game (empty cells are 0, not '').
  expect(screen.queryByText('Race Results')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('cell 2-1'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('cell 2-2'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('cell 3-3'), { target: { value: '3' } });

  expect(await screen.findByText('Race Results')).toBeInTheDocument();
  expect(screen.getByText('Quantum (grover)')).toBeInTheDocument();
  expect(screen.getAllByText('12 oracle calls').length).toBeGreaterThan(0);
  expect(screen.getAllByText('128 rule checks').length).toBeGreaterThan(0);
  expect(screen.getAllByText('✅')).toHaveLength(3);
});
