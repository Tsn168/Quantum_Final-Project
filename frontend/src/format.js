// format.js
// Owner: Reach
// Small display helpers shared by the race panels and the results screen.

export function formatMs(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

const METRIC_LABELS = {
  checks: 'Rule checks',
  oracle_calls: 'Oracle calls',
  circuit_evaluations: 'Circuit runs',
};

export function metricLabel(metric) {
  return METRIC_LABELS[metric] ?? metric;
}

const ALGORITHM_NAMES = {
  brute_force: 'Brute-force search',
  backtracking: 'Backtracking',
  ml: 'Machine learning',
  grover: 'Grover’s search',
  qaoa: 'QAOA',
};

export function algorithmName(algorithm) {
  return ALGORITHM_NAMES[algorithm] ?? algorithm;
}

const MODE_NAMES = {
  ideal: 'ideal simulator',
  noisy: 'noisy simulator',
  mitigated: 'noisy, with error mitigation',
};

export function modeName(mode) {
  return MODE_NAMES[mode] ?? mode;
}
