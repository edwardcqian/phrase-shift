#!/bin/bash
set -e

export PATH="/opt/homebrew/bin:$PATH"

echo "Starting Phrase Shift..."

# Start PostgreSQL
echo "Starting PostgreSQL..."
docker compose up -d
sleep 2

# Start backend
echo "Starting backend on :8080..."
cd backend && go run . &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend on :5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "App running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services."

cleanup() {
  echo "Stopping..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  docker compose stop
}
trap cleanup EXIT INT TERM

wait
