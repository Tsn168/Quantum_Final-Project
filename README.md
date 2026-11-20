# QuSud Race – Human vs Classical vs Quantum

> A web game where **three players race to solve the same Sudoku puzzle** — a human, a machine-learning solver, and a quantum algorithm.

**Course:** Quantum Computing
**Group:** Gen10 G2 – Software Engineering
**Team Size:** 5

---

## What is QuSud Race?

QuSud is a browser game about one question: **who solves a Sudoku fastest, and what does it cost them?**

The player picks a difficulty, then watches (and joins) a head-to-head race between three solvers on the same board:

| Player | Who/what it is |
| --- | --- |
| **Human** | You — solving the board manually with the mouse/keyboard |
| **Classical** | A machine-learning solver trained to infer the missing digits |
| **Quantum** | A quantum algorithm running on a simulator (and real hardware where possible) |

When the race ends, the game compares the three runs on **time**, **correctness**, and **how much search space each player had to explore**. The last metric is what makes quantum interesting: Grover's search only needs about √N checks where brute force needs N.

---

## Levels

The game ships with two levels:

| Level | Grid | Colour region | Quantum approach | Quantum claim |
| --- | --- | --- | --- | --- |
| **Easy** | 4×4 | 2×2 boxes | **Grover's Search** on Qiskit Aer | ✅ Real quadratic advantage in oracle calls (**√N** vs N) |
| **Hard** | 9×9 | 3×3 boxes | **Quantum-assisted finish** — classical solver fills most cells, Grover solves the last few (~4–6 empty cells = 12–18 qubits) | ⚠️ Real quantum run, but **no speedup claim** — it finishes a reduced sub-problem |

> **Why this split?** Full 9×9 Sudoku is far beyond any simulator or current hardware (~200+ qubits and √(9⁵⁰) Grover iterations). So at Hard, quantum only runs the small hard sub-problem that remains after the classical solver narrows the board. The README and report must state this explicitly — the honest finding is "quantum wins in *search complexity* at Easy, and only *assists* at Hard."

---

## How a Game Session Works

```
Player picks a level (Easy 4×4 / Hard 9×9)
        ↓
[Taingchay] Backend creates a game session and loads a puzzle
        ↓
Three players start at the same time on the same board
   ├─ [Reach]  Human panel: the interactive grid
   ├─ [Nike]   Classical panel: ML solver runs server-side
   └─ [Somnang] Quantum panel: Grover / quantum-assisted solver runs
        ↓
[Taingchay] Each solver reports: time, checks used, solution
        ↓
[Rayu] Benchmarks the run and computes the search-space comparison
        ↓
[Reach] Results screen: race replay, timer bars, and a why-quantum-wins chart
```

---

## How We Compare the Players

Wall-clock time alone is unfair (a digital solver always beats a human, and a noisy simulator always beats a real quantum device). So each player is scored on three axes:

1. **Time to solve** — how long the player took.
2. **Correctness** — did it produce a valid, unique solution?
3. **Search cost** — number of candidate boards / oracle queries / ML forward passes used. This is the headline quantum metric: Grover explores ~√N candidates where brute force explores N.

The results screen shows all three side by side, so the game is entertaining *and* scientifically honest.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React |
| Backend API | FastAPI (Python) |
| Game Sessions | In-memory store + WebSocket for live race state |
| Classical Player | Python ML solver (constraint-propagation-guided model) |
| Quantum Circuit | Qiskit |
| Quantum Simulation | Qiskit Aer |
| Noisy Simulation | FakeKolkata |
| Error Mitigation | Mitiq |
| Puzzle Bank | Generated offline into a JSON/CSV bank |
| Version Control | GitHub |

---

## Team Roles & Responsibilities

### 👤 Somnang — Quantum Algorithm Engineer
**Primary Owner: Quantum Player Core**

Builds and verifies the quantum solver that plays as the third player.

- [ ] Implement **Grover's Search** on Qiskit for the 4×4 Easy board
- [ ] Encode cells with 2 qubits per cell; build the oracle that checks row/column/box constraints
- [ ] Build the Grover diffusion operator and choose an iteration count
- [ ] Verify the circuit returns the correct unique solution for every Easy puzzle in the bank
- [ ] Build the **Hard (9×9) quantum-assisted finish**: accept the classical solver's partial board, encode the last 4–6 empty cells, run Grover on that reduced sub-problem
- [ ] Return a uniform result object to the backend: `{solution, oracle_calls, qubits, depth, shots}`
- [ ] Document why full 9×9 Grover is infeasible, so the report can cite it
- [ ] **Quantum mentor:** walk every teammate through the circuit once

---

### 👤 Rayu — Quantum Experiments & Benchmarking
**Primary Owner: Comparison Engine + Noise Analysis**

Owns the fairness of the race and the scientific experiments.

- [ ] Build the **benchmark harness**: time, correctness, and search-cost capture for all three players
- [ ] Compute the **search-space comparison** (Grover √N vs classical N candidates) and feed it to the results screen
- [ ] Run **Experiment 1 – Ideal**: Qiskit Aer statevector baseline
- [ ] Run **Experiment 2 – Noisy**: FakeKolkata noise model; record drift in valid-solution probability
- [ ] Run **Experiment 3 – Mitigated**: Mitiq zero-noise extrapolation; record the improvement
- [ ] Produce the **"quantum advantage vs board size"** figure: candidate states vs qubits required for 4×4 → 9×9 → 16×16, with a hardware-limit line — this is the report's headline finding
- [ ] Write the experimental comparison + limitations section of the final report
- [ ] **Quantum practice:** implement one experiment end-to-end and demo how each noise setting changes the result

---

### 👤 Nike — Classical AI Player & Puzzle Generator
**Primary Owner: ML Solver + Puzzle Bank**

Builds the middle player and the puzzles the game is played on.

- [ ] Generate a **puzzle bank** for both levels: many random valid boards, each reduced to a uniquely-solvable puzzle with a difficulty rating
- [ ] Ensure every puzzle has exactly one solution; store givens, solution, and difficulty in a JSON/CSV bank
- [ ] Build the **classical ML solver** that infers missing digits (a trained model, not a plain backtracker)
- [ ] Wrap it with a **constraint checker** so outputs are guaranteed valid Sudoku (ML alone can hallucinate digits)
- [ ] Return the same result object as the other players: `{solution, checks_used, time}`
- [ ] Measure and report the ML solver's **accuracy and time per level**
- [ ] Document honestly that a pure constraint solver would be faster than ML — state this in the report so the comparison is credible
- [ ] **Quantum touch:** confirm the puzzle's encoding matches the qubit layout Somnang's oracle expects

---

### 👤 Taingchay — Backend API Developer
**Primary Owner: FastAPI Backend + Race Orchestration**

Runs the game server that ties the three players together.

- [ ] Build the FastAPI backend
- [ ] Create endpoints:
  - `GET /levels` — list Easy/Hard with metadata
  - `POST /game` — start a session: pick a puzzle, return the initial board
  - `POST /game/{id}/solve` — run the Classical and Quantum players in parallel, return both results
  - `POST /game/{id}/submit` — receive the human's completed board
  - `GET /game/{id}/results` — return the three-way comparison
- [ ] Add **WebSocket** live updates so panels show the racers' progress in real time
- [ ] Implement a **fair race timer**: all three players' clocks start at the same instant
- [ ] Validate inputs (board size, allowed digits, one-solution check)
- [ ] Handle timeouts (e.g., quantum exceeds a cap → mark as "did not finish")
- [ ] Enforce the **quantum scope guard**: reject any request to run full-board Grover on 9×9, and force the Hard level to use the quantum-assisted sub-problem (see Somnang's tasks)

---

### 👤 Reach — Frontend Developer & Project Integrator
**Primary Owner: React Game UI + Integration**

Builds the game the whole class will see.

- [ ] Build the React app with a **level-select screen** (Easy 4×4 / Hard 9×9)
- [ ] Build the **three-panel race view**:
  - Human panel — interactive grid with number entry and conflict highlighting
  - Classical panel — live solver status, checks used, timer
  - Quantum panel — live status, qubit count, oracle calls, a measurement-histogram mini-view
- [ ] Build the **results screen**: per-player timer bars, correctness badges, and the search-cost comparison chart (Grover vs classical)
- [ ] Show the *honest* label per level ("Quantum wins on search cost" at Easy, "Quantum assisted (no speedup claim)" at Hard)
- [ ] Handle a **human win / loss** gracefully — no shame screen, just the comparison
- [ ] Integrate with the backend (Taingchay) over REST + WebSocket
- [ ] Coordinate final integration testing across all modules
- [ ] Manage the GitHub repo, branches, and pull requests
- [ ] **Quantum touch:** render measurement probability histograms for the ideal/noisy/mitigated runs

---

## Quantum Practice — All Members

QuSud is a quantum computing course project, so **every member must touch the quantum part**. Each person keeps their primary role and also owns one slice of the Grover-based solver.

| Member | Primary role | Quantum part they own |
| --- | --- | --- |
| Somnang | Quantum Algorithm Engineer | Grover circuit, oracle, diffusion operator |
| Rayu | Experiments & Benchmarking | Ideal / noisy / mitigated runs, scaling figure |
| Nike | Classical ML + Puzzles | Encode a recognised board into qubit initialization |
| Taingchay | Backend | Execute the circuit from FastAPI, return measurement counts |
| Reach | Frontend & Integrator | Plot measurement probabilities in the UI |

### Shared practice ladder

1. Run the ideal Grover circuit for a fixed 4×4 puzzle and read the solution bitstring.
2. Add the FakeKolkata noise model and compare the valid-solution probability.
3. Apply Mitiq zero-noise extrapolation and record the change.
4. Change one given cell and confirm the oracle rejects invalid boards.
5. Time each run; note qubit count, circuit depth, and shots.

---

## Experiments (secondary to the game)

| Experiment | Setup | Goal |
| --- | --- | --- |
| 1 – Ideal | Qiskit Aer, no noise | Correct baseline |
| 2 – Noisy | FakeKolkata noise model | How noise degrades accuracy |
| 3 – Mitigated | Mitiq on noisy simulation | Whether mitigation helps |
| 4 – Scaling | Candidate states vs qubits, 4×4 → 9×9 → 16×16 | Show where quantum advantage survives hardware limits |

These run on top of the game and produce the report's experimental section; the game itself stays playable without them.

---

## Project Timeline

| Week | Focus | Owner(s) |
| --- | --- | --- |
| Week 1 | Grover solver for 4×4 + oracle | Somnang |
| Week 1 | Repo structure, level-select shell, game sessions | Reach, Taingchay |
| Week 2 | Puzzle bank + Classical ML player | Nike |
| Week 2 | Race API, WebSocket, timers | Taingchay |
| Week 2 | Benchmark harness + ideal/noisy experiments | Rayu |
| Week 3 | 9×9 quantum-assisted finish + mitigation | Somnang, Rayu |
| Week 3 | Three-panel UI + results screen | Reach |
| Week 3 | Quantum practice ladder for all members | All |
| Week 3 | Full integration + testing | All |
| Week 3 | Final report + presentation | All |

---

## Repository Structure

```
QuSud/
├── frontend/                 # React game UI (Reach)
│   └── src/
│       ├── pages/            # LevelSelect, RaceView, Results
│       └── components/       # HumanGrid, SolverPanel, RaceChart
├── backend/                  # FastAPI server (Taingchay)
│   ├── main.py
│   ├── routes/
│   └── game_engine.py        # session state, race timer, orchestration
├── quantum/                  # Quantum player (led by Somnang, Rayu)
│   ├── grover.py             # 4×4 Grover solver
│   ├── assisted.py           # 9×9 quantum-assisted finish
│   ├── encoder.py            # board → qubit initialization
│   └── experiments/
│       ├── ideal.py
│       ├── noisy.py
│       ├── mitigated.py
│       └── scaling.py
├── classical_ml/             # Classical player (Nike)
│   ├── model.py
│   └── constraint_check.py
├── puzzles/                  # Generated puzzle bank (Nike)
│   ├── easy_4x4.json
│   └── hard_9x9.json
├── benchmarks/               # Comparison harness (Rayu)
├── README.md
└── requirements.txt
```

---

## Deliverables

1. **Playable Web Game** — two levels, three racing players, results screen
2. **Quantum Solver** — Grover for 4×4, quantum-assisted finish for 9×9
3. **Classical ML Player** — trained solver with constraint checking
4. **Source Code** — all code on GitHub
5. **Experimental Results** — ideal/noisy/mitigated runs plus the quantum-advantage-vs-size analysis
6. **Final Report & Presentation** — documentation and live demo

---

## Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd QuSud
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Install frontend dependencies
```bash
cd frontend
npm install
```

### 4. Run the backend
```bash
cd backend
uvicorn main:app --reload
```

### 5. Run the frontend
```bash
cd frontend
npm start
```

---

## Authors

| Name | Role |
| --- | --- |
| Somnang | Quantum Algorithm Engineer |
| Rayu | Quantum Experiments & Benchmarking |
| Nike | Classical AI Player & Puzzle Generator |
| Taingchay | Backend API Developer |
| Reach | Frontend Developer & Project Integrator |
