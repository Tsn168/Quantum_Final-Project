# QuSud – Quantum Sudoku Solver

> Solving 4×4 Sudoku puzzles using Grover's Search Algorithm with quantum noise analysis and error mitigation.

**Course:** Quantum Computing  
**Group:** Gen10 G2 – Software Engineering  
**Team Size:** 5

---

## What is QuSud?

QuSud is a web application that uses quantum computing to solve 4×4 Sudoku puzzles.

Users upload a photo of a Sudoku puzzle. The application reads the puzzle using image recognition, converts it into a quantum search problem, and uses **Grover's Search Algorithm** to find the valid solution.

The project also runs three experiments to investigate how quantum noise affects accuracy and whether error mitigation can improve the results.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend API | FastAPI (Python) |
| Image Processing | OpenCV |
| Quantum Circuit | Qiskit |
| Quantum Simulation | Qiskit Aer |
| Noisy Simulation | FakeKolkata |
| Error Mitigation | Mitiq |
| Version Control | GitHub |

---

## Team Roles & Responsibilities

### 👤 Somnang — Quantum Algorithm Engineer
**Primary Owner: Quantum Solver Core**

Responsible for the most critical part of the project — building and testing the quantum circuit that solves the Sudoku puzzle.

- Implement Grover's Search Algorithm using Qiskit
- Encode 4×4 Sudoku cells as qubits (2 qubits per cell)
- Build the quantum oracle that checks Sudoku constraints (row, column, 2×2 box)
- Build the Grover diffusion operator
- Test and verify the quantum solver produces correct solutions
- Document how the quantum circuit works

---

### 👤 Rayu — Quantum Experiments & Error Mitigation
**Primary Owner: Noise Analysis & Mitiq**

Responsible for running the three quantum experiments and comparing the results.

- Run Experiment 1: Ideal quantum simulation (Qiskit Aer statevector)
- Run Experiment 2: Noisy quantum simulation using FakeKolkata
- Run Experiment 3: Apply Mitiq for quantum error mitigation
- Record and compare results across all three experiments
- Analyze the probability of measuring valid solutions
- Write the experimental comparison section of the final report
- Work closely with Somnang to use the quantum solver as the base

---

### 👤 Nike — Image Processing Engineer
**Primary Owner: OpenCV Sudoku Reader**

Responsible for reading and extracting Sudoku puzzles from uploaded photos.

- Use OpenCV to detect the Sudoku grid from an image
- Extract individual cells and recognize printed numbers
- Handle image preprocessing (grayscale, thresholding, contour detection)
- Output a structured 4×4 grid with given numbers and empty cells marked
- Allow users to manually correct any misrecognized numbers
- Connect the parsed puzzle output to the backend API

---

### 👤 Taingchay — Backend API Developer
**Primary Owner: FastAPI Backend**

Responsible for the backend server that connects all components together.

- Build the FastAPI backend server
- Create API endpoints:
  - `POST /upload` — receive Sudoku image from the frontend
  - `POST /solve` — send puzzle to the quantum solver and return the solution
  - `GET /results` — return experiment comparison results
- Connect the image processing module (Nike) to the quantum solver (Somnang)
- Handle errors and validate inputs
- Test all API endpoints

---

### 👤 Reach — Frontend Developer & Project Integrator
**Primary Owner: React Frontend + Final Integration**

Responsible for the user interface and making sure all parts of the project work together.

- Build the React web application
- Implement the Sudoku image upload page
- Display the recognized puzzle grid for user review
- Display the solved Sudoku result
- Display the three experiment comparison (charts or tables)
- Integrate the frontend with the backend API (Taingchay)
- Coordinate final integration testing across all modules
- Manage the GitHub repository structure and pull requests

---

## How the Application Works

```
User uploads Sudoku photo
        ↓
[Nike] OpenCV reads and parses the grid
        ↓
[Taingchay] FastAPI backend receives the parsed puzzle
        ↓
[Somnang] Grover's Algorithm solves the puzzle
        ↓
[Rayu] Runs ideal / noisy / mitigated experiments
        ↓
[Reach] React frontend displays the solution and results
```

---

## Three Experiments

| Experiment | Setup | Goal |
|---|---|---|
| 1 – Ideal | Qiskit Aer, no noise | Establish a correct baseline |
| 2 – Noisy | FakeKolkata noise model | Measure how noise degrades accuracy |
| 3 – Mitigated | Mitiq on noisy simulation | Test if error mitigation helps |

---

## Project Timeline

| Week | Focus | Owner(s) |
|---|---|---|
| Week 1 | Quantum solver core + oracle | Somnang |
| Week 1 | Project setup + repo structure | Reach |
| Week 2 | Image recognition with OpenCV | Nike |
| Week 2 | Dynamic solver input + backend API | Taingchay |
| Week 2 | Noise experiments begin | Rayu |
| Week 3 | Error mitigation + experiment analysis | Rayu |
| Week 3 | Frontend UI | Reach |
| Week 3 | Full integration + testing | All |
| Week 3 | Final report + presentation | All |

---

## Repository Structure

```
QuSud/
├── frontend/               # React web application (Reach)
│   └── src/
├── backend/                # FastAPI backend server (Taingchay)
│   ├── main.py
│   └── routes/
├── quantum/                # Quantum solver and experiments (Somnang, Rayu)
│   ├── grover.py
│   ├── oracle.py
│   ├── experiments/
│   │   ├── ideal.py
│   │   ├── noisy.py
│   │   └── mitigated.py
├── image_processing/       # OpenCV Sudoku reader (Nike)
│   └── sudoku_reader.py
├── README.md
└── requirements.txt
```

---

## Deliverables

1. **Web Application** — Upload a Sudoku image and view the solution
2. **Quantum Solver** — Grover-based Sudoku search implementation
3. **Source Code** — All code available on GitHub
4. **Experimental Results** — Comparison of ideal, noisy, and mitigated simulations
5. **Final Report & Presentation** — Documentation and demo

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
|---|---|
| Somnang | Quantum Algorithm Engineer |
| Rayu | Quantum Experiments & Error Mitigation |
| Nike | Image Processing Engineer |
| Taingchay | Backend API Developer |
| Reach | Frontend Developer & Project Integrator |
