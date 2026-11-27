"""Randomized, uniquely-solvable Sudoku puzzle generation."""

import random

from .validator import count_solutions


def _make_solution(size: int, rng: random.Random) -> list[list[int]]:
    box_size = int(size**0.5)
    digits = list(range(1, size + 1))
    rng.shuffle(digits)

    bands = list(range(box_size))
    rng.shuffle(bands)
    rows = [
        band * box_size + row
        for band in bands
        for row in rng.sample(range(box_size), box_size)
    ]

    stacks = list(range(box_size))
    rng.shuffle(stacks)
    columns = [
        stack * box_size + column
        for stack in stacks
        for column in rng.sample(range(box_size), box_size)
    ]
    return [
        [
            digits[
                (box_size * (row % box_size) + row // box_size + column) % size
            ]
            for column in columns
        ]
        for row in rows
    ]


def generate_puzzle(difficulty: str) -> dict[str, list[list[int]]]:
    """Generate a fresh puzzle; ``difficulty`` is ``easy`` (4x4) or ``hard`` (9x9)."""
    # Hard keeps 24-28 clues so the player starts from fewer numbers; easy stays
    # at 7-10 because the Grover circuit is sized for that many blanks.
    levels = {"easy": (4, (7, 10)), "hard": (9, (24, 28))}
    if not isinstance(difficulty, str) or difficulty.lower() not in levels:
        raise ValueError("difficulty must be either 'easy' or 'hard'.")

    size, clue_range = levels[difficulty.lower()]
    rng = random.SystemRandom()
    solution = _make_solution(size, rng)
    givens = [row[:] for row in solution]
    cells = [(row, column) for row in range(size) for column in range(size)]
    rng.shuffle(cells)
    target_clues = rng.randint(*clue_range)
    clues = size * size

    for row, column in cells:
        if clues <= target_clues:
            break
        original = givens[row][column]
        givens[row][column] = 0
        if count_solutions(givens, limit=2) == 1:
            clues -= 1
        else:
            givens[row][column] = original

    return {"givens": givens, "solution": solution}
