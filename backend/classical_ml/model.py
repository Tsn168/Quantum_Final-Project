"""A small trained linear model for choosing the next Sudoku cell."""

import random
from collections.abc import Sequence


FeatureVector = tuple[float, float, float]


class CandidateOrderingModel:
    """Rank cells by learned branching usefulness."""

    def __init__(self, weights: Sequence[float]):
        if len(weights) != 4:
            raise ValueError("The model requires three feature weights and a bias.")
        self.weights = tuple(float(weight) for weight in weights)

    def predict(self, features: FeatureVector) -> float:
        """Return the learned score for a candidate cell."""
        return self.weights[0] + sum(
            weight * feature for weight, feature in zip(self.weights[1:], features)
        )


def train_model(seed: int = 271828) -> CandidateOrderingModel:
    """Fit a linear ranker on synthetic constraint-state examples.

    The training target favors cells with fewer legal values and more constrained
    peers. Exact Sudoku constraints still determine every assignment.
    """
    rng = random.Random(seed)
    samples: list[tuple[FeatureVector, float]] = []
    for _ in range(1200):
        candidates = rng.randint(1, 9) / 9
        unresolved_peers = rng.randint(0, 20) / 20
        forced_peers = rng.randint(0, 8) / 8
        features = (candidates, unresolved_peers, forced_peers)
        target = -candidates + 0.08 * unresolved_peers + 0.2 * forced_peers
        samples.append((features, target))

    weights = [0.0, 0.0, 0.0, 0.0]
    learning_rate = 0.08
    for _ in range(160):
        rng.shuffle(samples)
        for features, target in samples:
            prediction = weights[0] + sum(
                weights[index + 1] * features[index] for index in range(3)
            )
            error = prediction - target
            weights[0] -= learning_rate * error
            for index, feature in enumerate(features):
                weights[index + 1] -= learning_rate * error * feature
    return CandidateOrderingModel(weights)


MODEL = train_model()
