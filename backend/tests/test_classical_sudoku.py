import unittest

from backend.classical_ml.solver import solve
from backend.puzzle_generator.generator import generate_puzzle
from backend.puzzle_generator.validator import count_solutions, validate_puzzle


class SudokuBackendTests(unittest.TestCase):
    def test_easy_generation_is_unique_and_solver_returns_valid_result(self):
        puzzle = generate_puzzle("easy")
        self.assertTrue(validate_puzzle(puzzle["givens"], puzzle["solution"]))
        self.assertEqual(count_solutions(puzzle["givens"]), 1)

        result = solve(puzzle["givens"])
        self.assertTrue(validate_puzzle(puzzle["givens"], result["solution"]))
        self.assertGreater(result["checks_used"], 0)
        self.assertGreaterEqual(result["time"], 0)

    def test_hard_generation_is_unique(self):
        puzzle = generate_puzzle("hard")
        self.assertTrue(validate_puzzle(puzzle["givens"], puzzle["solution"]))
        result = solve(puzzle["givens"])
        self.assertTrue(validate_puzzle(puzzle["givens"], result["solution"]))
        self.assertGreater(result["checks_used"], 0)

    def test_invalid_input_is_rejected(self):
        with self.assertRaises(ValueError):
            generate_puzzle("medium")
        with self.assertRaises(ValueError):
            solve([[1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]])


if __name__ == "__main__":
    unittest.main()
