#!/usr/bin/env bash
# Generate traffic against the running service so the dashboards show live data.
# Usage: ./scripts/generate-traffic.sh [requests] [base_url]

set -euo pipefail

COUNT="${1:-500}"
BASE_URL="${2:-http://localhost:8080}"

echo "Sending ${COUNT} requests to ${BASE_URL} ..."
for i in $(seq 1 "${COUNT}"); do
  curl -s -o /dev/null "${BASE_URL}/" || true
  curl -s -o /dev/null "${BASE_URL}/health" || true
  # Occasionally hit an unknown route to produce some 404 error metrics.
  if (( i % 10 == 0 )); then
    curl -s -o /dev/null "${BASE_URL}/does-not-exist" || true
  fi
  sleep 0.05
done
echo "Done."
