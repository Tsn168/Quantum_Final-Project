# encoder.py
# Owner: Nike (Somnang coordinates the format used by the oracle)
#
# Converts a 4x4 Sudoku board into qubit initialization format.
#
# Encoding scheme:
#   - 16 cells total (4 rows x 4 cols)
#   - 2 qubits per cell  →  32 qubits total
#   - Cell values 1–4 map to 2-bit binary:
#       1 → 00
#       2 → 01
#       3 → 10
#       4 → 11
#   - Empty cells (0) are left as superposition (not initialized)
#
# Qubit index for cell (row, col):
#   qubit_index = (row * 4 + col) * 2       ← low bit
#   qubit_index = (row * 4 + col) * 2 + 1   ← high bit
#
# Example 4x4 board (0 = empty):
#   [[1, 0, 0, 4],
#    [0, 4, 1, 0],
#    [0, 1, 4, 0],
#    [4, 0, 0, 1]]

VALUE_TO_BITS = {
    1: (0, 0),   # 1 → 00
    2: (0, 1),   # 2 → 01
    3: (1, 0),   # 3 → 10
    4: (1, 1),   # 4 → 11
}

BITS_TO_VALUE = {v: k for k, v in VALUE_TO_BITS.items()}


def cell_qubits(row, col):
    """Return the (low_qubit, high_qubit) indices for cell (row, col)."""
    base = (row * 4 + col) * 2
    return base, base + 1


def encode_board(board):
    """
    Convert a 4x4 board into a list of (qubit_index, bit_value) pairs
    for all GIVEN cells (non-zero). Empty cells are excluded — the
    circuit will put those into superposition.

    Returns:
        givens: list of (qubit_index, bit_value) — to be set via
                QuantumCircuit.initialize() or X gates
        empty_cells: list of (row, col) — cells the oracle must solve
    """
    givens = []
    empty_cells = []

    for row in range(4):
        for col in range(4):
            val = board[row][col]
            if val == 0:
                empty_cells.append((row, col))
            else:
                low_q, high_q = cell_qubits(row, col)
                low_bit, high_bit = VALUE_TO_BITS[val]
                givens.append((low_q,  low_bit))
                givens.append((high_q, high_bit))

    return givens, empty_cells


def decode_bitstring(bitstring):
    """
    Convert a 32-bit measurement bitstring back into a 4x4 board.

    Qiskit returns bitstrings in little-endian order (qubit 0 is the
    rightmost character), so we reverse before reading.

    Returns a 4x4 list of integers (1–4).
    """
    # Qiskit bitstrings: rightmost char = qubit 0
    bits = list(reversed(bitstring))   # now bits[i] = qubit i

    board = []
    for row in range(4):
        board_row = []
        for col in range(4):
            low_q, high_q = cell_qubits(row, col)
            low_bit  = int(bits[low_q])
            high_bit = int(bits[high_q])
            value = BITS_TO_VALUE.get((low_bit, high_bit))
            board_row.append(value)
        board.append(board_row)

    return board


def validate_encoding(board):
    """
    Quick sanity check: encode then decode the given cells and confirm
    the values round-trip correctly.

    Returns True if all given cells match after decode, False otherwise.
    """
    givens, _ = encode_board(board)

    # Reconstruct a 32-bit string from the givens only
    bits = ['0'] * 32
    for qubit_idx, bit_val in givens:
        bits[qubit_idx] = str(bit_val)

    bitstring = ''.join(reversed(bits))   # back to Qiskit little-endian
    decoded = decode_bitstring(bitstring)

    for row in range(4):
        for col in range(4):
            if board[row][col] != 0:
                if decoded[row][col] != board[row][col]:
                    return False
    return True


# ── Quick self-test ───────────────────────────────────────────────────────────
if __name__ == '__main__':
    test_board = [
        [1, 0, 0, 4],
        [0, 4, 1, 0],
        [0, 1, 4, 0],
        [4, 0, 0, 1],
    ]

    givens, empty_cells = encode_board(test_board)
    print(f"Given qubits ({len(givens)} entries): {givens}")
    print(f"Empty cells to solve: {empty_cells}")
    print(f"Round-trip valid: {validate_encoding(test_board)}")

    # Show qubit layout
    print("\nQubit layout:")
    for row in range(4):
        for col in range(4):
            lq, hq = cell_qubits(row, col)
            print(f"  cell({row},{col}) value={test_board[row][col]}  "
                  f"→ qubits [{lq},{hq}]")
