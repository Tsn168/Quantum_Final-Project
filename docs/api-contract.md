# QuSud Race — API Contract

This is the agreement between the **frontend** (Reach), the **backend** (Taingchay),
the **quantum solvers** (Somnang, Rayu), and the **classical player + puzzle generator** (Nike).

If you need to change a field, change it here first and tell the team, then change the code.
The frontend already runs against a mock that returns exactly these shapes
(`frontend/src/api/mock.js`), so you can compare your output with it.

---

## Conventions

- Base URL: `http://localhost:8000`
- All bodies are JSON.
- A board is a list of rows: `board[row][col]`. **`0` means an empty cell.**
- Levels: `"easy"` = 4×4 (2×2 boxes), `"hard"` = 9×9 (3×3 boxes).
- Times are in **milliseconds** (`time_ms`).
- The frontend only talks to the backend. Quantum, classical and generator code are
  Python modules the backend calls (see "Python module interfaces" below).

---

## 1. `GET /levels`

List the levels the game offers.

```json
[
  { "id": "easy", "size": 4, "box": [2, 2], "quantum_algorithm": "grover" },
  { "id": "hard", "size": 9, "box": [3, 3], "quantum_algorithm": "qaoa" }
]
```

## 2. `POST /game`

Start a new session. The backend calls the puzzle generator — a fresh puzzle every time.

Request:
```json
{ "level": "easy" }
```

Response:
```json
{
  "game_id": "a1b2c3",
  "level": "easy",
  "size": 4,
  "box": [2, 2],
  "board": [[1,0,0,4],[0,4,1,0],[0,1,4,0],[4,0,0,1]]
}
```

The solution is **never** sent to the frontend.

## 3. `POST /game/{game_id}/solve`

Run the classical and quantum players on the session's puzzle and return both results.

Response:
```json
{
  "classical": { ...SolverResult },
  "quantum":   { ...SolverResult }
}
```

## 4. `POST /game/{game_id}/submit`

The human's finished board.

Request:
```json
{ "board": [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]], "time_ms": 41250 }
```

Response:
```json
{ "correct": true, "time_ms": 41250 }
```

## 5. `GET /game/{game_id}/results`

Everything the results screen needs.

```json
{
  "game_id": "a1b2c3",
  "level": "easy",
  "human":     { "correct": true, "time_ms": 41250 },
  "classical": { ...SolverResult },
  "quantum":   { ...SolverResult }
}
```

## 6. `WS /ws/{game_id}` (later, optional)

Live progress for the race panels. Not needed for the first version.

```json
{ "player": "quantum", "status": "running", "step": 7, "total_steps": 12 }
```

---

## SolverResult

Used for both the classical and the quantum player.

```json
{
  "player": "quantum",
  "algorithm": "grover",
  "status": "done",
  "reason": null,
  "solution": [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],
  "correct": true,
  "time_ms": 850,
  "search_cost": { "metric": "oracle_calls", "value": 12 },
  "quantum": {
    "mode": "ideal",
    "qubits": 8,
    "circuit_depth": 340,
    "shots": 1024,
    "measurement_counts": { "01100011": 812, "00011011": 31 },
    "cost_history": null,
    "approximation_ratio": null
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `player` | `"classical"` \| `"quantum"` | |
| `algorithm` | `"brute_force"` \| `"backtracking"` \| `"ml"` \| `"grover"` \| `"qaoa"` | Which method actually ran |
| `status` | `"done"` \| `"did_not_finish"` | |
| `reason` | string \| null | e.g. `"timeout"` when `did_not_finish` |
| `solution` | board \| null | null when `did_not_finish` |
| `correct` | bool | Backend checks it against the generator's solution |
| `time_ms` | number | Real wall-clock time, shown honestly (quantum is simulated) |
| `search_cost.metric` | `"checks"` \| `"oracle_calls"` \| `"circuit_evaluations"` | The headline comparison |
| `search_cost.value` | int | How many rule checks / oracle calls / circuit runs were needed |
| `quantum` | object \| null | **null for the classical player** |
| `quantum.mode` | `"ideal"` \| `"noisy"` \| `"mitigated"` | Labels the charts |
| `quantum.measurement_counts` | `{bitstring: count}` \| null | Grover histogram (easy) |
| `quantum.cost_history` | number[] \| null | QAOA cost per optimizer iteration (hard) |
| `quantum.approximation_ratio` | number \| null | QAOA only |

**Why `search_cost` is the headline:** the game compares how many searches each player
needs (classical brute force ~N vs Grover ~√N). Real time is also shown, but a simulated
quantum circuit is slower in seconds — we say so on the results screen.

---

## Python module interfaces

What the backend expects to import. Each function returns plain dicts/lists (JSON-ready).

```python
# puzzle_generator/generator.py   (Nike)
def generate_puzzle(level: str) -> dict:
    """Returns {"board": [[...]], "solution": [[...]], "size": int, "box": [r, c]}.
    Board uses 0 for empty cells and has exactly one solution."""

# classical_ml/solver.py          (Nike)
def solve(board: list[list[int]], box: tuple[int, int]) -> dict:
    """Returns a SolverResult with player="classical" and quantum=None."""

# quantum/grover.py               (Somnang)
def run(board: list[list[int]], box: tuple[int, int], mode: str = "ideal") -> dict:
    """Easy level. Returns a SolverResult with algorithm="grover",
    search_cost.metric="oracle_calls" and quantum.measurement_counts filled."""

# quantum/qaoa.py                 (Somnang + Rayu)
def run(board: list[list[int]], box: tuple[int, int], mode: str = "ideal") -> dict:
    """Hard level. Returns a SolverResult with algorithm="qaoa",
    search_cost.metric="circuit_evaluations" and quantum.cost_history filled."""
```

The backend fills `time_ms` and `correct` if a solver leaves them out.
