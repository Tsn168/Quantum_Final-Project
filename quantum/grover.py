# grover.py
# Owner: Somnang — Quantum Algorithm Engineer
#
# Grover's Search for 4x4 Sudoku (Easy level).
#
# Strategy:
#   1. Initialize given cells to their fixed values using X gates.
#   2. Put all empty cells into equal superposition using H gates.
#   3. Run Grover iterations (oracle + diffusion) ~√N times,
#      where N = 4^(number of empty cells).
#   4. Measure — the correct solution bitstring appears with highest probability.
#
# Qubit layout: 32 data + (k+4) ancilla + 1 phase qubits,
# where k = number of active constraint pairs (pairs touching an empty cell).
# See encoder.py for the full encoding scheme.

import math
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit_aer import AerSimulator
from encoder import encode_board, decode_bitstring, cell_qubits

NUM_CELLS    = 16
QUBITS_CELL  = 2
TOTAL_QUBITS = NUM_CELLS * QUBITS_CELL   # 32


# ── Cell index helpers ────────────────────────────────────────────────────────

def row_cells(row):
    return [cell_qubits(row, col) for col in range(4)]

def col_cells(col):
    return [cell_qubits(row, col) for row in range(4)]

def box_cells(box_row, box_col):
    r0, c0 = box_row * 2, box_col * 2
    return [cell_qubits(r0 + dr, c0 + dc) for dr in range(2) for dc in range(2)]

def all_constraint_pairs():
    pairs = []
    for r in range(4):
        cells = row_cells(r)
        for i in range(len(cells)):
            for j in range(i + 1, len(cells)):
                pairs.append((cells[i], cells[j]))
    for c in range(4):
        cells = col_cells(c)
        for i in range(len(cells)):
            for j in range(i + 1, len(cells)):
                pairs.append((cells[i], cells[j]))
    for br in range(2):
        for bc in range(2):
            cells = box_cells(br, bc)
            for i in range(len(cells)):
                for j in range(i + 1, len(cells)):
                    pairs.append((cells[i], cells[j]))
    return pairs


def active_constraint_pairs(empty_cells):
    """
    Only pairs where at least one cell is EMPTY can be violated by a
    superposition state. Given–given pairs are constant and, since the
    puzzle is valid, always satisfy the constraint → skip them.

    Returns deduplicated (cell_a_qubits, cell_b_qubits) tuples.
    """
    empty   = set(empty_cells)
    seen    = set()
    pairs   = []

    def add_group(cells):
        for i in range(len(cells)):
            for j in range(i + 1, len(cells)):
                a, b = cells[i], cells[j]
                if a not in empty and b not in empty:
                    continue
                key = (a, b) if a < b else (b, a)
                if key in seen:
                    continue
                seen.add(key)
                pairs.append((cell_qubits(*a), cell_qubits(*b)))

    for r in range(4):
        add_group([(r, c) for c in range(4)])
    for c in range(4):
        add_group([(r, c) for r in range(4)])
    for br in range(2):
        for bc in range(2):
            add_group([(br * 2 + dr, bc * 2 + dc) for dr in range(2) for dc in range(2)])

    return pairs


def or_gate(qc, a, b, t):
    """
    t <- a OR b, leaving a and b untouched. Self-inverse: applying it
    again restores t to 0 (as long as a, b are unchanged), which makes it
    safe for both computing and uncomputing the violation accumulator.

    t must start at 0. Uses XOR identity: a|b = a ^ b ^ (a&b).
    """
    qc.ccx(a, b, t)
    qc.cx(a, t)
    qc.cx(b, t)


# ── add_neq_check ─────────────────────────────────────────────────────────────

def add_neq_check(qc, cell_a, cell_b, anc):
    """
    Set anc[2] = 1 if cell_a == cell_b (constraint VIOLATION).

    Uses anc[0] and anc[1] as temporary scratch bits.
    All scratch bits are uncomputed at the end.

    cell_a = (low_qubit, high_qubit)
    cell_b = (low_qubit, high_qubit)
    anc    = [scratch0, scratch1, result]
    """
    la, ha = cell_a
    lb, hb = cell_b
    s0, s1, res = anc[0], anc[1], anc[2]

    # s0 = XNOR(la, lb)  →  1 if low bits equal
    qc.cx(la, s0)
    qc.cx(lb, s0)
    qc.x(s0)

    # s1 = XNOR(ha, hb)  →  1 if high bits equal
    qc.cx(ha, s1)
    qc.cx(hb, s1)
    qc.x(s1)

    # res = s0 AND s1  →  1 if both bit pairs equal (full cell equality)
    qc.ccx(s0, s1, res)

    # Uncompute s1
    qc.x(s1)
    qc.cx(hb, s1)
    qc.cx(ha, s1)

    # Uncompute s0
    qc.x(s0)
    qc.cx(lb, s0)
    qc.cx(la, s0)


# ── Oracle ────────────────────────────────────────────────────────────────────

def build_oracle(qc, data_qubits, ancilla_qubits, phase_qubit, empty_cells=None):
    """
    Phase-kickback oracle for 4×4 Sudoku.

    Marks every VALID board with a -1 phase. A board is valid when none of
    the constraint pairs (row, column, box) contains two equal cells.

    Reversible OR chain:
      acc[0] = 0
      acc[i] = acc[i-1] OR violation_i        (via or_gate, self-inverse)
    acc[k] = 1 iff at least one constraint is violated. The phase kickback
    fires when acc[k] == 0 (valid), so we X around the CX.

    ancilla layout (k = number of active pairs):
        [0]     = s0 scratch
        [1]     = s1 scratch
        [2]     = violation flag from add_neq_check
        [3 .. 3+k] = acc[0..k] running-OR chain (all start at 0)

    Every ancilla is returned to |0> — the oracle is a pure phase gate on
    the data register.

    `empty_cells`: list of (row,col) positions that are in superposition.
    If None, every pair is checked (used for testing a fully-given board).
    """
    if empty_cells is None:
        pairs = all_constraint_pairs()
    else:
        pairs = active_constraint_pairs(empty_cells)

    s0, s1, res = ancilla_qubits[0], ancilla_qubits[1], ancilla_qubits[2]
    chain       = list(ancilla_qubits[3:3 + len(pairs) + 1])
    scratch     = [s0, s1, res]

    # ── Forward: build the running-OR chain ──────────────────────────
    for i, (cell_a, cell_b) in enumerate(pairs, start=1):
        add_neq_check(qc, cell_a, cell_b, scratch)   # res = 1 iff cells equal
        or_gate(qc, chain[i - 1], res, chain[i])     # chain[i] = chain[i-1] OR res
        add_neq_check(qc, cell_a, cell_b, scratch)   # uncompute res

    any_viol = chain[len(pairs)]

    # any_viol = 1 → invalid board ; 0 → valid board
    qc.x(any_viol)                 # flip: 1 = valid
    qc.cx(any_viol, phase_qubit)   # phase kickback for valid boards
    qc.x(any_viol)

    # ── Uncompute: clear the chain and all scratches ────────────────
    for i in range(len(pairs), 0, -1):
        cell_a, cell_b = pairs[i - 1]
        add_neq_check(qc, cell_a, cell_b, scratch)   # recompute res
        or_gate(qc, chain[i - 1], res, chain[i])     # self-inverse → clears chain[i]
        add_neq_check(qc, cell_a, cell_b, scratch)   # uncompute res


# ── Diffusion Operator ────────────────────────────────────────────────────────

def build_diffusion(qc, empty_qubits):
    """
    Grover diffusion (inversion about the mean) over the empty cell qubits.
    """
    n = len(empty_qubits)

    qc.h(empty_qubits)
    qc.x(empty_qubits)

    if n == 1:
        qc.z(empty_qubits[0])
    elif n == 2:
        qc.cz(empty_qubits[0], empty_qubits[1])
    else:
        target   = empty_qubits[-1]
        controls = empty_qubits[:-1]
        qc.h(target)
        qc.mcx(controls, target)
        qc.h(target)

    qc.x(empty_qubits)
    qc.h(empty_qubits)


# ── Full Circuit ──────────────────────────────────────────────────────────────

def build_grover_circuit(board, num_iterations=None):
    """
    Build the full Grover circuit for a 4x4 Sudoku board.

    Returns:
        qc            — the QuantumCircuit
        empty_qubits  — list of qubit objects in the search space
    """
    givens, empty_cells = encode_board(board)

    num_empty = len(empty_cells)
    N = 4 ** num_empty
    if num_iterations is None:
        num_iterations = max(1, round((math.pi / 4) * math.sqrt(N)))

    print(f"Empty cells: {num_empty}  |  N={N}  |  iterations={num_iterations}")

    n_pairs = len(active_constraint_pairs(empty_cells))
    n_anc   = 3 + n_pairs + 1          # 3 scratch + (k+1) OR-chain qubits

    data  = QuantumRegister(TOTAL_QUBITS, 'data')
    anc   = QuantumRegister(n_anc,        'anc')
    phase = QuantumRegister(1,            'phase')
    meas  = ClassicalRegister(TOTAL_QUBITS, 'meas')

    qc = QuantumCircuit(data, anc, phase, meas)

    # Set given cells
    for qubit_idx, bit_val in givens:
        if bit_val == 1:
            qc.x(data[qubit_idx])

    # Superposition over empty cells
    empty_qubits = []
    for (row, col) in empty_cells:
        lq, hq = cell_qubits(row, col)
        qc.h(data[lq])
        qc.h(data[hq])
        empty_qubits.extend([data[lq], data[hq]])

    # Phase qubit → |->
    qc.x(phase[0])
    qc.h(phase[0])

    # Grover iterations
    for _ in range(num_iterations):
        build_oracle(qc, data, anc, phase[0], empty_cells)
        build_diffusion(qc, empty_qubits)

    qc.measure(data, meas)
    return qc, empty_qubits


# ── Run ───────────────────────────────────────────────────────────────────────

def run(board, shots=2048):
    """
    Run the Grover circuit on Qiskit Aer (MPS method) and return results.
    """
    qc, _ = build_grover_circuit(board)

    simulator = AerSimulator(method='matrix_product_state')
    qc_t      = transpile(qc, simulator)
    job       = simulator.run(qc_t, shots=shots)
    counts    = job.result().get_counts()

    best_bitstring = max(counts, key=counts.get)
    solution       = decode_bitstring(best_bitstring)

    _, empty_cells = encode_board(board)
    N          = 4 ** len(empty_cells)
    iterations = max(1, round((math.pi / 4) * math.sqrt(N)))
    n_pairs    = len(active_constraint_pairs(empty_cells))

    return {
        'solution':           solution,
        'oracle_calls':       iterations,               # Grover queries (≈√N)
        'constraint_checks':  iterations * n_pairs,
        'qubits':             qc.num_qubits,
        'circuit_depth':      qc.depth(),
        'shots':              shots,
        'measurement_counts': counts,
    }


# ── Validation ────────────────────────────────────────────────────────────────

def is_valid_solution(board):
    expected = {1, 2, 3, 4}
    for r in range(4):
        if set(board[r]) != expected:
            return False
    for c in range(4):
        if {board[r][c] for r in range(4)} != expected:
            return False
    for br in range(2):
        for bc in range(2):
            if {board[br*2+dr][bc*2+dc] for dr in range(2) for dc in range(2)} != expected:
                return False
    return True


# ── Quick test ────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    # 2 empty cells — feasible on MPS simulator
    test_board = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 3, 4, 0],   # answer = 1
        [4, 1, 0, 3],   # answer = 2
    ]

    print("Running Grover's Search on 4x4 Sudoku (2 empty cells)...")
    for row in test_board:
        print(" ", row)

    result = run(test_board, shots=2048)

    print(f"\nQubits:        {result['qubits']}")
    print(f"Circuit depth: {result['circuit_depth']}")
    print(f"Oracle calls:  {result['oracle_calls']}")
    print(f"Valid:         {is_valid_solution(result['solution'])}")
    print("Solution:")
    for row in result['solution']:
        print(" ", row)

    print("\nTop 5 outcomes:")
    top5 = sorted(result['measurement_counts'].items(), key=lambda x: x[1], reverse=True)[:5]
    total = sum(result['measurement_counts'].values())
    for bs, cnt in top5:
        dec = decode_bitstring(bs)
        print(f"  {cnt:4d} shots ({cnt/total*100:5.1f}%)  "
              f"cell(2,3)={dec[2][3]}  cell(3,2)={dec[3][2]}  "
              f"valid={is_valid_solution(dec)}")
