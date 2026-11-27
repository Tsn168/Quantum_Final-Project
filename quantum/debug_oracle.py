# debug_oracle.py
# Owner: Somnang
#
# Step 1 — verify add_neq_check in isolation (16 combinations)
# Step 2 — verify the oracle is reversible (all ancillas return to |0>)
# Step 3 — full Grover with 1 empty cell  (N=4,  should give 100%)
# Step 4 — full Grover with 2 empty cells (N=16, correct state should dominate)

import sys
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit_aer import AerSimulator
from encoder import decode_bitstring, VALUE_TO_BITS
from grover import add_neq_check, is_valid_solution


SIMULATOR_SV  = AerSimulator(method='statevector')
SIMULATOR_MPS = AerSimulator(method='matrix_product_state')


# ── STEP 1 — add_neq_check in isolation ──────────────────────────────────────

def test_neq_check():
    print("=" * 60)
    print("STEP 1 — add_neq_check: all 16 (A,B) combinations")
    print("=" * 60)

    passed, failed = 0, 0
    for val_a in range(1, 5):
        for val_b in range(1, 5):
            la, ha = VALUE_TO_BITS[val_a]
            lb, hb = VALUE_TO_BITS[val_b]

            qc = QuantumCircuit(7, 1)
            if la: qc.x(0)
            if ha: qc.x(1)
            if lb: qc.x(2)
            if hb: qc.x(3)

            add_neq_check(qc, (0, 1), (2, 3), [4, 5, 6])
            qc.measure(6, 0)

            counts = SIMULATOR_SV.run(transpile(qc, SIMULATOR_SV), shots=256).result().get_counts()
            got      = int(max(counts, key=counts.get))
            expected = 1 if val_a == val_b else 0
            ok       = got == expected

            if ok: passed += 1
            else:  failed += 1

            print(f"  {'✅' if ok else '❌'}  A={val_a} B={val_b}  "
                  f"got={got} expected={expected}")

    print(f"\n  {passed}/16 passed\n")
    return failed == 0


# ── STEP 2 — Oracle marks only valid boards ───────────────────────────────────

def test_oracle_clean_ancillas():
    """
    Reversibility test. Put the empty cell qubits in full superposition,
    apply the oracle once, and measure every ancilla. A correct oracle is
    a pure phase gate on the data register, so all ancillas must collapse
    to |0> with probability 1 for every branch.

    This catches dirty scratch qubits and un-uncomputed accumulators.
    """
    print("=" * 60)
    print("STEP 2 — Oracle is reversible (all ancillas return to |0>)")
    print("=" * 60)

    from grover import build_oracle, active_constraint_pairs
    from encoder import encode_board, cell_qubits

    TOTAL = 32

    board = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 3, 4, 0],
        [4, 1, 0, 3],
    ]
    givens, empty_cells = encode_board(board)
    n_anc = 3 + len(active_constraint_pairs(empty_cells)) + 1

    data  = QuantumRegister(TOTAL,  'data')
    anc   = QuantumRegister(n_anc,  'anc')
    phase = QuantumRegister(1,      'phase')
    meas  = ClassicalRegister(n_anc, 'meas')

    qc = QuantumCircuit(data, anc, phase, meas)

    for qubit_idx, bit_val in givens:
        if bit_val == 1:
            qc.x(data[qubit_idx])

    for (row, col) in empty_cells:
        lq, hq = cell_qubits(row, col)
        qc.h(data[lq])
        qc.h(data[hq])

    qc.x(phase[0])
    qc.h(phase[0])

    build_oracle(qc, data, anc, phase[0], empty_cells)

    qc.measure(anc, meas)
    qc_t   = transpile(qc, SIMULATOR_MPS)
    counts = SIMULATOR_MPS.run(qc_t, shots=512).result().get_counts()

    zero_state = '0' * n_anc
    clean = counts.get(zero_state, 0) == sum(counts.values())

    print(f"  ancillas: {n_anc}  |  outcomes: {list(counts)[:3]}"
          f"{' …' if len(counts) > 3 else ''}")
    print(f"  All ancillas |0>: {clean}  {'✅' if clean else '❌'}")
    print()
    return clean


# ── STEP 3 — Grover, 1 empty cell ────────────────────────────────────────────

def test_one_empty():
    print("=" * 60)
    print("STEP 3 — Grover: 1 empty cell (N=4, 1 iteration)")
    print("=" * 60)

    from grover import build_grover_circuit

    board = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 3, 4, 1],
        [4, 1, 2, 0],   # answer = 3
    ]

    print("Board:", board[-1], "← row 3")
    print(f"Expected cell(3,3) = 3\n")

    qc, _ = build_grover_circuit(board, num_iterations=1)
    qc_t  = transpile(qc, SIMULATOR_MPS)
    counts = SIMULATOR_MPS.run(qc_t, shots=1024).result().get_counts()

    top3 = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:3]
    total = sum(counts.values())
    passed = False
    for bs, cnt in top3:
        dec   = decode_bitstring(bs)
        valid = is_valid_solution(dec)
        correct = dec[3][3] == 3
        if correct and valid: passed = True
        print(f"  {cnt:4d} ({cnt/total*100:5.1f}%)  cell(3,3)={dec[3][3]}  "
              f"valid={valid}  {'✅' if correct else '❌'}")

    print(f"\n  Result: {'✅ PASSED' if passed else '❌ FAILED'}\n")
    return passed


# ── STEP 4 — Grover, 2 empty cells ───────────────────────────────────────────

def test_two_empty():
    print("=" * 60)
    print("STEP 4 — Grover: 2 empty cells (N=16, 3 iterations)")
    print("=" * 60)

    from grover import build_grover_circuit

    board = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 3, 4, 0],   # answer = 1
        [4, 1, 0, 3],   # answer = 2
    ]

    print("Board (0=empty):")
    for row in board:
        print(" ", row)
    print(f"Expected: cell(2,3)=1  cell(3,2)=2\n")

    qc, _ = build_grover_circuit(board, num_iterations=3)
    qc_t  = transpile(qc, SIMULATOR_MPS)
    counts = SIMULATOR_MPS.run(qc_t, shots=2048).result().get_counts()

    top5  = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]
    total = sum(counts.values())
    passed = False
    for bs, cnt in top5:
        dec   = decode_bitstring(bs)
        valid = is_valid_solution(dec)
        correct = dec[2][3] == 1 and dec[3][2] == 2
        if correct and valid: passed = True
        print(f"  {cnt:4d} ({cnt/total*100:5.1f}%)  "
              f"cell(2,3)={dec[2][3]}  cell(3,2)={dec[3][2]}  "
              f"valid={valid}  {'✅' if correct else '❌'}")

    print(f"\n  Uniform baseline = {100/16:.1f}% per state")
    print(f"  Result: {'✅ PASSED — correct state dominates' if passed else '❌ FAILED — still uniform'}\n")
    return passed


# ── Run all ───────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    r1 = test_neq_check()
    r2 = test_oracle_clean_ancillas()
    r3 = test_one_empty()
    r4 = test_two_empty()

    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for label, r in [("Step 1 — neq_check",        r1),
                     ("Step 2 — oracle reversible",  r2),
                     ("Step 3 — 1 empty cell",       r3),
                     ("Step 4 — 2 empty cells",      r4)]:
        print(f"  {'✅' if r else '❌'}  {label}")

    all_ok = all([r1, r2, r3, r4])
    print(f"\n  {'✅ All passed — oracle is correct!' if all_ok else '❌ See failures above.'}")
    sys.exit(0 if all_ok else 1)
