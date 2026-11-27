import { generatePuzzle, countSolutions, solve, LEVELS } from './sudoku';

const clues = board => board.flat().filter(v => v !== 0).length;

test.each(['easy', 'hard'])('%s puzzles have one solution and the planned number of clues', level => {
  for (let i = 0; i < 3; i++) {
    const { board, solution, box } = generatePuzzle(level);
    const [min, max] = LEVELS[level].clues;
    // The generator stops early only if no further clue can be removed uniquely.
    expect(clues(board)).toBeLessThanOrEqual(max);
    expect(clues(board)).toBeGreaterThanOrEqual(level === 'hard' ? 17 : 4);
    expect(clues(board)).toBeLessThanOrEqual(level === 'hard' ? 28 : 10);
    if (level === 'hard') expect(clues(board)).toBeLessThan(36);
    expect(countSolutions(board, box, 2)).toBe(1);
    expect(solve(board, box)).toEqual(solution);
    expect(min).toBeLessThanOrEqual(max);
  }
});

test('hard puzzles start from far fewer numbers than before', () => {
  const counts = Array.from({ length: 5 }, () => clues(generatePuzzle('hard').board));
  expect(Math.max(...counts)).toBeLessThanOrEqual(28);
});
