import sys
import unittest
from unittest import mock

from fastapi.testclient import TestClient

from backend import game_engine
from backend.main import app, engine

sys.path.insert(0, str(game_engine.QUANTUM_DIR))
from encoder import VALUE_TO_BITS, cell_qubits  # noqa: E402


def encode_full_board(board):
    """A 32-bit Qiskit bitstring (qubit 0 rightmost) for a complete 4x4 board."""
    bits = ["0"] * 32
    for r in range(4):
        for c in range(4):
            low_q, high_q = cell_qubits(r, c)
            low_bit, high_bit = VALUE_TO_BITS[board[r][c]]
            bits[low_q], bits[high_q] = str(low_bit), str(high_bit)
    return "".join(reversed(bits))


def fake_grover(algorithm, board, timeout_s):
    """Stands in for the Qiskit run: the answer dominates, one wrong board is noise."""
    session = next(s for s in engine.sessions.values() if s.givens == board)
    answer = session.solution
    wrong = [row[:] for row in answer]
    r, c = game_engine.empty_cells(board)[0]
    wrong[r][c] = wrong[r][c] % 4 + 1
    return "ok", {
        "measurement_counts": {encode_full_board(answer): 900, encode_full_board(wrong): 124},
        "oracle_calls": 6,
        "qubits": 70,
        "circuit_depth": 1234,
        "shots": 1024,
        "searched_cells": game_engine.empty_cells(board)[:3],
        "prefilled_cells": game_engine.empty_cells(board)[3:],
    }


class GameApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def new_game(self, level="easy"):
        response = self.client.post("/game", json={"level": level})
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_levels_route_easy_to_grover_and_hard_to_qaoa(self):
        levels = {level["id"]: level for level in self.client.get("/levels").json()}
        self.assertEqual(levels["easy"]["quantum_algorithm"], "grover")
        self.assertEqual(levels["hard"]["quantum_algorithm"], "qaoa")
        self.assertEqual(levels["hard"]["size"], 9)

    def test_new_game_is_fresh_and_hides_the_answer(self):
        game = self.new_game()
        self.assertEqual(set(game), {"game_id", "level", "size", "box", "board"})
        self.assertEqual(game["box"], [2, 2])
        self.assertIn(0, sum(game["board"], []))
        boards = {str(self.new_game()["board"]) for _ in range(10)}
        self.assertEqual(len(boards), 10)

    def test_unknown_level_and_game_are_rejected(self):
        self.assertEqual(self.client.post("/game", json={"level": "medium"}).status_code, 422)
        self.assertEqual(self.client.post("/game/nope/solve").status_code, 404)
        self.assertEqual(self.client.get("/game/nope/results").status_code, 404)

    def test_easy_race_returns_parsed_grover_result(self):
        game = self.new_game("easy")
        with mock.patch.object(game_engine, "run_quantum_process", fake_grover):
            race = self.client.post(f"/game/{game['game_id']}/solve").json()

        classical, quantum = race["classical"], race["quantum"]
        self.assertEqual((classical["status"], classical["correct"]), ("done", True))
        self.assertEqual(classical["search_cost"]["metric"], "checks")
        self.assertIsNone(classical["quantum"])

        self.assertEqual((quantum["algorithm"], quantum["status"], quantum["correct"]), ("grover", "done", True))
        self.assertEqual(quantum["search_cost"], {"metric": "oracle_calls", "value": 6})
        counts = quantum["quantum"]["measurement_counts"]
        self.assertEqual(sum(counts.values()), 1024)
        self.assertTrue(all(len(bits) == 6 for bits in counts))
        self.assertEqual(quantum["quantum"]["qubits"], 70)

    def test_quantum_timeout_does_not_crash_the_race(self):
        game = self.new_game("easy")
        with mock.patch.object(game_engine, "run_quantum_process", return_value=("timeout", None)):
            race = self.client.post(f"/game/{game['game_id']}/solve").json()
        self.assertEqual(race["quantum"]["status"], "did_not_finish")
        self.assertEqual(race["quantum"]["reason"], "timeout")
        self.assertIsNone(race["quantum"]["solution"])
        self.assertEqual(race["classical"]["status"], "done")

    def test_hard_race_reports_missing_qaoa_without_crashing(self):
        game = self.new_game("hard")
        with mock.patch.object(game_engine, "QUANTUM_DIR", game_engine.QUANTUM_DIR / "missing"):
            race = self.client.post(f"/game/{game['game_id']}/solve").json()
        self.assertEqual(race["quantum"]["algorithm"], "qaoa")
        self.assertEqual(race["quantum"]["status"], "did_not_finish")
        self.assertTrue(race["classical"]["correct"])

    def test_solving_twice_joins_the_same_race(self):
        game = self.new_game("easy")
        with mock.patch.object(game_engine, "run_quantum_process", return_value=("timeout", None)) as run:
            first = self.client.post(f"/game/{game['game_id']}/solve").json()
            second = self.client.post(f"/game/{game['game_id']}/solve").json()
        self.assertEqual(first, second)
        self.assertEqual(run.call_count, 1)

    def test_submit_and_results(self):
        game = self.new_game("easy")
        game_id = game["game_id"]
        with mock.patch.object(game_engine, "run_quantum_process", return_value=("timeout", None)):
            self.client.post(f"/game/{game_id}/solve")

        answer = engine.get(game_id).solution
        reply = self.client.post(f"/game/{game_id}/submit", json={"board": answer, "time_ms": 5}).json()
        self.assertTrue(reply["correct"])
        self.assertGreaterEqual(reply["time_ms"], 0)

        wrong = [row[:] for row in answer]
        wrong[0][0], wrong[0][1] = wrong[0][1], wrong[0][0]
        self.assertFalse(self.client.post(f"/game/{game_id}/submit", json={"board": wrong}).json()["correct"])
        self.assertEqual(self.client.post(f"/game/{game_id}/submit", json={"board": [[1]]}).status_code, 422)

        results = self.client.get(f"/game/{game_id}/results").json()
        self.assertEqual(set(results), {"game_id", "level", "human", "classical", "quantum"})
        self.assertFalse(results["human"]["correct"])
        self.assertEqual(results["quantum"]["reason"], "timeout")

    def test_websocket_sends_snapshot_of_finished_race(self):
        game = self.new_game("easy")
        with mock.patch.object(game_engine, "run_quantum_process", return_value=("timeout", None)):
            self.client.post(f"/game/{game['game_id']}/solve")
        with self.client.websocket_connect(f"/ws/{game['game_id']}") as ws:
            events = {event["player"]: event for event in (ws.receive_json(), ws.receive_json())}
        self.assertEqual(events["classical"]["status"], "done")
        self.assertEqual(events["quantum"]["reason"], "timeout")


class MeasurementParsingTests(unittest.TestCase):
    def test_most_frequent_bitstring_becomes_the_board(self):
        answer = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
        noise = [[2, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
        counts = {encode_full_board(noise): 10, encode_full_board(answer): 50}
        solution, histogram = game_engine.parse_grover_counts(counts, [(0, 0), (3, 3)])
        self.assertEqual(solution, answer)
        # cell (0,0)=1 → "00", cell (3,3)=1 → "00"; the noisy board has (0,0)=2 → "01"
        self.assertEqual(histogram, {"0000": 50, "0100": 10})

    def test_timeout_terminates_the_child_process(self):
        status, payload = game_engine.run_quantum_process("grover", [[0] * 4] * 4, timeout_s=0.01)
        self.assertEqual((status, payload), ("timeout", None))


if __name__ == "__main__":
    unittest.main()
