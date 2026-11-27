"""Validation helpers for 4x4 and 9x9 Sudoku boards."""

from collections.abc import Sequence


Board = Sequence[Sequence[int]]


def _board_size(board: Board) -> int:
    size = len(board)
    if size not in (4, 9) or any(len(row) != size for row in board):
        raise ValueError("A Sudoku board must be a square 4x4 or 9x9 grid.")
    if any(
        not isinstance(value, int) or isinstance(value, bool) or value < 0 or value > size
        for row in board
        for value in row
    ):
        raise ValueError(f"Cell values must be integers from 0 to {size}.")
    return size


def is_valid_board(board: Board) -> bool:
    """Return whether a partial or complete board has no Sudoku conflicts."""
    size = _board_size(board)
    box_size = int(size**0.5)

    for row in board:
        values = [value for value in row if value]
        if len(values) != len(set(values)):
            return False

    for column in range(size):
        values = [board[row][column] for row in range(size) if board[row][column]]
        if len(values) != len(set(values)):
            return False

    for box_row in range(0, size, box_size):
        for box_column in range(0, size, box_size):
            values = [
                board[row][column]
                for row in range(box_row, box_row + box_size)
                for column in range(box_column, box_column + box_size)
                if board[row][column]
            ]
            if len(values) != len(set(values)):
                return False
    return True


def count_solutions(board: Board, limit: int = 2) -> int:
    """Count solutions, stopping once ``limit`` is reached."""
    if limit < 1:
        raise ValueError("limit must be at least 1.")
    size = _board_size(board)
    if not is_valid_board(board):
        return 0

    working = [list(row) for row in board]
    box_size = int(size**0.5)
    digits = set(range(1, size + 1))

    def candidates(row: int, column: int) -> set[int]:
        used = set(working[row])
        used.update(working[index][column] for index in range(size))
        box_row = row // box_size * box_size
        box_column = column // box_size * box_size
        used.update(
            working[r][c]
            for r in range(box_row, box_row + box_size)
            for c in range(box_column, box_column + box_size)
        )
        used.discard(0)
        return digits - used

    def search(found: int) -> int:
        if found >= limit:
            return found

        best_cell = None
        best_options = None
        for row in range(size):
            for column in range(size):
                if working[row][column] != 0:
                    continue
                options = candidates(row, column)
                if not options:
                    return found
                if best_options is None or len(options) < len(best_options):
                    best_cell = (row, column)
                    best_options = options
                    if len(options) == 1:
                        break
            if best_options is not None and len(best_options) == 1:
                break

        if best_cell is None:
            return found + 1

        row, column = best_cell
        for value in best_options or ():
            working[row][column] = value
            found = search(found)
            working[row][column] = 0
            if found >= limit:
                break
        return found

    return search(0)


def validate_puzzle(givens: Board, solution: Board | None = None) -> bool:
    """Check that givens have exactly one completion and optionally match it."""
    if count_solutions(givens, limit=2) != 1:
        return False
    if solution is None:
        return True

    size = _board_size(givens)
    if _board_size(solution) != size or not is_valid_board(solution):
        return False
    if any(
        givens[row][column] not in (0, solution[row][column])
        for row in range(size)
        for column in range(size)
    ):
        return False
    if any(value == 0 for row in solution for value in row):
        return False
    return True
