"""ML-guided constraint solver for 4x4 and 9x9 Sudoku."""

from collections.abc import Sequence
from time import perf_counter

from .constraint_check import is_valid_solution, validate_input
from .model import MODEL


Board = Sequence[Sequence[int]]


def solve(board: Board) -> dict[str, object]:
    """Solve a Sudoku puzzle and report the solution, checks, and elapsed seconds."""
    size = validate_input(board)
    box_size = int(size**0.5)
    working = [list(row) for row in board]
    digits = set(range(1, size + 1))
    checks_used = 0

    def peers(row: int, column: int) -> set[tuple[int, int]]:
        result = {
            (row, other_column)
            for other_column in range(size)
            if other_column != column
        }
        result.update(
            (other_row, column)
            for other_row in range(size)
            if other_row != row
        )
        box_row = row // box_size * box_size
        box_column = column // box_size * box_size
        result.update(
            (other_row, other_column)
            for other_row in range(box_row, box_row + box_size)
            for other_column in range(box_column, box_column + box_size)
            if (other_row, other_column) != (row, column)
        )
        return result

    peer_map = {
        (row, column): peers(row, column)
        for row in range(size)
        for column in range(size)
    }

    def options_for(row: int, column: int) -> set[int]:
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

    def search() -> bool:
        nonlocal checks_used
        choices: list[tuple[float, tuple[int, int], set[int]]] = []

        for row in range(size):
            for column in range(size):
                if working[row][column] != 0:
                    continue
                options = options_for(row, column)
                if not options:
                    return False

                active_peers = [
                    peer for peer in peer_map[(row, column)] if working[peer[0]][peer[1]] == 0
                ]
                forced_peers = sum(
                    1 for peer in active_peers
                    if len(options_for(peer[0], peer[1])) == 1
                )
                features = (
                    len(options) / size,
                    len(active_peers) / max(1, size * 2),
                    forced_peers / max(1, size),
                )
                choices.append((MODEL.predict(features), (row, column), options))

        if not choices:
            return True

        _, (row, column), options = max(choices, key=lambda choice: choice[0])
        # Least-constraining values reduce immediate pressure on neighboring cells.
        ordered_values = sorted(
            options,
            key=lambda value: sum(
                value in options_for(peer[0], peer[1])
                for peer in peer_map[(row, column)]
                if working[peer[0]][peer[1]] == 0
            ),
        )
        for value in ordered_values:
            checks_used += 1
            working[row][column] = value
            if search():
                return True
            working[row][column] = 0
        return False

    started = perf_counter()
    solved = search()
    elapsed = perf_counter() - started
    if not solved or not is_valid_solution(board, working):
        raise ValueError("The puzzle has no valid solution.")
    return {
        "solution": working,
        "checks_used": checks_used,
        "time": elapsed,
    }
