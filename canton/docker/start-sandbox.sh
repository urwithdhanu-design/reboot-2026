#!/usr/bin/env bash
set -euo pipefail

DAR_PATH="${DAR_PATH:-/sandbox/gcul-policy.dar}"
LEDGER_PORT="${LEDGER_PORT:-6865}"
JSON_PORT="${JSON_PORT:-7575}"

echo "Starting Daml sandbox with $DAR_PATH on port $LEDGER_PORT ..."
daml sandbox --port "$LEDGER_PORT" --dar "$DAR_PATH" --wall-clock-time 2>&1 | tee /sandbox/sandbox.log &
SANDBOX_PID=$!

echo "Waiting for sandbox gRPC on port $LEDGER_PORT ..."
for i in $(seq 1 90); do
  if bash -c "echo > /dev/tcp/localhost/$LEDGER_PORT" 2>/dev/null; then
    echo "Port $LEDGER_PORT is open (attempt $i)"
    break
  fi
  sleep 2
done

echo "Waiting for Canton sandbox to be fully ready ..."
for i in $(seq 1 60); do
  if grep -q "Canton sandbox is ready" /sandbox/sandbox.log 2>/dev/null; then
    echo "Sandbox ready after $i checks"
    break
  fi
  sleep 2
done
sleep 5

echo "Running init script (allocate parties + insurer mint authority) ..."
for attempt in 1 2 3 4 5; do
  if daml script \
    --dar "$DAR_PATH" \
    --script-name Gcul.Setup:initialize \
    --ledger-host localhost \
    --ledger-port "$LEDGER_PORT"; then
    echo "Init script succeeded on attempt $attempt"
    break
  fi
  echo "Init script attempt $attempt failed — retrying in 5s ..."
  sleep 5
  if [ "$attempt" -eq 5 ]; then
    echo "Init script failed after 5 attempts"
    exit 1
  fi
done

echo "Starting JSON Ledger API on port $JSON_PORT ..."
daml json-api \
  --ledger-host localhost \
  --ledger-port "$LEDGER_PORT" \
  --http-port "$JSON_PORT" \
  --address 0.0.0.0 \
  --allow-insecure-tokens &

echo "Canton local sandbox ready."
echo "  Ledger API (gRPC): localhost:$LEDGER_PORT"
echo "  JSON Ledger API:   http://0.0.0.0:$JSON_PORT"

wait "$SANDBOX_PID"
