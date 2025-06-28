#!/bin/bash

echo "🚀 Starting Cushion Development Environment"
echo "=========================================="

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services
echo "Waiting for services to be ready..."
sleep 5

# Start backend
echo "Starting backend server..."
cd backend
pnpm dev:mock &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start frontend
echo "Starting frontend server..."
cd ../frontend
pnpm dev &
FRONTEND_PID=$!

echo "=========================================="
echo "✅ Development environment started!"
echo ""
echo "📍 Services:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:3001"
echo "  - Database: localhost:5432"
echo "  - Redis:    localhost:6379"
echo ""
echo "📝 Logs:"
echo "  - Backend PID: $BACKEND_PID"
echo "  - Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C and cleanup
trap cleanup INT

cleanup() {
    echo -e "\n\n🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    docker-compose down
    echo "✅ All services stopped"
    exit 0
}

# Wait for interrupt
wait