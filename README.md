# QuSud Race – Human vs Classical vs Quantum

> A browser game where **three players race to solve the same Sudoku puzzle** — a human, an ML solver, and a quantum algorithm.

**Course:** Quantum Computing  
**Group:** Gen10 G2 – Software Engineering  
**Team Size:** 5

---

## What is QuSud Race?

QuSud Race is a browser game built around one question: **who solves a Sudoku fastest, and what does it cost them?**

The user picks a difficulty level and a fresh puzzle is generated automatically. A live three-way race then begins on the same board:

| Player | Who / what it is |
| --- | --- |
| **Human** | You — solving the board manually with the mouse or keyboard |
| **Classical** | A machine-learning solver that infers the missing digits server-side |
| **Quantum** | A quantum algorithm (Grover's Search at Easy, QAOA at Hard) on a Qiskit simulator |

When every player finishes, the results screen compares all three on **time**, **correctness**, and **search/optimization cost** — the number of oracle queries or circuit evaluations each solver needed. That last metric is where quantum stands out.

> **There is no image upload.** The user only selects a difficulty level. The backend generates a unique puzzle for every session automatically.

---

## Quantum Algorithms

The project uses **two distinct quantum paradigms**, one per level, to show what quantum computing can do on a combinatorial problem.

### 🔵 Easy (4 × 4) — Grover's Search

Grover's algorithm is a **quantum search** technique. It finds the correct answer in ~√N steps instead of N — a provable quadratic speedup over brute-force search.

- Each cell is encoded as **2 qubits** (values 1–4 → 2-bit binary)
- The oracle checks all row, column, and box constraints simultaneously in superposition
- After ~√N Grover iterations, the correct board is amplified to a high measurement probability
- **Qubit count:** ~32 qubits (16 cells × 2) — feasible on Qiskit Aer
- **Claim:** ✅ Real quadratic advantage in oracle calls (√N vs N)

### 🔴 Hard (9 × 9) — QAOA (Quantum Approximate Optimization Algorithm)

QAOA is a **quantum optimization** technique. It encodes the puzzle as a combinatorial optimization problem, builds a cost Hamiltonian that penalizes constraint violations, and uses a parameterized quantum circuit to find the minimum-cost solution.

- The classical ML solver fills most of the board first
- QAOA takes the remaining **8–12 empty cells** as its sub-problem
- A COBYLA variational optimizer tunes the circuit angles to minimize violations
- **Qubit count:** ~20–30 qubits for the sub-problem — feasible on Qiskit Aer
- **Claim:** ⚠️ Genuine quantum optimization, but no classical speedup claim at this circuit depth

> **Why two algorithms?** Grover (search) and QAOA (optimization) are fundamentally different quantum strategies. Showing both makes the project stronger academically and demonstrates two real quantum paradigms.

> **Why not full-board Grover for 9 × 9?** Full 9 × 9 Grover needs ~290 qubits and √(9⁸¹) iterations — far beyond any simulator or current hardware. QAOA on the reduced sub-problem is the honest, runnable alternative.

---

## Levels

| Level | Grid | Quantum Algorithm | Paradigm | Claim |
| --- | --- | --- | --- | --- |
| **Easy** | 4 × 4 | Grover's Search | Quantum Search | ✅ Quadratic speedup in oracle calls |
| **Hard** | 9 × 9 | QAOA on sub-problem | Quantum Optimization | ⚠️ Genuine quantum optimization, no classical speedup |

---

## How a Game Session Works

```
1. User opens the game and selects Easy (4×4) or Hard (9×9)
        ↓
2. Backend generates a fresh random puzzle for this session
   (unique every time — no two games are the same)
        ↓
3. All three players start simultaneously on the same board:
   ├─ Human panel    — user solves it manually
   ├─ Classical panel — ML solver runs on the server
   └─ Quantum panel   — Grover (Easy) or QAOA (Hard) runs on the server
        ↓
4. Each player finishes → panel shows ✅ COMPLETE with time + stats
        ↓
5. Results screen: timer bars, correctness badges,
   and a search/optimization cost comparison chart
```

---

## How We Compare the Players

Each player is scored on three axes:

1. **Time to solve** — how long from start to finish.
2. **Correctness** — did it produce a valid, complete, unique solution?
3. **Search / optimization cost** — oracle queries (Grover), circuit evaluations (QAOA), or ML forward passes. This is the headline quantum metric.

All three appear side by side on the results screen, keeping the game both entertaining and scientifically honest.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React |
| Backend API | FastAPI (Python) |
| Real-time Race | WebSocket |
| Puzzle Generation | On-demand procedural generator (Python) |
| Classical Player | Python ML solver (constraint-propagation-guided model) |
| Quantum Circuit | Qiskit |
| Quantum Simulation | Qiskit Aer |
| QAOA Optimizer | COBYLA (via Qiskit) |
| Noisy Simulation | FakeKolkata |
| Error Mitigation | Mitiq |
| Version Control | GitHub |

---

## Team Roles & Responsibilities

Each member owns one primary module **and** one quantum coding task — everyone touches both the technical build and the quantum science.

---

### 👤 Somnang — Quantum Algorithm Engineer
**Primary:** Grover's Search (Easy) + QAOA ansatz & optimizer (Hard)  
**Quantum task:** Build both circuit cores — Grover oracle and QAOA ansatz

**Grover — Easy 4 × 4**
- [ ] Implement Grover's Search on Qiskit (`quantum/grover.py`)
- [ ] Build the oracle enforcing row, column, and box constraints in superposition
- [ ] Build the Grover diffusion operator; set the correct iteration count (~√N)
- [ ] Verify the circuit finds the correct solution across random Easy puzzles
- [ ] Return: `{ solution, oracle_calls, qubits, circuit_depth, shots }`

**QAOA — Hard 9 × 9 (ansatz + optimizer)**
- [ ] Build the QAOA ansatz circuit (`quantum/qaoa.py`) — parameterized Rz/Rx layers, start at depth p = 1
- [ ] Run COBYLA to minimize the cost function; tune to p = 2 if needed
- [ ] Decode the lowest-cost bitstring back into Sudoku digit assignments
- [ ] Return: `{ solution, circuit_evaluations, qubits, circuit_depth, approximation_ratio }`
- [ ] Document clearly why full-board Grover is infeasible for 9 × 9
- [ ] Walk every teammate through both circuits at least once

---

### 👤 Rayu — Quantum Experiments & Benchmarking
**Primary:** Benchmark harness + noise experiments  
**Quantum task:** Build the QAOA cost Hamiltonian and run all noise experiments

**QAOA — Hard 9 × 9 (Hamiltonian)**
- [ ] Formulate the sub-problem as a cost Hamiltonian penalizing constraint violations (`quantum/qaoa.py` — shared with Somnang)
- [ ] Verify the Hamiltonian scores valid boards lower than invalid ones before Somnang plugs in the ansatz

**Benchmarking & Experiments**
- [ ] Build the benchmark harness: capture time, correctness, and search/optimization cost for all three players (`benchmarks/`)
- [ ] Compute the Grover search-cost comparison (√N vs N) and format it for the results screen
- [ ] Compute the QAOA approximation ratio vs classical solver for Hard results
- [ ] Run **Experiment 1 – Ideal**: Qiskit Aer statevector, no noise — baseline for both algorithms
- [ ] Run **Experiment 2 – Noisy**: FakeKolkata — record degradation in solution quality
- [ ] Run **Experiment 3 – Mitigated**: Mitiq zero-noise extrapolation — measure recovery
- [ ] Produce the **scaling figure**: oracle calls / QAOA evaluations vs problem size (4×4 → 9×9 → 16×16) with hardware-limit line

---

### 👤 Nike — Classical AI Player & Puzzle Generator
**Primary:** ML solver + on-demand puzzle generator  
**Quantum task:** Build the board-to-qubit encoder that both Grover and QAOA depend on

**Quantum encoder**
- [ ] Implement `quantum/encoder.py`: convert a puzzle's empty cells into the 2-qubit-per-cell initialization format Grover's oracle expects
- [ ] Extend the encoder to produce the variable list the QAOA Hamiltonian uses for Hard puzzles
- [ ] Verify the encoding round-trips correctly: encode → decode gives back the original board

**Classical player & puzzle generator**
- [ ] Build the on-demand puzzle generator (`puzzle_generator/generator.py`): given a difficulty, procedurally produce a valid, uniquely-solvable board — fresh every session
- [ ] Confirm every generated puzzle has exactly one solution (`puzzle_generator/validator.py`)
- [ ] Expose `generate_puzzle(difficulty) → { givens, solution }` as the interface the backend calls
- [ ] Build the classical ML solver (`classical_ml/model.py`) — a trained model, not a plain backtracker
- [ ] Wrap it with a constraint checker (`classical_ml/constraint_check.py`) so outputs are always valid Sudoku
- [ ] Return: `{ solution, checks_used, time }`

---

### 👤 Taingchay — Backend API Developer
**Primary:** FastAPI backend + race orchestration  
**Quantum task:** Wire Qiskit circuit execution inside FastAPI and parse quantum measurement results

**Quantum integration**
- [ ] In `backend/game_engine.py`, call `grover.run()` and `qaoa.run()` as async tasks and collect their result objects
- [ ] Parse raw Qiskit measurement counts: extract the most-frequent bitstring, convert to digit assignments, attach qubit and depth metadata
- [ ] Handle quantum timeouts: return `{ status: "did_not_finish", reason: "timeout" }` without crashing the race

**Backend API**
- [ ] Build the FastAPI server with these endpoints:
  - `GET /levels` — list Easy / Hard with grid size and quantum algorithm used
  - `POST /game` — call the puzzle generator, create a session, return the fresh board
  - `POST /game/{id}/solve` — run Classical and Quantum solvers in parallel, return results
  - `POST /game/{id}/submit` — receive and validate the human's completed board
  - `GET /game/{id}/results` — return the three-way comparison data
- [ ] Add WebSocket live updates so panels show real-time solver progress
- [ ] Implement the fair race timer: all three clocks start at the same instant
- [ ] Route Hard → QAOA and Easy → Grover at the API layer; enforce it so it cannot be bypassed
- [ ] Ensure `POST /game` always calls the puzzle generator fresh — never reuse a previous session's board

---

### 👤 Reach — Frontend Developer & Project Integrator
**Primary:** React game UI + full integration  
**Quantum task:** Build the quantum visualizations — Grover measurement histogram and QAOA cost landscape

**Quantum visualizations**
- [ ] Render a **Grover measurement histogram** in the Quantum panel: bar chart of bitstring → probability (Easy sessions)
- [ ] Render a **QAOA cost landscape** in the Quantum panel: line chart of cost value per optimizer iteration (Hard sessions)
- [ ] Label each chart correctly — "ideal", "noisy", or "mitigated"

**Game UI**
- [ ] Build the **level-select screen** (Easy 4×4 / Hard 9×9) — the first and only screen before the race
- [ ] Show a **"Generating puzzle…"** spinner while the backend builds the fresh board
- [ ] Build the three-panel race view:
  - Human panel — interactive grid, number entry, conflict highlighting
  - Classical panel — solver status, checks used, running timer
  - Quantum panel — qubit count, oracle calls (Grover) or circuit evaluations (QAOA), plus visualizations
- [ ] Show **✅ COMPLETE** on each panel the moment that player finishes
- [ ] Build the results screen: timer bars, correctness badges, search/optimization cost chart
- [ ] Show the correct quantum label per level:
  - Easy → *"Grover's Search — quadratic speedup in oracle calls (√N vs N)"*
  - Hard → *"QAOA — quantum optimization on the sub-problem"*
- [ ] Integrate with the backend over REST + WebSocket (coordinate with Taingchay)
- [ ] Run final integration testing across all five modules
- [ ] Manage the GitHub repo: branch strategy, pull requests, merge conflicts

---

## Task Balance Summary

| Member | Primary module | Quantum task | Tasks |
| --- | --- | --- | --- |
| Somnang | Grover circuit + QAOA ansatz & optimizer | Grover oracle + QAOA ansatz layers | 9 |
| Rayu | Benchmark harness + experiments | QAOA cost Hamiltonian + all noise experiments | 9 |
| Nike | ML solver + puzzle generator | Board-to-qubit encoder (`encoder.py`) | 9 |
| Taingchay | FastAPI backend + race orchestration | Qiskit wiring in FastAPI + parse measurement counts | 9 |
| Reach | React UI + integration | Grover histogram + QAOA cost landscape charts | 10 |

---

## Quantum Practice — All Members

Every member completes this shared ladder independently before the project is submitted.

| Step | Task |
| --- | --- |
| 1 | Run the ideal Grover circuit for a fixed 4×4 puzzle; read and interpret the solution bitstring |
| 2 | Run the QAOA circuit for a 4-cell sub-problem; read the lowest-cost bitstring |
| 3 | Add FakeKolkata noise to both circuits; compare solution quality before and after |
| 4 | Apply Mitiq zero-noise extrapolation; record how much quality is recovered |
| 5 | Change one given cell to an invalid value; confirm both circuits reject the board |
| 6 | Record qubit count, circuit depth, and shots / evaluations for each run |

---

## Experiments

| Experiment | Setup | Covers | Goal |
| --- | --- | --- | --- |
| 1 – Ideal | Qiskit Aer, no noise | Grover + QAOA | Establish correct baselines for both algorithms |
| 2 – Noisy | FakeKolkata noise model | Grover + QAOA | Measure how noise degrades each algorithm |
| 3 – Mitigated | Mitiq zero-noise extrapolation | Grover + QAOA | Measure how much mitigation recovers |
| 4 – Scaling | Oracle calls / QAOA evals vs problem size | Both | Show where quantum advantage survives hardware limits |

---

## Project Timeline

| Week | Focus | Owner(s) |
| --- | --- | --- |
| Week 1 | Grover oracle + circuit for 4×4 | Somnang |
| Week 1 | Board-to-qubit encoder | Nike |
| Week 1 | Repo structure + level-select UI shell | Reach, Taingchay |
| Week 2 | QAOA cost Hamiltonian | Rayu |
| Week 2 | QAOA ansatz + optimizer | Somnang |
| Week 2 | Puzzle generator + ML solver | Nike |
| Week 2 | Race API, WebSocket, timers, Qiskit wiring | Taingchay |
| Week 2 | Benchmark harness + Grover ideal/noisy experiments | Rayu |
| Week 3 | QAOA experiments + scaling figure | Rayu |
| Week 3 | Three-panel race UI + quantum visualizations | Reach |
| Week 3 | Results screen | Reach |
| Week 3 | Quantum practice ladder — all members | All |
| Week 3 | Full integration testing | All |
| Week 3 | Final report + presentation | All |

---

## Repository Structure

```
QuSud/
├── frontend/                   # React game UI (Reach)
│   └── src/
│       ├── pages/              # LevelSelect, RaceView, Results
│       └── components/         # HumanGrid, SolverPanel, GroverChart, QAOAChart, RaceChart
├── backend/                    # FastAPI server (Taingchay)
│   ├── main.py
│   ├── routes/
│   └── game_engine.py          # session state, race timer, Qiskit wiring, orchestration
├── quantum/                    # Quantum algorithms (Somnang + Rayu + Nike)
│   ├── grover.py               # Grover solver — Easy 4×4           (Somnang)
│   ├── qaoa.py                 # QAOA solver — Hard 9×9 sub-problem  (Somnang + Rayu)
│   ├── encoder.py              # board → qubit / Hamiltonian encoding (Nike)
│   └── experiments/            # Noise experiments                   (Rayu)
│       ├── ideal.py
│       ├── noisy.py
│       ├── mitigated.py
│       └── scaling.py
├── classical_ml/               # Classical player (Nike)
│   ├── model.py
│   └── constraint_check.py
├── puzzle_generator/           # On-demand puzzle generation (Nike)
│   ├── generator.py            # generate_puzzle(difficulty) → { givens, solution }
│   └── validator.py            # confirm unique solution
├── benchmarks/                 # Comparison harness (Rayu)
├── README.md
└── requirements.txt
```

---

## Deliverables

1. **Playable Web Game** — two levels, three racing players, complete results screen, fresh puzzle every session
2. **Quantum Solver** — Grover's Search for 4×4, QAOA for 9×9 sub-problem
3. **Classical ML Player** — trained solver with constraint checking
4. **On-Demand Puzzle Generator** — unique valid puzzle produced per session
5. **Source Code** — full codebase on GitHub
6. **Experimental Results** — ideal / noisy / mitigated runs for both algorithms, plus the scaling analysis
7. **Final Report & Presentation** — documentation and live demo

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
