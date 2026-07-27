#!/usr/bin/env bash
set -euo pipefail

DAR_PATH="${DAR_PATH:-/sandbox/gcul-policy.dar}"
LEDGER_PORT="${LEDGER_PORT:-6865}"
# Cloud Run sets PORT; local docker-compose uses 7575.
JSON_PORT="${PORT:-${JSON_PORT:-7575}}"
HEALTH_PID=""

start_health_gate() {
  python3 - <<'PY' &
import os
import socket
import threading

port = int(os.environ.get("PORT", "8080"))

def serve():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", port))
    server.listen(8)
    while True:
        conn, _ = server.accept()
        try:
            conn.recv(4096)
            body = b"starting"
            response = (
                b"HTTP/1.1 200 OK\r\n"
                b"Content-Type: text/plain\r\n"
                b"Content-Length: " + str(len(body)).encode() + b"\r\n"
                b"Connection: close\r\n\r\n" + body
            )
            conn.sendall(response)
        finally:
            conn.close()

threading.Thread(target=serve, daemon=True).start()
import time
while True:
    time.sleep(3600)
PY
  HEALTH_PID=$!
  echo "Started Cloud Run health gate on port $JSON_PORT (pid $HEALTH_PID)"
}

stop_health_gate() {
  if [ -n "$HEALTH_PID" ]; then
    kill "$HEALTH_PID" 2>/dev/null || true
    wait "$HEALTH_PID" 2>/dev/null || true
    HEALTH_PID=""
  fi
}

if [ -n "${PORT:-}" ] && [ "$JSON_PORT" = "$PORT" ]; then
  start_health_gate
fi

echo "Starting Daml sandbox with $DAR_PATH on port $LEDGER_PORT ..."
daml sandbox --port "$LEDGER_PORT" --dar "$DAR_PATH" --wall-clock-time >> /sandbox/sandbox.log 2>&1 &
SANDBOX_PID=$!

echo "Waiting for sandbox gRPC on port $LEDGER_PORT ..."
GRPC_READY=0
for i in $(seq 1 120); do
  if ! kill -0 "$SANDBOX_PID" 2>/dev/null; then
    echo "Sandbox process exited before gRPC was ready"
    tail -n 80 /sandbox/sandbox.log 2>/dev/null || true
    exit 1
  fi
  if bash -c "echo > /dev/tcp/localhost/$LEDGER_PORT" 2>/dev/null; then
    echo "Port $LEDGER_PORT is open (attempt $i)"
    GRPC_READY=1
    break
  fi
  sleep 3
done
if [ "$GRPC_READY" -ne 1 ]; then
  echo "Timed out waiting for sandbox gRPC on port $LEDGER_PORT"
  tail -n 80 /sandbox/sandbox.log 2>/dev/null || true
  exit 1
fi

echo "Waiting for Canton sandbox to be fully ready ..."
READY=0
for i in $(seq 1 120); do
  if ! kill -0 "$SANDBOX_PID" 2>/dev/null; then
    echo "Sandbox process exited while waiting for readiness"
    tail -n 80 /sandbox/sandbox.log 2>/dev/null || true
    exit 1
  fi
  if grep -q "Canton sandbox is ready" /sandbox/sandbox.log 2>/dev/null; then
    echo "Sandbox ready after $i checks"
    READY=1
    break
  fi
  sleep 3
done
if [ "$READY" -ne 1 ]; then
  echo "Timed out waiting for Canton sandbox readiness log line"
  tail -n 80 /sandbox/sandbox.log 2>/dev/null || true
  exit 1
fi
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
stop_health_gate
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
