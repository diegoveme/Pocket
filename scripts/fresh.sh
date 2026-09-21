#!/usr/bin/env bash
set -e

PORT=3000
PIDS=$(lsof -ti:"$PORT" 2>/dev/null || true)

if [ -n "$PIDS" ]; then
  echo "Closing port $PORT..."
  echo "$PIDS" | xargs kill -9 2>/dev/null || true
  sleep 0.3
fi

echo "Starting dev server on http://localhost:$PORT"
exec npx next dev -p "$PORT"
