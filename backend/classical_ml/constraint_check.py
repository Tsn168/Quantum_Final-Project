"""Constraint validation shared by the classical Sudoku solver."""

from collections.abc import Sequence

from backend.puzzle_generator.validator import is_valid_board


Board = Sequence[Sequence[int]]


def validate_input(board: Board) -> int:
    """Validate supported board dimensions and givens; return board size."""
    size = len(board)
    if size not in (4, 9) or any(len(row) != size for row in board):
        raise ValueError("A Sudoku board must be a square 4x4 or 9x9 grid.")
    if not is_valid_board(board):
        raise ValueError("The puzzle contains conflicting or out-of-range givens.")
    return size


def is_valid_solution(givens: Board, solution: Board) -> bool:
    """Check that a complete solution is valid and preserves all givens."""
    size = validate_input(givens)
    if len(solution) != size or any(len(row) != size for row in solution):
        return False
    try:
        if not is_valid_board(solution):
            return False
    except ValueError:
        return False
    if any(value == 0 for row in solution for value in row):
        return False
    return all(
        givens[row][column] in (0, solution[row][column])
        for row in range(size)
        for column in range(size)
    )
