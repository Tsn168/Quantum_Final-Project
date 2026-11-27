"""Game sessions, the fair race timer, and classical/quantum solver orchestration.

Owner: Taingchhay. The API layer (``backend/main.py``) only talks to ``GameEngine``.

Quantum circuits run in a separate process so a slow simulation can be stopped
when it exceeds its time budget; the race then reports ``did_not_finish``
instead of hanging or crashing.
"""

import asyncio
import multiprocessing
import os
import secrets
import sys
import time
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path

from backend.classical_ml import solve as classical_solve
from backend.classical_ml.constraint_check import is_valid_solution
from backend.puzzle_generator import generate_puzzle


QUANTUM_DIR = Path(__file__).resolve().parent.parent / "quantum"

# The level decides the algorithm here, on the server. Clients only send a level
# name when creating a game, so they cannot pick a different solver.
LEVELS = {
    "easy": {"id": "easy", "size": 4, "box": [2, 2], "quantum_algorithm": "grover"},
    "hard": {"id": "hard", "size": 9, "box": [3, 3], "quantum_algorithm": "qaoa"},
}

QUANTUM_TIMEOUT_S = {
    "easy": float(os.getenv("QUSUD_GROVER_TIMEOUT", "60")),
    "hard": float(os.getenv("QUSUD_QAOA_TIMEOUT", "120")),
}

# Grover's cost grows as sqrt(4^blanks); generated Easy boards have 6-9 blanks,
# which is too large for the simulator. Cells beyond this limit are pre-filled
# by the classical solver (the same hybrid idea QAOA uses on Hard) and the
# result reports exactly which cells Grover searched.
GROVER_MAX_BLANKS = int(os.getenv("QUSUD_GROVER_MAX_BLANKS", "3"))

HISTOGRAM_BARS = 16
MAX_SESSIONS = 500
RECENT_BOARDS = 200


# ── Measurement parsing ──────────────────────────────────────────────────────

def _quantum_import_path() -> None:
    # The quantum modules import each other as top-level modules (``from encoder import``).
    if str(QUANTUM_DIR) not in sys.path:
        sys.path.insert(0, str(QUANTUM_DIR))


def empty_cells(board: list[list[int]]) -> list[tuple[int, int]]:
    return [(r, c) for r, row in enumerate(board) for c, value in enumerate(row) if value == 0]


def most_frequent_bitstring(counts: dict[str, int]) -> str:
    """The measured bitstring with the most shots (ties go to the smaller string)."""
    if not counts:
        raise ValueError("No measurement counts to parse.")
    return max(sorted(counts), key=lambda bits: counts[bits])


def parse_grover_counts(
    counts: dict[str, int], searched_cells: list[tuple[int, int]]
) -> tuple[list[list[int]], dict[str, int]]:
    """Turn raw 32-bit Grover counts into a 4x4 board and a readable histogram.

    The board comes from the most frequent bitstring, decoded with the shared
    encoder. The histogram keeps only the searched cells, written in reading
    order with each digit d as the 2-bit binary of d-1 (1→00 … 4→11), merges
    shots that agree on those cells, and keeps the top ``HISTOGRAM_BARS`` bars.
    """
    _quantum_import_path()
    from encoder import decode_bitstring

    solution = decode_bitstring(most_frequent_bitstring(counts))

    histogram: dict[str, int] = {}
    for bits, shots in counts.items():
        board = decode_bitstring(bits)
        label = "".join(format(board[r][c] - 1, "02b") for r, c in searched_cells)
        histogram[label] = histogram.get(label, 0) + shots
    top = sorted(histogram.items(), key=lambda item: (-item[1], item[0]))[:HISTOGRAM_BARS]
    return solution, dict(top)


# ── Quantum worker (runs in a child process) ─────────────────────────────────

def _grover_subproblem(board: list[list[int]]) -> tuple[list[list[int]], list[tuple[int, int]]]:
    """Leave at most GROVER_MAX_BLANKS cells empty; fill the rest classically."""
    blanks = empty_cells(board)
    if len(blanks) <= GROVER_MAX_BLANKS:
        return board, []
    filled = classical_solve(board)["solution"]
    sub_board = [row[:] for row in board]
    prefilled = blanks[GROVER_MAX_BLANKS:]
    for r, c in prefilled:
        sub_board[r][c] = filled[r][c]
    return sub_board, prefilled


def _run_grover(board: list[list[int]]) -> dict:
    _quantum_import_path()
    import grover

    sub_board, prefilled = _grover_subproblem(board)
    raw = grover.run(sub_board)
    raw["searched_cells"] = empty_cells(sub_board)
    raw["prefilled_cells"] = prefilled
    return raw


def _run_qaoa(board: list[list[int]]) -> dict:
    _quantum_import_path()
    import qaoa

    return qaoa.run(board)


QUANTUM_RUNNERS = {"grover": _run_grover, "qaoa": _run_qaoa}


def _quantum_worker(algorithm: str, board: list[list[int]], conn) -> None:
    try:
        conn.send(("ok", QUANTUM_RUNNERS[algorithm](board)))
    except BaseException as error:  # report anything, including import errors
        conn.send(("error", f"{type(error).__name__}: {error}"))
    finally:
        conn.close()


def run_quantum_process(algorithm: str, board: list[list[int]], timeout_s: float) -> tuple[str, object]:
    """Run one quantum solver in a child process.

    Returns ``("ok", raw_result)``, ``("timeout", None)`` or ``("error", message)``.
    On timeout the child is terminated so it stops using the CPU.
    """
    context = multiprocessing.get_context("spawn")
    receiver, sender = context.Pipe(duplex=False)
    process = context.Process(target=_quantum_worker, args=(algorithm, board, sender), daemon=True)
    process.start()
    sender.close()
    try:
        if not receiver.poll(timeout_s):
            return "timeout", None
        return receiver.recv()
    except EOFError:
        return "error", f"quantum process exited with code {process.exitcode}"
    finally:
        receiver.close()
        if process.is_alive():
            process.terminate()
        process.join(5)


# ── SolverResult builders ────────────────────────────────────────────────────

def did_not_finish(player: str, algorithm: str, reason: str, time_ms: float, metric: str) -> dict:
    return {
        "player": player,
        "algorithm": algorithm,
        "status": "did_not_finish",
        "reason": reason,
        "solution": None,
        "correct": False,
        "time_ms": time_ms,
        "search_cost": {"metric": metric, "value": 0},
        "quantum": None,
    }


def classical_result(raw: dict, givens, answer, time_ms: float) -> dict:
    return {
        "player": "classical",
        "algorithm": "ml",
        "status": "done",
        "reason": None,
        "solution": raw["solution"],
        "correct": raw["solution"] == answer and is_valid_solution(givens, raw["solution"]),
        "time_ms": time_ms,
        "search_cost": {"metric": "checks", "value": raw["checks_used"]},
        "quantum": None,
    }


def grover_result(raw: dict, givens, answer, time_ms: float) -> dict:
    solution, histogram = parse_grover_counts(raw["measurement_counts"], raw["searched_cells"])
    return {
        "player": "quantum",
        "algorithm": "grover",
        "status": "done",
        "reason": None,
        "solution": solution,
        "correct": solution == answer and is_valid_solution(givens, solution),
        "time_ms": time_ms,
        "search_cost": {"metric": "oracle_calls", "value": raw["oracle_calls"]},
        "quantum": {
            "mode": "ideal",
            "qubits": raw["qubits"],
            "circuit_depth": raw["circuit_depth"],
            "shots": raw["shots"],
            "measurement_counts": histogram,
            "cost_history": None,
            "approximation_ratio": None,
            "searched_cells": [list(cell) for cell in raw["searched_cells"]],
            "prefilled_cells": [list(cell) for cell in raw["prefilled_cells"]],
        },
    }


def qaoa_result(raw: dict, givens, answer, time_ms: float) -> dict:
    # qaoa.py is still being written; accept either its planned raw keys or a
    # contract-shaped SolverResult so the backend does not need changes later.
    quantum = raw.get("quantum") or {}
    solution = raw["solution"]
    evaluations = raw.get("circuit_evaluations", raw.get("search_cost", {}).get("value", 0))
    return {
        "player": "quantum",
        "algorithm": "qaoa",
        "status": "done",
        "reason": None,
        "solution": solution,
        "correct": solution == answer and is_valid_solution(givens, solution),
        "time_ms": time_ms,
        "search_cost": {"metric": "circuit_evaluations", "value": evaluations},
        "quantum": {
            "mode": quantum.get("mode", raw.get("mode", "ideal")),
            "qubits": raw.get("qubits", quantum.get("qubits")),
            "circuit_depth": raw.get("circuit_depth", quantum.get("circuit_depth")),
            "shots": raw.get("shots", quantum.get("shots")),
            "measurement_counts": None,
            "cost_history": raw.get("cost_history", quantum.get("cost_history")),
            "approximation_ratio": raw.get("approximation_ratio", quantum.get("approximation_ratio")),
        },
    }


QUANTUM_RESULT_BUILDERS = {"grover": grover_result, "qaoa": qaoa_result}
QUANTUM_METRICS = {"grover": "oracle_calls", "qaoa": "circuit_evaluations"}


# ── Sessions ─────────────────────────────────────────────────────────────────

@dataclass
class Session:
    game_id: str
    level: str
    givens: list[list[int]]
    solution: list[list[int]]
    race_started_at: float | None = None
    solve_task: asyncio.Task | None = None
    classical: dict | None = None
    quantum: dict | None = None
    human: dict | None = None
    subscribers: set[asyncio.Queue] = field(default_factory=set)

    def elapsed_ms(self) -> float:
        return round((time.perf_counter() - self.race_started_at) * 1000, 1)


class GameEngine:
    def __init__(self) -> None:
        self.sessions: dict[str, Session] = {}
        self.recent_boards = {level: deque(maxlen=RECENT_BOARDS) for level in LEVELS}

    def levels(self) -> list[dict]:
        return list(LEVELS.values())

    def create_game(self, level: str) -> dict:
        """Generate a fresh puzzle for a new session; never reuse a recent board."""
        level = level.lower() if isinstance(level, str) else level
        if level not in LEVELS:
            raise ValueError("level must be either 'easy' or 'hard'.")
        for _ in range(20):
            puzzle = generate_puzzle(level)
            key = tuple(map(tuple, puzzle["givens"]))
            if key not in self.recent_boards[level]:
                break
        self.recent_boards[level].append(key)

        game_id = secrets.token_hex(6)
        self.sessions[game_id] = Session(game_id, level, puzzle["givens"], puzzle["solution"])
        while len(self.sessions) > MAX_SESSIONS:
            self.sessions.pop(next(iter(self.sessions)))

        info = LEVELS[level]
        return {
            "game_id": game_id,
            "level": level,
            "size": info["size"],
            "box": info["box"],
            "board": [row[:] for row in puzzle["givens"]],
        }

    def get(self, game_id: str) -> Session:
        session = self.sessions.get(game_id)
        if session is None:
            raise KeyError(game_id)
        return session

    # ── Race ──

    async def solve(self, game_id: str) -> dict:
        """Start the race once and return both solver results.

        Repeated calls (e.g. React StrictMode running effects twice) join the
        same race instead of starting a second one.
        """
        session = self.get(game_id)
        if session.solve_task is None:
            session.solve_task = asyncio.create_task(self._race(session))
        return await asyncio.shield(session.solve_task)

    async def _race(self, session: Session) -> dict:
        # One clock for all three players: the human's timer in the browser
        # also starts when it sends this request.
        session.race_started_at = time.perf_counter()
        self._publish(session, {"event": "race_started", "level": session.level})
        classical, quantum = await asyncio.gather(
            self._run_classical(session), self._run_quantum(session)
        )
        return {"classical": classical, "quantum": quantum}

    async def _run_classical(self, session: Session) -> dict:
        self._publish(session, {"player": "classical", "status": "running"})
        try:
            raw = await asyncio.to_thread(classical_solve, session.givens)
            result = classical_result(raw, session.givens, session.solution, session.elapsed_ms())
        except Exception as error:
            result = did_not_finish("classical", "ml", f"error: {error}", session.elapsed_ms(), "checks")
        session.classical = result
        self._publish_finished(session, result)
        return result

    async def _run_quantum(self, session: Session) -> dict:
        algorithm = LEVELS[session.level]["quantum_algorithm"]
        metric = QUANTUM_METRICS[algorithm]
        self._publish(session, {"player": "quantum", "status": "running", "algorithm": algorithm})

        if not (QUANTUM_DIR / f"{algorithm}.py").exists():
            status, payload = "error", f"quantum/{algorithm}.py is not implemented yet"
        else:
            status, payload = await asyncio.to_thread(
                run_quantum_process, algorithm, session.givens, QUANTUM_TIMEOUT_S[session.level]
            )
        elapsed = session.elapsed_ms()

        if status == "ok":
            try:
                result = QUANTUM_RESULT_BUILDERS[algorithm](payload, session.givens, session.solution, elapsed)
            except Exception as error:
                result = did_not_finish("quantum", algorithm, f"error: bad result ({error})", elapsed, metric)
        elif status == "timeout":
            result = did_not_finish("quantum", algorithm, "timeout", elapsed, metric)
        else:
            result = did_not_finish("quantum", algorithm, f"error: {payload}", elapsed, metric)

        session.quantum = result
        self._publish_finished(session, result)
        return result

    def submit(self, game_id: str, board: list[list[int]], client_time_ms: float | None) -> dict:
        """Check the human's board. Time is measured on the server's race clock."""
        session = self.get(game_id)
        size = LEVELS[session.level]["size"]
        if len(board) != size or any(len(row) != size for row in board):
            raise ValueError(f"board must be {size}x{size}.")

        if session.race_started_at is not None:
            time_ms = session.elapsed_ms()
        elif client_time_ms is not None:
            time_ms = client_time_ms
        else:
            raise ValueError("The race has not started yet.")

        correct = board == session.solution and is_valid_solution(session.givens, board)
        session.human = {"correct": correct, "time_ms": time_ms}
        self._publish(session, {"player": "human", "status": "done", "correct": correct, "time_ms": time_ms})
        return session.human

    def results(self, game_id: str) -> dict:
        session = self.get(game_id)
        return {
            "game_id": session.game_id,
            "level": session.level,
            "human": session.human,
            "classical": session.classical,
            "quantum": session.quantum,
        }

    # ── Live updates (WebSocket) ──

    def snapshot(self, game_id: str) -> list[dict]:
        """Current state of every player, sent when a WebSocket connects."""
        session = self.get(game_id)
        running = session.race_started_at is not None
        events = []
        for player in ("classical", "quantum"):
            result = getattr(session, player)
            if result is not None:
                events.append(self._finished_event(session, result))
            else:
                events.append({"player": player, "status": "running" if running else "waiting"})
        if session.human is not None:
            events.append({"player": "human", "status": "done", **session.human})
        return events

    def subscribe(self, game_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self.get(game_id).subscribers.add(queue)
        return queue

    def unsubscribe(self, game_id: str, queue: asyncio.Queue) -> None:
        session = self.sessions.get(game_id)
        if session is not None:
            session.subscribers.discard(queue)

    def _finished_event(self, session: Session, result: dict) -> dict:
        return {
            "player": result["player"],
            "status": result["status"],
            "reason": result["reason"],
            "time_ms": result["time_ms"],
            "search_cost": result["search_cost"],
        }

    def _publish_finished(self, session: Session, result: dict) -> None:
        self._publish(session, self._finished_event(session, result))

    def _publish(self, session: Session, event: dict) -> None:
        if session.race_started_at is not None:
            event.setdefault("elapsed_ms", session.elapsed_ms())
        for queue in session.subscribers:
            queue.put_nowait(event)
