"""HTTP API entry point for the QuSud Race backend.

Endpoints follow docs/api-contract.md. Game logic lives in backend/game_engine.py.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.game_engine import GameEngine


class GameRequest(BaseModel):
    level: str


class SubmitRequest(BaseModel):
    board: list[list[int]]
    time_ms: float | None = None


app = FastAPI(title="QuSud Race API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
engine = GameEngine()


def _session_or_404(game_id: str) -> None:
    try:
        engine.get(game_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Unknown game: {game_id}") from error


@app.get("/levels")
def list_levels() -> list[dict]:
    """Easy / Hard with grid size and the quantum algorithm each one uses."""
    return engine.levels()


@app.post("/game")
def create_game(request: GameRequest) -> dict:
    """Generate a fresh board without exposing its answer to the browser."""
    try:
        return engine.create_game(request.level)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/game/{game_id}/solve")
async def solve_game(game_id: str) -> dict:
    """Start the race: classical and quantum solvers run in parallel."""
    _session_or_404(game_id)
    return await engine.solve(game_id)


@app.post("/game/{game_id}/submit")
def submit_human(game_id: str, request: SubmitRequest) -> dict:
    """Check the human player's finished board."""
    _session_or_404(game_id)
    try:
        return engine.submit(game_id, request.board, request.time_ms)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.get("/game/{game_id}/results")
def get_results(game_id: str) -> dict:
    """The three-way comparison for the results screen."""
    _session_or_404(game_id)
    return engine.results(game_id)


@app.websocket("/ws/{game_id}")
async def race_updates(websocket: WebSocket, game_id: str) -> None:
    """Push live race progress: the current state first, then each change."""
    await websocket.accept()
    try:
        queue = engine.subscribe(game_id)
    except KeyError:
        await websocket.close(code=4404, reason="Unknown game")
        return
    try:
        for event in engine.snapshot(game_id):
            await websocket.send_json(event)
        while True:
            await websocket.send_json(await queue.get())
    except WebSocketDisconnect:
        pass
    finally:
        engine.unsubscribe(game_id, queue)
