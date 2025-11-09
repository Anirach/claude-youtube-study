#!/bin/sh

set -e

echo "Starting YouTube Study App..."

# Initialize database
echo "Initializing database..."
cd /app/backend
npx prisma db push --accept-data-loss

# Start backend in background
echo "Starting backend..."
cd /app/backend
node src/server.js &

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 5

# Start frontend
echo "Starting frontend..."
cd /app/frontend
npm start
