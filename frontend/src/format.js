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
  circuit_evaluations: 'Circuit evaluations',
};

export function metricLabel(metric) {
  return METRIC_LABELS[metric] ?? metric;
}
