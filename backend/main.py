"""HTTP API entry point for the QuSud Race backend."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.puzzle_generator import generate_puzzle


class GameRequest(BaseModel):
    level: str


app = FastAPI(title="QuSud Race API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.post("/game")
def create_game(request: GameRequest) -> dict[str, list[list[int]]]:
    """Generate a fresh board without exposing its answer to the browser."""
    try:
        puzzle = generate_puzzle(request.level)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return {"board": puzzle["givens"]}
