# verify_random.py
# Owner: Somnang
#
# Randomized verification for the Easy-level Grover solver.
#
# Generates fresh valid 4×4 Sudoku grids, blanks a few cells to create a
# puzzle, runs Grover's Search, and checks that the measured board is a
# valid, complete solution consistent with the given cells.
#
# Only 1–2 blanks are used: N = 4^blanks must stay small enough for the
# statevector/MPS simulator. See the scaling note in README.md.

import random
import sys

from grover import run, is_valid_solution
from encoder import encode_board


def random_solution():
    """Random valid 4×4 Sudoku grid via randomized backtracking."""
    grid = [[0] * 4 for _ in range(4)]

    def ok(r, c, v):
        if any(grid[r][cc] == v for cc in range(4)):
            return False
        if any(grid[rr][c] == v for rr in range(4)):
            return False
        br, bc = (r // 2) * 2, (c // 2) * 2
        for dr in range(2):
            for dc in range(2):
                if grid[br + dr][bc + dc] == v:
                    return False
        return True

    def solve(idx=0):
        if idx == 16:
            return True
        r, c = divmod(idx, 4)
        vals = list(range(1, 5))
        random.shuffle(vals)
        for v in vals:
            if ok(r, c, v):
                grid[r][c] = v
                if solve(idx + 1):
                    return True
                grid[r][c] = 0
        return False

    solve()
    return grid


def make_puzzle(solution, n_blank):
    """Blank n_blank random cells from a full solution."""
    board = [row[:] for row in solution]
    cells = [(r, c) for r in range(4) for c in range(4)]
    for r, c in random.sample(cells, n_blank):
        board[r][c] = 0
    return board


def consistent_with_givens(solved, givens):
    for r in range(4):
        for c in range(4):
            if givens[r][c] != 0 and solved[r][c] != givens[r][c]:
                return False
    return True


def main(n_trials=3, n_blank=2, shots=2048):
    print("=" * 62)
    print(f"Randomized Grover verification — {n_trials} fresh puzzles, "
          f"{n_blank} blanks (N=4^{n_blank}={4**n_blank})")
    print("=" * 62)

    passed = 0
    for trial in range(1, n_trials + 1):
        solution = random_solution()
        puzzle   = make_puzzle(solution, n_blank)

        result  = run(puzzle, shots=shots)
        counts  = result['measurement_counts']
        total   = sum(counts.values())
        top_pct = max(counts.values()) / total * 100

        valid  = is_valid_solution(result['solution'])
        match  = consistent_with_givens(result['solution'], puzzle)
        ok     = valid and match
        passed += ok

        print(f"\nTrial {trial}: puzzle empties = "
              f"{[ (r, c) for r in range(4) for c in range(4) if puzzle[r][c] == 0 ]}")
        for row in puzzle:
            print("  ", row)
        print(f"  qubits={result['qubits']}  depth={result['circuit_depth']}  "
              f"oracle_calls={result['oracle_calls']}  top={top_pct:.1f}%")
        print(f"  valid={valid}  matches givens={match}  {'✅' if ok else '❌'}")

    print("\n" + "=" * 62)
    print(f"RESULT: {passed}/{n_trials} random puzzles solved "
          f"{'✅ ALL PASSED' if passed == n_trials else '❌ FAILURES'}")
    print("=" * 62)
    return passed == n_trials


if __name__ == '__main__':
    trials = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    blanks = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    sys.exit(0 if main(trials, blanks) else 1)
